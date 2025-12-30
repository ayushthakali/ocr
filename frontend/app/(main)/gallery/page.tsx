"use client";

import Header from "@/components/Header";
import Image from "next/image";
import { Loader2, UploadCloud, Download, Calendar, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useGallery } from "@/context/contextGallery";

function Gallery() {
  const [filter, setFilter] = useState("all");
  const {
    receipts,
    handlePreview,
    handleDownloadCSV,
    handleSearch,
    isLoading,
    isDownloading,
    selectedReceipt,
    setFormData,
    formData,
    showPreview,
    setShowPreview,
  } = useGallery();

  const filteredDocs =
    filter === "all"
      ? receipts
      : receipts.filter((doc) => doc.document_type === filter);

  return (
    <section>
      <Header title="Gallery" />
      {/* pt-36 */}
      <div className="pt-24 px-4 pb-6">
        {/* Filter part */}
        <div className="flex flex-wrap bg-white/10 border border-white/20 rounded-xl w-full justify-between items-center mb-4 p-2.5 gap-4">
          <form className="flex gap-8 items-center" onSubmit={handleSearch}>
            <div>
              <label className="text-lg text-white/90 ">From:</label>
              <input
                type="date"
                onChange={(e) =>
                  setFormData({ ...formData, from: e.target.value })
                }
                value={formData.from}
                className="text-white/80 px-2 py-1 bg-white/10 rounded-lg border border-white/20 ml-2"
              />
            </div>
            <div>
              <label className="text-lg text-white/90">To:</label>
              <input
                type="date"
                onChange={(e) =>
                  setFormData({ ...formData, to: e.target.value })
                }
                value={formData.to}
                className="text-white/80 px-2 py-1 bg-white/10 rounded-lg border border-white/20 ml-2 "
              />
            </div>
            <div className="flex md:flex-row flex-col gap-4">
              <button
                type="submit"
                className="px-6 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white cursor-pointer font-medium transition-all duration-200 hover:scale-105"
              >
                Search
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({ from: "", to: "" });
                }}
                className="px-6 py-1 rounded-lg border border-white/20 cursor-pointer text-gray-300 hover:bg-white/5 transition-all duration-200"
              >
                Clear
              </button>
            </div>
          </form>
          <div>
            <label className="text-lg text-white/90 ">Type:</label>
            <select
              id="docTypeFilter"
              onChange={(e) => setFilter(e.target.value)}
              className="px-2 py-1 bg-white/10 text-white rounded-lg border border-white/20 ml-2"
            >
              {[
                { name: "All Types", value: "all" },
                { name: "Receipt", value: "receipt" },
                { name: "Invoice", value: "invoice" },
                { name: "Bank Statement", value: "bank statement" },
                { name: "Others", value: "others" },
              ].map((type, i) => (
                <option key={i} value={type.value} className="text-black">
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {isLoading ? (
          // Loading Part
          <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
            <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
            <p className="text-white text-xl">Loading your documents...</p>
          </div>
        ) : receipts.length === 0 ? (
          // No docs
          <div className="flex flex-col items-center justify-center h-64 text-white/70 space-y-4 mt-20">
            <UploadCloud className="w-16 h-16 text-white/50" />
            <div className="text-center space-y-1">
              <p className="text-2xl font-medium">No documents uploaded...</p>
              <p className="text-lg">Upload your first document?</p>
            </div>

            <Link
              href="/upload"
              className="px-5 py-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold shadow-lg hover:opacity-90 transition"
            >
              Upload Receipt
            </Link>
          </div>
        ) : (
          <div>
            <h2 className="text-gray-200 text-lg font-bold mb-2 pl-2">
              Total Document(s): {filteredDocs.length}
            </h2>

            {/* Main gallery grid */}
            <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 py-2 ">
              {filteredDocs.length == 0 ? (
                <h2 className="text-white text-center text-3xl md:col-span-3 lg:col-span-5 mt-12">
                  No documents of type &quot;{filter}&quot; found.
                </h2>
              ) : (
                filteredDocs.map((recp) => (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(recp);
                    }}
                    key={recp.doc_id}
                    className="relative group transition-all duration-300 ease-in-out"
                  >
                    <figure className="relative w-full h-76 cursor-pointer group-hover:scale-105 transform transition-transform duration-300 ease-in-out">
                      <Image
                        src={recp.image_url}
                        alt={`Receipt ${recp.doc_id}`}
                        className="object-cover rounded-lg"
                        fill
                        priority
                      />
                    </figure>
                    <div className="absolute top-2 right-2 group-hover:scale-105 transform transition-transform duration-300 ease-in-out">
                      <span className="px-3 py-1 rounded-full bg-blue-600/90 backdrop-blur-sm border border-white/20 text-white text-2xs lg:text-xs font-medium capitalize">
                        {recp.document_type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <div
              className="relative bg-gray-900 rounded-2xl overflow-hidden w-full max-w-6xl h-[85vh] border border-white/20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-colors shadow-lg"
                onClick={() => setShowPreview(false)}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid md:grid-cols-2 h-full">
                {/* Image Section */}
                <div className="relative bg-black flex items-center justify-center p-8 overflow-hidden">
                  <div className="relative w-full h-full">
                    <Image
                      src={selectedReceipt.image_url}
                      alt="Preview image"
                      className="object-contain"
                      fill
                      priority
                    />
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 overflow-y-auto">
                  <h2 className="text-2xl font-bold text-white mb-6 border-b border-white/10 pb-4">
                    Document Details
                  </h2>

                  <div className="space-y-6">
                    {/* Document ID */}
                    <div className="space-y-2">
                      <label className="text-sm text-white/60 font-medium uppercase tracking-wider">
                        Document ID
                      </label>
                      <p className="text-white text-lg font-mono bg-white/5 px-4 py-2 rounded-lg border border-white/10 break-all">
                        {selectedReceipt.doc_id}
                      </p>
                    </div>

                    {/* Document Type */}
                    <div className="space-y-2">
                      <label className="text-sm text-white/60 font-medium uppercase tracking-wider">
                        Type
                      </label>
                      <p className="text-white capitalize text-lg">
                        <span className="inline-block px-4 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400">
                          {selectedReceipt.document_type}
                        </span>
                      </p>
                    </div>

                    {/* Created Date */}
                    <div className="space-y-2">
                      <label className="text-sm text-white/60 font-medium uppercase tracking-wider ">
                        Created At
                      </label>
                      <div className="flex items-center gap-2 text-white text-lg">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <span>{selectedReceipt.created_at}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-6 space-y-3">
                      <button
                        onClick={handleDownloadCSV}
                        disabled={isDownloading}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-green-500 hover:bg-green-500/80 text-white font-semibold transition-all duration-300 "
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5" />
                            Download Excel Sheet
                          </>
                        )}
                      </button>

                      <button
                        onClick={() =>
                          window.open(selectedReceipt.image_url, "_blank")
                        }
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold border border-white/20 hover:border-white/30 transition-all duration-300"
                      >
                        View Full Image
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Gallery;
