"use client";

import { useState, useEffect } from "react";
import { getErrorMessage } from "@/lib/getError";
import { toast } from "react-toastify";
import axios from "axios";
import { User, Mail, Loader2, Building, Briefcase, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Company {
  _id: string;
  company_name: string;
  pan_no: string;
}

function Settings() {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
  });
  const [formData, setFormData] = useState({
    company_name: "",
    pan_no: "",
  });
  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "companies", label: "Companies", icon: Building },
  ];

  const [loading, setLoading] = useState(true);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await axios.post("/api/company/set-company", formData, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success(response.data.message);
      setFormData({ company_name: "", pan_no: "" });
      fetchCompanies();
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(message);
      console.error(message, err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setIsLoadingCompanies(true);
      const response = await axios.get("/api/company/get-companies");
      setCompanies(response.data.companies || []);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      const message = getErrorMessage(err);
      toast.error(message);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const res = await axios.get(`/api/auth/me`, {
          withCredentials: true,
        });
        setUserData({
          username: res.data.user.username,
          email: res.data.user.email,
        });
      } catch (err) {
        const message = getErrorMessage(err);
        console.error(message, err);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
    fetchCompanies();
  }, []);

  return (
    <section className="min-h-screen">
      <div className="px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
          <p className="text-gray-400 ">Manage your account and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            {/* Personal Information Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3 mb-2 ">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Personal Information
                    </h2>
                    <p className="text-sm text-gray-400">
                      Your personal details
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    {loading ? (
                      <div className="w-full h-11 bg-white/20 rounded-xl animate-pulse"></div>
                    ) : (
                      <input
                        type="text"
                        readOnly
                        value={userData.username}
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white cursor-not-allowed"
                      />
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    {loading ? (
                      <div className="w-full h-11 bg-white/5 rounded-xl animate-pulse"></div>
                    ) : (
                      <input
                        type="email"
                        readOnly
                        value={userData.email}
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white cursor-not-allowed"
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Companies Tab */}
        {activeTab === "companies" && (
          <div className="space-y-6">
            {/* Add New Company Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Add New Company
                  </h2>
                  <p className="text-sm text-gray-400">
                    Register your company details
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Company Name *
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={formData.company_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            company_name: e.target.value,
                          })
                        }
                        placeholder="Rebuzz"
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* PAN Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      PAN Number *
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={formData.pan_no}
                        onChange={(e) =>
                          setFormData({ ...formData, pan_no: e.target.value })
                        }
                        placeholder="ABCDE1234F"
                        className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add Company
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Companies List */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Your Companies ({companies.length})
              </h2>

              {isLoadingCompanies ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-18 bg-white/5 rounded-xl animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {companies.map((company) => (
                    <div
                      key={company._id}
                      className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 "
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                          <Building className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate">
                            {company.company_name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-sm text-gray-400">
                              PAN: {company.pan_no}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Settings;
