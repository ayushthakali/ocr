"use client";

import { Plus, Building, Loader2, Briefcase } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/getError";

function SetCompany() {
  const [formData, setFormData] = useState({
    company_name: "",
    pan_no: "",
  });
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await axios.post("/api/set-company", formData, {
        headers: { "Content-Type": "application/json" },
      });
      console.log(response.data.message);
      toast.success(response.data.message);
      setTimeout(() => {
        router.push("/chat");
      }, 1000);
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(message);
      console.error(message, err);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl ">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white ">
              Set Company Profile
            </h1>
            <p className="text-gray-400 text-sm">Add your company details.</p>
          </div>

          {/* Form Fields */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Company Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Company Name
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  placeholder="Brandbuilder"
                  className="w-full pl-11 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            {/* PAN Number Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                PAN Number
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.pan_no}
                  onChange={(e) =>
                    setFormData({ ...formData, pan_no: e.target.value })
                  }
                  placeholder="126331267"
                  className="w-full pl-11 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </span>
              ) : (
                "Add Company"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SetCompany;
