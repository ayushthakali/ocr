import { CloudUpload } from "lucide-react";
import FileDrop from "@/components/FileDrop";
import Header from "@/components/Header";

function Upload() {
  return (
    <section className="min-h-screen">
      <Header title="Upload Document" />

      <div className="pt-32 pb-12 px-6 max-w-3xl mx-auto">
        {/* File Upload Section */}

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
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

          <FileDrop />

          <div className="mt-6 flex justify-end gap-3">
            <button className="px-6 py-2.5 rounded-lg border border-white/20 text-gray-300 hover:bg-white/5 transition-all duration-200">
              Cancel
            </button>
            <button className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-200 hover:scale-105">
              Upload Documents
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Upload;
