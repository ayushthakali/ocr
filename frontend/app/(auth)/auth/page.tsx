"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, Shield } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
// import { FaApple } from "react-icons/fa";

export default function AuthPage() {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setGoogleLoading(true);
    try {
      window.location.href = "/api/auth/google";
    } catch (error) {
      console.error("OAuth error:", error);
      setGoogleLoading(false);
    }
  };

  // const handleAppleSignIn = () => {
  //   setAppleLoading(true);
  //   try {
  //     window.location.href = "/api/auth/apple";
  //   } catch (error) {
  //     console.error("OAuth error:", error);
  //     setAppleLoading(false);
  //   }
  // };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="relative w-full max-w-md">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mb-3">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Welcome to Receipt AI
            </h1>
            <p className="text-gray-300 text-sm">
              Sign in to automate your receipt processing
            </p>
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || appleLoading}
            type="button"
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group mb-3"
          >
            {googleLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <FcGoogle className="w-6 h-6" />
                <span>Continue with Google</span>
                <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </button>

          {/* Apple Sign In */}
          {/* <button
            onClick={handleAppleSignIn}
            disabled={googleLoading || appleLoading}
            type="button"
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group"
          >
            {appleLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <FaApple className="w-6 h-6" />
                <span>Continue with Apple</span>
                <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </button> */}

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-xs flex items-center justify-center gap-1">
              <AlertTriangle className="w-4 h-4 " />
              New users will automatically create an account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
