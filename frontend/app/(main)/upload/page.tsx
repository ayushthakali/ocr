"use client";

import { useState } from "react";
import axios from "axios";
import {
  CloudUpload,
  FileText,
  Check,
  X as XIcon,
  Loader2,
} from "lucide-react";
import Header from "@/components/Header";
import { useCompany } from "@/context/contextCompany";

interface QueueItem {
  id: number;
  fileName: string;
  status: "processing" | "success" | "error";
  timestamp: string;
  data?: {
    document_key?: string;
    category?: string;
    error?: string;
  };
}

export default function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const [processingQueue, setProcessingQueue] = useState<QueueItem[]>([]);
  const [queueIdCounter, setQueueIdCounter] = useState(0);
  const { selectedCompany } = useCompany();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach((file) => uploadFile(file));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      selectedFiles.forEach((file) => uploadFile(file));
    }
  };

  const addToQueue = (file: File): number => {
    const queueId = queueIdCounter + 1;
    setQueueIdCounter(queueId);

    const queueItem: QueueItem = {
      id: queueId,
      fileName: file.name,
      status: "processing",
      timestamp: new Date().toLocaleTimeString(),
    };

    setProcessingQueue((prev) => [...prev, queueItem]);
    return queueId;
  };

  const updateQueueItem = (
    queueId: number,
    status: "processing" | "success" | "error",
    data?: any
  ) => {
    setProcessingQueue((prev) =>
      prev.map((item) =>
        item.id === queueId ? { ...item, status, data } : item
      )
    );
  };

  const removeFromQueue = (queueId: number) => {
    setTimeout(() => {
      setProcessingQueue((prev) => prev.filter((item) => item.id !== queueId));
    }, 7000);
  };

  const uploadFile = async (file: File) => {
    const queueId = addToQueue(file);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "X-Active-Company": selectedCompany._id,
        },
      });

      updateQueueItem(queueId, "success", res.data);
      removeFromQueue(queueId);
    } catch (err) {
      console.error("API Error: ", err);
      updateQueueItem(queueId, "error", {
        error: "Upload failed",
      });
      removeFromQueue(queueId);
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

      <div className="pt-40 pb-12 px-6 max-w-[90vw] mx-auto grid md:grid-cols-2 gap-6">
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
                Drag and drop or click to select files
              </p>
            </div>
          </div>

          {/* Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 ${
              isDragging
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
                  Drop your files here
                </p>
                <p className="text-sm text-gray-400">
                  or click to browse from your device
                </p>
              </div>

              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              <div className="flex gap-2 text-xs text-gray-500">
                <span>Supported: PDF, JPG, PNG, WEBP</span>
              </div>
            </div>
          </div>
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
                {processingQueue.length}
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
                          Document ID:
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
    </section>
  );
}
