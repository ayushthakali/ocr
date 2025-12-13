"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/getError";

interface Company {
  _id: string;
  company_name: string;
  pan_no: string;
}

interface CompanyContextType {
  companies: Company[];
  selectedCompany: string;
  isLoading: boolean;
  setSelectedCompany: (company: string) => void;
  fetchCompanies: () => Promise<void>;
  addCompany: (company: {
    company_name: string;
    pan_no: string;
  }) => Promise<boolean>;
  deleteCompany: (companyId: string, company_name: string) => Promise<boolean>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);


  const fetchCompanies = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/company/get-companies");
      const fetchedCompanies = response.data.companies || [];
      setCompanies(fetchedCompanies);
      setSelectedCompany(fetchedCompanies[0].company_name);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      const message = getErrorMessage(err);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addCompany = async (companyData: {
    company_name: string;
    pan_no: string;
  }): Promise<boolean> => {
    try {
      const response = await axios.post(
        "/api/company/set-company",
        companyData,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      toast.success(response.data.message || "Company added successfully!");
      await fetchCompanies();
      return true;
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(message);
      return false;
    }
  };

  const deleteCompany = async (
    companyId: string,
    company_name: string
  ): Promise<boolean> => {
    try {
      await axios.delete(`/api/company/delete-company/${companyId}`);
      toast.success(`Company: ${company_name} deleted successfully`);
      await fetchCompanies();
      return true;
    } catch (err) {
      const message = getErrorMessage(err);
      toast.error(message);
      return false;
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return (
    <CompanyContext.Provider
      value={{
        companies,
        selectedCompany,
        isLoading,
        setSelectedCompany,
        fetchCompanies,
        addCompany,
        deleteCompany,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider");
  }
  return context;
};
