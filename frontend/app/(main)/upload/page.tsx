"use client";

import { useState, useEffect } from "react";
import {
  CloudUpload,
  FileText,
  Check,
  X as XIcon,
  Loader2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import Header from "@/components/Header";
import { useCompany } from "@/context/contextCompany";
import { useUpload } from "@/context/contextUpload";
import SheetsConnection from "./SheetsConnection";
import { toast } from "react-toastify";

interface SheetStatusResponse {
  connected: boolean;
  spreadsheet_name: string;
  spreadsheet_id: string;
  spreadsheet_url: string;
}

export default function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const {
    selectedCompany,
    setIsUploading,
    isUploading,
    setIsConnectingSheets,
  } = useCompany();
  const {
    processingQueue,
    errorMessage,
    MAX_FILES,
    processFiles,
    isUploadDisabled,
  } = useUpload();
  const [isChecking, setIsChecking] = useState(true);
  const [showSuccess, setShowSuccess] = useState(true);

  const [resData, setResData] = useState<SheetStatusResponse>({
    connected: false,
    spreadsheet_name: "",
    spreadsheet_id: "",
    spreadsheet_url: "",
  });

  // To check connection with sheets
  useEffect(() => {
    const checkSheetConnection = async () => {
      if (!selectedCompany?._id) return;

      try {
        setIsConnectingSheets(true);
        const response = await axios.get("/api/sheets/status", {
          headers: {
            "X-Active-Company": selectedCompany._id,
          },
        });
        setResData(response.data);
        setTimeout(() => {
          if (response.data.connected) {
            setShowSuccess(false);
          }
        }, 1000);
        if (!response.data.connected) {
          setShowSuccess(true);
        }
      } catch (error) {
        console.error("Error checking sheet connection:", error);
        setResData({
          connected: false,
          spreadsheet_name: "",
          spreadsheet_id: "",
          spreadsheet_url: "",
        });
        toast.error("Failed to check sheet connection.");
      } finally {
        setIsChecking(false);
        setIsConnectingSheets(false);
      }
    };
    checkSheetConnection();
  }, [selectedCompany, setIsConnectingSheets]);

  //Monitor upload queue and unblock company switching when all uploads complete
  useEffect(() => {
    if (isUploading && processingQueue.length === 0) {
      setIsUploading(false);
    }
  }, [processingQueue, isUploading, setIsUploading]);

  // Connection to google sheets
  const handleConnect = async () => {
    try {
      setIsConnectingSheets(true);
      setIsChecking(true);
      const response = await axios.get("/api/sheets/connect", {
        headers: {
          "X-Active-Company": selectedCompany._id,
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
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Wrapper function to enable uploading and process files
  const handleFilesAdded = (files: File[]) => {
    setIsUploading(true);
    processFiles(files, selectedCompany._id, selectedCompany.company_name);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFilesAdded(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFilesAdded(selectedFiles);
      e.target.value = "";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "processing":
        return <Loader2 className="w-5 h-5 animate-spin text-blue-400" />;
      case "success":
        return <Check className="w-5 h-5 text-green-400" />;
      case "error":
        return <XIcon className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processing":
        return "border-blue-500/50 bg-blue-500/10";
      case "success":
        return "border-green-500/50 bg-green-500/10";
      case "error":
        return "border-red-500/50 bg-red-500/10";
      default:
        return "border-white/10 bg-white/5";
    }
  };

  return (
    <section className="min-h-screen">
      <Header title="Upload Document" isGallery={false} />

      <div className="pt-28 pb-12 px-6 ">
        {showSuccess && (
          <SheetsConnection
            resData={resData}
            isChecking={isChecking}
            handleConnect={handleConnect}
          />
        )}
        <div className=" max-w-[90vw] mx-auto grid md:grid-cols-2 gap-6">
          {/* Left Column: Upload Area */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            {/* Title Section */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <CloudUpload className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Upload Documents
                </h3>
                <p className="text-sm text-gray-400">
                  Drag and drop or click to select files (Max {MAX_FILES}{" "}
                  documents.)
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{errorMessage}</p>
              </div>
            )}

            {/* Drop Area */}
            {!isChecking && resData.connected && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ${
                  isUploadDisabled
                    ? "border-gray-600 bg-gray-500/5 cursor-not-allowed opacity-50"
                    : isDragging
                    ? "border-purple-500 bg-purple-500/10 scale-[1.02]"
                    : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10"
                }`}
              >
                <div className="relative flex flex-col items-center justify-center gap-4 text-center">
                  <div
                    className={`p-6 rounded-full transition-all duration-300 ${
                      isDragging ? "bg-purple-500/20 scale-110" : "bg-white/10"
                    }`}
                  >
                    <CloudUpload
                      className={`w-12 h-12 transition-colors duration-300 ${
                        isDragging ? "text-purple-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white mb-2">
                      {isUploadDisabled
                        ? "Maximum files reached"
                        : "Drop your files here"}
                    </p>
                    <p className="text-sm text-gray-400">
                      {isUploadDisabled
                        ? "Wait for current uploads to complete"
                        : "or click to browse from your device"}
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    disabled={isUploadDisabled}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span>Supported: PDF, JPG, PNG, WEBP</span>
                  </div>
                </div>
              </div>
            )}

            {/* Alert */}
            {!resData.connected && !isChecking && (
              <div className="relative border-2 border-dashed rounded-2xl p-12 border-gray-600 bg-gray-500/5 cursor-not-allowed opacity-90">
                <div className="relative flex flex-col items-center justify-center gap-4 text-center">
                  <div
                    className={`p-6 rounded-full transition-all duration-300 ${
                      isDragging ? "bg-purple-500/20 scale-110" : "bg-white/10"
                    }`}
                  >
                    <AlertTriangle
                      className={`w-12 h-12 transition-colors duration-300 ${
                        isDragging ? "text-purple-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-white/80 mb-2">
                      Please connect to google sheets first.
                    </p>
                  </div>
                  <button
                    onClick={handleConnect}
                    disabled={isChecking}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    {isChecking ? "Connecting..." : "Connect Now"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Processing Queue */}
          <div>
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-400" />
                  Processing Queue
                </h3>
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold">
                  {processingQueue.length}/{MAX_FILES}
                </span>
              </div>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {processingQueue.length === 0 ? (
                  <div className="w-full text-center my-4">
                    <p className="text-sm font-medium text-white/80">
                      No files in the queue.
                    </p>
                  </div>
                ) : (
                  processingQueue.map((item, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border transition-all duration-300 ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {/* Status Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className="text-sm font-medium text-white capitalize">
                            {item.status}
                          </span>
                        </div>
                        {item.data?.category && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              item.data.category === "purchase"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-green-500/20 text-green-400"
                            }`}
                          >
                            {item.data.category}
                          </span>
                        )}
                      </div>

                      {/* File Info */}
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-300 truncate">
                          {item.fileName}
                        </span>
                      </div>

                      {/* Document ID */}
                      {item.data?.document_key && (
                        <div className="mt-2 p-2 bg-white/5 rounded border border-white/10">
                          <span className="text-xs text-gray-400">
                            Document ID:{" "}
                          </span>
                          <span className="text-xs text-white font-mono">
                            {item.data.document_key}
                          </span>
                        </div>
                      )}

                      {/* Error Message */}
                      {item.status === "error" && item.data?.error && (
                        <div className="mt-2 text-xs text-red-400">
                          {item.data.error}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="mt-2 text-xs text-gray-500">
                        {item.timestamp}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
