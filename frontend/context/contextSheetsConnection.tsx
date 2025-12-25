import { createContext, useContext, ReactNode, useCallback } from "react";
import { useCompany } from "./contextCompany";

// const SheetsContext = createContext<SheetContextType | undefined>(undefined);
const SheetsContext = createContext<undefined>(undefined);

export function SheetsProvider({ children }: { children: ReactNode }) {
  const {
    selectedCompany,
    setIsUploading,
    isUploading,
    setIsConnectingSheets,
  } = useCompany();
  
  const checkSheetConnection = useCallback(async () => {
    if (!selectedCompany?._id) return;

    try {
      setIsConnectingSheets(true);
      const response = await axios.get("/api/sheets/status", {
        headers: {
          "X-Active-Company": selectedCompany._id,
        },
      });
      setResData(response.data);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(message, error);
      setResData({
        connected: false,
        spreadsheet_name: "",
        spreadsheet_id: "",
        spreadsheet_url: "",
        history: [],
      });
      toast.error(message);
    } finally {
      setIsChecking(false);
      setIsConnectingSheets(false);
    }
  }, [selectedCompany, setIsConnectingSheets]);

  return <SheetsContext.Provider value={}>{children}</SheetsContext.Provider>;
}

export function useSheets() {
  const context = useContext(SheetsContext);
  if (context === undefined) {
    throw new Error("useUpload must be used within an SheetsProvider");
  }
  return context;
}
