"use client";

import { AlertTriangle, CircleCheck, FileText } from "lucide-react";

interface SheetStatusResponse {
  connected: boolean;
  spreadsheet_name: string;
  spreadsheet_id: string;
  spreadsheet_url: string;
}

function SheetsConnection({
  resData,
  isChecking,
  handleConnect,
}: {
  resData: SheetStatusResponse;
  isChecking: boolean;
  handleConnect: () => void;
}) {
  return (
    <div className="text-white mb-8 w-full">
      <div className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-xl ">
        {isChecking && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* logo */}
              <div className="relative">
                <div className=" flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                  <FileText className="w-6 h-6 " />
                </div>

                <div className="absolute inset-0 animate-ping bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg"></div>
              </div>
              {/* txt content */}
              <div>
                <h2 className="font-semibold ">
                  Checking Google Sheets Connection
                </h2>
                <p className="text-sm text-white/70 animate-pulse">
                  Establishing secure connection...
                </p>
              </div>
            </div>

            {/* Loading spinner */}
            <div className="flex space-x-1">
              <div
                className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        )}

        {!isChecking && resData.connected && (
          <div className="text-white">
            <div className="flex items-center gap-3">
              {/* logo */}
              <div className=" flex-shrink-0 w-11 h-11 flex items-center justify-center bg-emerald-500 rounded-lg">
                <CircleCheck className="w-7 h-7 " />
              </div>
              {/* txt content */}
              <div>
                <h2 className="font-semibold flex items-center">
                  Google Sheets Connected : {resData.spreadsheet_name}
                  <span className="ml-4 px-2 py-0.5 bg-emerald-500/40 text-emerald-100 text-xs rounded-full font-medium">
                    Active
                  </span>
                </h2>
                <p className="text-sm text-white/70 ">
                  Your spreadsheet is synced and ready to use.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isChecking && !resData.connected && (
          <div className="text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* logo */}
              <div className=" flex-shrink-0 w-11 h-11 flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500 rounded-lg">
                <AlertTriangle className="w-7 h-7" />
              </div>
              {/* txt content */}
              <div>
                <h2 className="font-semibold flex items-center">
                  Google Sheets Not Connected
                  <span className="ml-2 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 text-orange-100 text-xs rounded-full font-medium">
                    Offline
                  </span>
                </h2>
                <p className="text-sm text-white/70 ">
                  Connect your spreadsheet to start syncing data.
                </p>
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={isChecking}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600  hover:to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {isChecking ? "Connecting..." : "Connect Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SheetsConnection;
