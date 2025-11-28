"use client";

import { useState } from "react";
import { CloudUpload, FileText } from "lucide-react";
import Header from "@/components/Header";

export default function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

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
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  return (
    <section className="min-h-screen">
      <Header title="Upload Document" />

      <div className="pt-32 pb-12 px-6 max-w-[90vw] mx-auto">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">

          {/* Header Section */}
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

          {/* File Drop Section */}
          <div className="w-full grid grid-cols-2 gap-2">
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
              <div className="flex flex-col items-center justify-center gap-4 text-center">
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
                  onChange={handleFileSelect}
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="flex gap-2 text-xs text-gray-500">
                  <span>Supported: PDF, JPG, PNG, WEBP</span>
                </div>
              </div>
            </div>

            {/* Uploaded File List */}
            <div>
              {files.length > 0 && (
                <div className="mt-6 space-y-2">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">
                    Uploaded Files ({files.length})
                  </h3>

                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg group hover:bg-white/10 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-purple-500/20 rounded">
                          <FileText className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-300 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setFiles(files.filter((_, i) => i !== index))
                        }
                        className="text-gray-400 hover:text-red-400 transition-colors ml-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
