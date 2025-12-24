"use client";
import {
  AlertTriangle,
  CircleCheck,
  FileText,
  ChevronDown,
  Loader2,
} from "lucide-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useCompany } from "@/context/contextCompany";
import { toast } from "react-toastify";
import { getErrorMessage } from "@/lib/getError";
import { DialogComp } from "@/components/Dialog";

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

function SheetsConnection({
  resData,
  setResData,
  isChecking,
  handleConnect,
  isSwitching,
  setIsSwitching,
}: {
  resData: SheetStatusResponse;
  setResData: (resData: SheetStatusResponse) => void;
  isChecking: boolean;
  handleConnect: () => void;
  isSwitching: boolean;
  setIsSwitching: (isSwitching: boolean) => void;
}) {
  const [isSheetsDropdownOpen, setIsSheetsDropdownOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { selectedCompany } = useCompany();
  const [selectedSheet, setSelectedSheet] = useState<Sheet>({
    spreadsheet_id: "",
    spreadsheet_name: "",
    spreadsheet_url: "",
  });

  useEffect(() => {
    setSelectedSheet({
      spreadsheet_id: resData.spreadsheet_id,
      spreadsheet_name: resData.spreadsheet_name,
      spreadsheet_url: resData.spreadsheet_url,
    });
  }, [resData]);

  // Create new sheet
  const createNewSheet = async () => {
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
      const statusResponse = await axios.get("/api/sheets/status", {
        headers: {
          "X-Active-Company": selectedCompany._id,
        },
      });

      // Update resData with fresh data from backend
      setResData(statusResponse.data);

      // Update selected sheet if backend returns the new sheet info
      if (response.data) {
        setSelectedSheet({
          spreadsheet_id: response.data.spreadsheet_id,
          spreadsheet_name: response.data.spreadsheet_name,
          spreadsheet_url: response.data.spreadsheet_url,
        });
      }
    } catch (error) {
      const message = getErrorMessage(error);
      console.error(message, error);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Disconnect sheet
  const disconnectSheet = async () => {
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
  };

  // Switch google sheets
  const switchSheet = async (sheet: Sheet) => {
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
  };

  return (
    <div className="relative z-10 text-white mb-8 w-full">
      {isChecking && (
        <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="relative">
                <div className="p-3 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                  <FileText className="w-8 h-8 " />
                </div>

                <div className="absolute inset-0 animate-ping bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg" />
              </div>
              {/* Text content */}
              <div className="space-x-2">
                <h2 className="font-semibold text-xl">
                  Checking Google Sheets Connection
                </h2>
                <p className="text-sm text-white/70 animate-pulse">
                  Establishing secure connection...
                </p>
              </div>
            </div>

            {/* Loading spinner */}
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            </div>
          </div>
        </div>
      )}

      {!isChecking && resData.connected && (
        <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 backdrop-blur-sm border border-emerald-500/20 rounded-2xl p-6 shadow-xl">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between gap-2">
              <div className="flex items-start space-x-4">
                {/* Logo */}
                <div>
                  <div className="bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-xl shadow-lg">
                    <CircleCheck className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Text content */}
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-white text-truncate">
                      Google Sheets Connected: {selectedSheet.spreadsheet_name}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                  <p className="text-emerald-200/80 text-sm">
                    Your spreadsheet is synced and ready to use
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col lg:flex-row items-center gap-3">
                <DialogComp
                  title="Confirm Creation?"
                  description="Are you sure you want to create a new sheet?"
                  action="Add Sheet"
                  isLoading={isProcessing}
                  handleClick={createNewSheet}
                  loadingText="Creating new sheet..."
                  classname="px-4 flex-shrink-0 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 hover:text-emerald-400 rounded-lg  transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/10 disabled:opacity-50  disabled:cursor-not-allowed text-xs"
                />

                <DialogComp
                  title="Disconnect?"
                  description="Are you sure you want to disconnect the sheet?"
                  action="Disconnect"
                  isLoading={isProcessing}
                  handleClick={disconnectSheet}
                  loadingText="Disconnecting..."
                  classname="flex-shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 border hover:text-white border-white/20 text-white/80 rounded-lg  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                />
              </div>
            </div>

            {/* Sheet selector */}
            <div className="space-y-1">
              <div className="relative">
                <button
                  onClick={() => setIsSheetsDropdownOpen(!isSheetsDropdownOpen)}
                  disabled={isSwitching}
                  className="w-full flex items-center justify-between px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all duration-200 group text-left"
                >
                  {isChecking ? (
                    <span className="text-gray-400 text-sm">Loading...</span>
                  ) : (
                    <span className="text-white/90 font-medium text-sm">
                      {selectedSheet.spreadsheet_name || "Select Sheet"}
                    </span>
                  )}
                  {isSwitching ? (
                    <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
                  ) : (
                    <ChevronDown
                      className={`w-5 h-5 text-white/60 transition-transform duration-200 ${
                        isSheetsDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  )}
                </button>

                {/* Dropdown */}
                {isSheetsDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                    {resData.history.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">
                        No sheets found
                      </div>
                    ) : (
                      resData.history.map((sheet, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            switchSheet(sheet);
                            setIsSheetsDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left text-sm transition-all duration-150 hover:bg-white/10 border-b border-white/5 last:border-0 ${
                            selectedSheet.spreadsheet_id ===
                            sheet.spreadsheet_id
                              ? "bg-emerald-500/10 text-emerald-300"
                              : "text-gray-300"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4" />
                            <span className="font-medium">
                              {sheet.spreadsheet_name}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!isChecking && !resData.connected && (
        <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm border border-orange-500/20 rounded-2xl p-6 shadow-xl">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-start space-x-4">
                {/* Logo */}
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-xl shadow-lg">
                    <AlertTriangle className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Text content */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-white">
                      Google Sheets Not Connected
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      Offline
                    </span>
                  </div>
                  <p className="text-orange-200/80 text-sm">
                    Connect your spreadsheet to start syncing data.
                  </p>
                </div>
              </div>

              {/* Connect button */}
              <button
                onClick={handleConnect}
                disabled={isChecking}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] text-sm"
              >
                {isChecking ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </span>
                ) : (
                  "Connect Now"
                )}
              </button>
            </div>

            {/* Connection info box */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 py-2">
              <p className="text-sm text-white/70 leading-relaxed">
                Once connected, you'll be able to select sheets, create new
                ones, and sync your data in real-time.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SheetsConnection;
