"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
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
  selectedCompany: Company | null;
  isLoading: boolean;
  isLoadingChat: boolean;
  isUploading: boolean;
  isSwitching: boolean;
  isPerformingTask: boolean;
  setSelectedCompany: (company: Company) => Promise<void>;
  fetchCompanies: () => Promise<void>;
  addCompany: (company: {
    company_name: string;
    pan_no: string;
  }) => Promise<boolean>;
  setIsChatting: (isChatting: boolean) => void;
  setIsLoadingChat: (LoadingChat: boolean) => void;
  setIsUploading: (isUploading: boolean) => void;
  setIsConnectingSheets: (isConnectingSheets: boolean) => void;
  setIsGalleryLoading: (isGalleryLoading: boolean) => void;
  setIsSheetsLoading: (isSheetsLoading: boolean) => void;
  deleteCompany: (companyId: string, company_name: string) => Promise<boolean>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isChatting, setIsChatting] = useState<boolean>(false);
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isSwitching, setIsSwitching] = useState<boolean>(false);
  const [isConnectingSheets, setIsConnectingSheets] = useState<boolean>(false);
  const [isGalleryLoading, setIsGalleryLoading] = useState<boolean>(false);
  const [isPerformingTask, setIsPerformingTask] = useState<boolean>(false);
  const [isSheetsLoading, setIsSheetsLoading] = useState<boolean>(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const isBusy = useMemo(
    () =>
      isSwitching ||
      isPerformingTask ||
      isChatting ||
      isUploading ||
      isGalleryLoading ||
      isConnectingSheets ||
      isSheetsLoading ||
      isLoadingChat,
    [
      isSwitching,
      isPerformingTask,
      isChatting,
      isUploading,
      isGalleryLoading,
      isConnectingSheets,
      isSheetsLoading,
      isLoadingChat,
    ]
  );

  //Fetch companies
  const fetchCompanies = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/company/get-companies");
      const fetchedCompanies = response.data.companies || [];
      setCompanies(fetchedCompanies);
      const storedValue = sessionStorage.getItem("Active_Company");
      const active_company = storedValue ? JSON.parse(storedValue) : null;
      setSelectedCompanyState(active_company || fetchedCompanies[0]);
    } catch (err) {
      console.error("Failed to fetch companies:", err);
      const message = getErrorMessage(err);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  //Handle company switching with freeze logic
  const setSelectedCompany = useCallback(
    async (company: Company) => {
      if (isBusy) {
        console.warn("Company switch blocked - another operation in progress.");
        toast.warning("Please wait for the current operation to complete.");
        return;
      }

      if (selectedCompany?._id === company._id) {
        toast.info("Already on this company");
        console.log("Already on this company");
        return;
      }

      try {
        setIsSwitching(true);
        setSelectedCompanyState(company);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("Active_Company", JSON.stringify(company));
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.success(`Switched to ${company.company_name}`);
      } catch (err) {
        console.error("Error switching company:", err);
        toast.error("Failed to switch company.");
      } finally {
        setIsSwitching(false);
      }
    },
    [isBusy, selectedCompany]
  );

  // Add new company
  const addCompany = useCallback(
    async (companyData: {
      company_name: string;
      pan_no: string;
    }): Promise<boolean> => {
      try {
        setIsPerformingTask(true); // Freeze switching
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
      } finally {
        setIsPerformingTask(false);
      }
    },
    [fetchCompanies]
  );

  // Delete an existing company
  const deleteCompany = useCallback(
    async (companyId: string, company_name: string): Promise<boolean> => {
      if (companyId === selectedCompany?._id) {
        toast.warning(
          "Cannot delete an active company. Please switch the company first.",
          { autoClose: 2800 }
        );
        return false;
      }

      try {
        setIsPerformingTask(true);
        await axios.delete(`/api/company/delete-company/${companyId}`);
        toast.success(`Company: ${company_name} deleted successfully`);
        await fetchCompanies();
        const storedValue = sessionStorage.getItem("Active_Company");
        const activeCompany = storedValue ? JSON.parse(storedValue) : null;
        if (activeCompany._id === companyId) {
          sessionStorage.removeItem("Active_Company");
        }
        return true;
      } catch (err) {
        const message = getErrorMessage(err);
        toast.error(message);
        return false;
      } finally {
        setIsPerformingTask(false);
      }
    },
    [fetchCompanies, selectedCompany]
  );

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const contextValue = useMemo(
    () => ({
      companies,
      selectedCompany,
      isLoading,
      isLoadingChat,
      isSwitching,
      isUploading,
      isPerformingTask,
      setSelectedCompany,
      fetchCompanies,
      addCompany,
      deleteCompany,
      setIsChatting,
      setIsLoadingChat,
      setIsUploading,
      setIsGalleryLoading,
      setIsConnectingSheets,
      setIsSheetsLoading,
    }),
    [
      companies,
      selectedCompany,
      isLoading,
      isLoadingChat,
      isSwitching,
      isUploading,
      isPerformingTask,
      setSelectedCompany,
      fetchCompanies,
      addCompany,
      deleteCompany,
    ]
  );
  return (
    <CompanyContext.Provider value={contextValue}>
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
