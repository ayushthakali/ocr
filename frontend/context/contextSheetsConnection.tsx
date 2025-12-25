"use client";

import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useCompany } from "./contextCompany";
import axios from "axios";
import { getErrorMessage } from "@/lib/getError";
import { toast } from "react-toastify";

interface SheetsContextType {
  isChecking: boolean;
  resData: SheetStatusResponse;
  handleConnect: () => Promise<void>;
  createNewSheet: () => Promise<void>;
  disconnectSheet: () => Promise<void>;
  switchSheet: (sheet: Sheet) => Promise<void>;
  isSwitching: boolean;
  isProcessing: boolean;
  selectedSheet: Sheet;
}

interface SheetStatusResponse {
  connected: boolean;
  spreadsheet_name: string;
  spreadsheet_id: string;
  spreadsheet_url: string;
  history: {
    spreadsheet_id: string;
    spreadsheet_name: string;
    spreadsheet_url: string;
  }[];
}

interface Sheet {
  spreadsheet_name: string;
  spreadsheet_id: string;
  spreadsheet_url: string;
}

const SheetsContext = createContext<SheetsContextType | undefined>(undefined);

export function SheetsProvider({ children }: { children: ReactNode }) {
  const { selectedCompany, setIsConnectingSheets } = useCompany();
  const [isChecking, setIsChecking] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedSheet, setSelectedSheet] = useState<Sheet>({
    spreadsheet_id: "",
    spreadsheet_name: "",
    spreadsheet_url: "",
  });

  const [resData, setResData] = useState<SheetStatusResponse>({
    connected: false,
    spreadsheet_name: "",
    spreadsheet_id: "",
    spreadsheet_url: "",
    history: [],
  });

  //Check sheet connection
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

  useEffect(() => {
    checkSheetConnection();
  }, [checkSheetConnection]);

  useEffect(() => {
    setSelectedSheet({
      spreadsheet_id: resData.spreadsheet_id,
      spreadsheet_name: resData.spreadsheet_name,
      spreadsheet_url: resData.spreadsheet_url,
    });
  }, [resData]);

  // Connection to google sheets
  const handleConnect = useCallback(async () => {
    try {
      setIsConnectingSheets(true);
      setIsChecking(true);
      const response = await axios.get("/api/sheets/connect", {
        headers: {
          "X-Active-Company": selectedCompany._id,
          "X-Company-Name": selectedCompany.company_name,
        },
      });
      if (response.data.auth_url) {
        // Redirect to Google OAuth
        window.location.href = response.data.auth_url;
      } else {
        toast.error("Failed to initiate Google OAuth.");
      }
    } catch (error) {
      console.error("Error connecting Google Sheets:", error);
      toast.error("Failed to connect Google Sheets. Please try again.");
    } finally {
      setIsChecking(false);
      setIsConnectingSheets(false);
    }
  }, [selectedCompany, setIsConnectingSheets, setIsChecking]);

  // Switch google sheets
  const switchSheet = useCallback(
    async (sheet: Sheet) => {
      if (sheet.spreadsheet_id === selectedSheet.spreadsheet_id) {
        toast.info("This sheet is already active");
        return;
      }
      try {
        setIsSwitching(true);
        const response = await axios.post(
          `/api/sheets/switch-sheet`,
          { spreadsheet_id: sheet.spreadsheet_id },
          {
            headers: {
              "X-Active-Company": selectedCompany._id,
            },
          }
        );
        setSelectedSheet(sheet);
        toast.success(`Switched to ${response.data.sheet_name}`);
      } catch (error) {
        console.error("Error switching sheets:", error);
        toast.error("Failed to switch sheets. Please try again.");
      } finally {
        setIsSwitching(false);
      }
    },
    [selectedCompany, selectedSheet]
  );

  // Create new sheet
  const createNewSheet = useCallback(async () => {
    try {
      setIsProcessing(true);
      const response = await axios.post("/api/sheets/create-new-sheet", null, {
        headers: {
          "X-Active-Company": selectedCompany._id,
          "X-Company-Name": selectedCompany.company_name,
        },
      });
      toast.success(
        `New sheet: ${response.data.sheet_name} created successfully.`
      );
      //Reupdate the sheets UI
      await checkSheetConnection();
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(message, error);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedCompany, checkSheetConnection]);

  // Disconnect sheet
  const disconnectSheet = useCallback(async () => {
    try {
      setIsProcessing(true);
      await axios.post("/api/sheets/disconnect-sheet", null, {
        headers: {
          "X-Active-Company": selectedCompany._id,
        },
      });
      toast.success("Sheet disconnected successfully.");
      setResData({
        connected: false,
        spreadsheet_name: "",
        spreadsheet_id: "",
        spreadsheet_url: "",
        history: [],
      });
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(message, error);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedCompany]);

  return (
    <SheetsContext.Provider
      value={{
        isChecking,
        resData,
        handleConnect,
        switchSheet,
        isSwitching,
        isProcessing,
        selectedSheet,
        createNewSheet,
        disconnectSheet,
      }}
    >
      {children}
    </SheetsContext.Provider>
  );
}

export function useSheets() {
  const context = useContext(SheetsContext);
  if (context === undefined) {
    throw new Error("useSheets must be used within an SheetsProvider");
  }
  return context;
}
