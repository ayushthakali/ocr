"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useState,
  useContext,
  useEffect,
} from "react";
import axios from "axios";
import { useCompany } from "./contextCompany";
import { toast } from "react-toastify";

interface FormDataType {
  from: string;
  to: string;
}

interface Receipt {
  doc_id: string;
  created_at: string;
  image_url: string;
  document_type: string;
}

interface GalleryContextType {
  receipts: Receipt[];
  isLoading: boolean;
  isDownloading: boolean;
  selectedReceipt: Receipt;
  formData: FormDataType;
  setFormData: (formData: FormDataType) => void;
  handleDownloadCSV: () => Promise<void>;
  handleSearch: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  handlePreview: (selectedReceipt: Receipt) => void;
  showPreview: boolean;
  setShowPreview: (showPreview: boolean) => void;
  refreshGallery: () => void;
}

const GalleryContext = createContext<GalleryContextType | undefined>(undefined);

export function GalleryProvider({ children }: { children: ReactNode }) {
  const { selectedCompany, setIsGalleryLoading } = useCompany();

  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormDataType>({
    from: "",
    to: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt>({
    doc_id: "",
    created_at: "",
    image_url: "",
    document_type: "",
  });

  const fetchImageUrl = useCallback(async () => {
    if (!selectedCompany?._id) {
      console.log("Waiting for company to load...");
      setIsLoading(false);
      return;
    }

    try {
      setIsGalleryLoading(true);
      const res = await axios.get("/api/gallery", {
        headers: {
          "Content-Type": "application/json",
          "X-Active-Company": selectedCompany._id,
        },
      });
      setReceipts(res.data);
    } catch (err) {
      console.error("Failed to fetch images!! API Error: ", err);
    } finally {
      setIsLoading(false);
      setIsGalleryLoading(false);
    }
  }, [selectedCompany, setIsLoading, setIsGalleryLoading]);

  // Initial images fetching
  useEffect(() => {
    fetchImageUrl();
  }, [fetchImageUrl]);

  //Downloading CSV
  const handleDownloadCSV = useCallback(async () => {
    try {
      setIsDownloading(true);
      setIsGalleryLoading(true);

      const response = await axios.get(
        `/api/generate-csv/${selectedReceipt.doc_id}`,
        {
          headers: {
            "X-Active-Company": selectedCompany._id,
          },
          responseType: "blob",
        }
      );

      // Extract filename from headers
      const filenameHeader = response.headers["content-disposition"];
      let filename = "";
      const fileNameMatch = filenameHeader.match(/filename="(.+)"/);
      if (fileNameMatch) {
        filename = fileNameMatch[1];
      }

      // Create Blob and download
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.href = url;
      link.download = filename;
      link.style.display = "none";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download Excel:", error);
      alert("Failed to download Excel. Please try again.");
    } finally {
      setIsDownloading(false);
      setIsGalleryLoading(true);
    }
  }, [selectedReceipt, selectedCompany, setIsGalleryLoading]);

  //Preview
  const handlePreview = (selectedRecp: Receipt) => {
    setSelectedReceipt(selectedRecp);
    setShowPreview(true);
  };

  // Filter by date
  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (new Date(formData.from) > new Date(formData.to)) {
      toast.error("From date should be earlier than To date!");
      return;
    }

    try {
      setIsGalleryLoading(true);
      setIsLoading(true);
      const response = await axios.post("/api/search-document", formData, {
        headers: {
          "X-Active-Company": selectedCompany._id,
          "Content-Type": "application/json",
        },
      });
      setReceipts(response.data);
    } catch (err) {
      console.error("Failed to fetch filtered docs.", err);
    } finally {
      setIsLoading(false);
      setIsGalleryLoading(false);
    }
  };

  // Refresh Gallery after upload
  const refreshGallery = useCallback(() => {
    fetchImageUrl();
  }, [fetchImageUrl]);

  return (
    <GalleryContext.Provider
      value={{
        receipts,
        handleDownloadCSV,
        handlePreview,
        handleSearch,
        isLoading,
        isDownloading,
        selectedReceipt,
        setFormData,
        formData,
        setShowPreview,
        showPreview,
        refreshGallery,
      }}
    >
      {children}
    </GalleryContext.Provider>
  );
}

export function useGallery() {
  const context = useContext(GalleryContext);
  if (context === undefined) {
    throw new Error("useGallery must be used within an GalleryProvider");
  }
  return context;
}
