"use client";

import Link from "next/link";
import {
  FileText,
  Zap,
  Shield,
  Building2,
  FileSpreadsheet,
  Receipt,
  FileCheck,
  CheckCircle,
  CloudUpload,
  SquareArrowOutUpRight,
} from "lucide-react";
import { motion } from "framer-motion";

function Home() {
  const features = [
    {
      icon: Zap,
      gradient: "from-emerald-500 to-emerald-600",
      title: "AI-Powered Scanning",
      description:
        "Advanced AI automatically extracts vendor, amount, date, and categorizes as sales or purchase.",
    },
    {
      icon: FileCheck,
      gradient: "from-blue-500 to-blue-600",
      title: "Smart Document Detection",
      description:
        "Automatically identifies document type: Invoice, Receipt, Bank Statement, or Purchase Order.",
    },
    {
      icon: FileSpreadsheet,
      gradient: "from-purple-500 to-purple-600",
      title: "CSV Export",
      description:
        "Export all your data to CSV format with one click. Perfect for accounting software integration.",
    },
    {
      icon: Building2,
      gradient: "from-pink-500 to-pink-600",
      title: "Multi-Company Management",
      description:
        "Manage receipts for multiple companies in one account. Keep everything organized and separate.",
    },
    {
      icon: Shield,
      gradient: "from-orange-500 to-orange-600",
      title: "Secure & Private",
      description:
        "Your financial data is encrypted and secure. We never share your information with third parties.",
    },
    {
      icon: FileText,
      gradient: "from-teal-500 to-teal-600",
      title: "Multiple Formats Supported",
      description:
        "Upload receipts in PDF, JPG, PNG, or other image formats. We handle them all seamlessly.",
    },
  ];

  const steps = [
    {
      title: "Upload",
      description:
        "Drop your receipts, invoices, or bank statements into the app",
    },
    {
      title: "AI Processing",
      description:
        "Our AI scans and extracts all relevant information automatically",
    },
    {
      title: "Export & Use",
      description:
        "Download your organized data as CSV for accounting software",
    },
  ];

  const whyChooseAIReceipt = [
    {
      title: "Save Time",
      description:
        "Process hundreds of receipts in minutes instead of hours of manual entry",
    },
    {
      title: "Reduce Errors",
      description: "AI accuracy eliminates human data entry mistakes",
    },
    {
      title: "Stay Organized",
      description: "All receipts categorized and searchable in one place",
    },
    {
      title: "Tax Ready",
      description: "Export perfect records for tax season and audits",
    },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="container mx-auto px-6 py-6"
      >
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <span className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent font-poppins">
              Receipt AI
            </span>
          </div>

          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center gap-4"
          >
            <Link
              href="/auth"
              className="text-white font-medium transition px-4 py-2 rounded-3xl hover:scale-105 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/auth?mode=signup"
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-3xl font-medium hover:scale-105 transition-all"
            >
              Get Started Free
            </Link>
          </motion.div>
        </nav>
      </motion.header>

      {/* Hero Section */}
      <main className="container mx-auto px-6">
        <motion.div className="flex flex-col items-center text-center py-20 text-white">
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="text-6xl md:text-7xl font-bold mb-6 max-w-4xl"
          >
            Transform receipts into
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              {" "}
              organized data
            </span>{" "}
            instantly
          </motion.h1>

          <motion.p
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-200 mb-10 max-w-2xl"
          >
            Upload receipts, invoices, and bank statements. Our AI extracts
            details and exports to CSV automatically. Manage multiple companies
            with ease.
          </motion.p>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link
              href="/auth?mode=signup"
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold text-lg hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              Start Processing Free
              <Zap className="w-5 h-5" />
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 bg-white text-gray-700 rounded-lg font-semibold text-lg hover:scale-105 transition-all"
            >
              See How It Works
            </Link>
          </motion.div>

          {/* Demo Image Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true, amount: 0.25 }}
            className="mt-16 w-full max-w-6xl pt-20"
          >
            <div className="relative">
              {/* <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-2xl blur-3xl opacity-20">

              </div> */}

              <div className="relative bg-gray-800/90 rounded-2xl shadow-2xl p-8 border border-gray-700/50">
                {/* Browser Controls */}
                <div className="flex gap-2 mb-6">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>

                {/* Upload Section */}
                <div>
                  <div className="flex flex-col items-start gap-3 ">
                    <div className="flex items-center justify-between w-full mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                          <CloudUpload className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-white">
                            Upload Documents
                          </h3>
                          <p className="text-xs text-gray-400">
                            Drag and drop or click to select files
                          </p>
                        </div>
                      </div>
                      <button className="flex gap-2 items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-800/90 to-purple-800 rounded-xl">
                        <SquareArrowOutUpRight className="w-5 h-5" />
                        <span>View Google Sheets</span>
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 w-full">
                      <div className="w-full border-2 border-dashed rounded-2xl p-12 transition-all duration-300 border-purple-500/50 bg-purple-500/10 ">
                        <div className="relative flex flex-col items-center justify-center gap-4 text-center">
                          <div className="p-6 rounded-full transition-all duration-300 bg-purple-500/20">
                            <CloudUpload className="w-12 h-12 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-white mb-2">
                              Drop your files here
                            </p>
                            <p className="text-sm text-gray-400">
                              or click to browse from your device
                            </p>
                          </div>
                          <div className="flex gap-2 text-xs text-gray-500">
                            <span>Supported: PDF, JPG, PNG, WEBP</span>
                          </div>
                        </div>
                      </div>
                      {/* Results Preview */}
                      <div className="bg-gradient-to-br from-gray-700/50 to-slate-700/50 rounded-xl p-6 border border-gray-600/30">
                        <div className="flex items-center gap-2 mb-4">
                          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                          <span className="font-semibold text-gray-100">
                            Extracted Data
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between bg-gray-800/80 px-3 py-2 rounded border border-gray-700/50">
                            <span className="text-gray-400">Type:</span>
                            <span className="font-medium text-emerald-400">
                              Invoice
                            </span>
                          </div>
                          <div className="flex justify-between bg-gray-800/80 px-3 py-2 rounded border border-gray-700/50">
                            <span className="text-gray-400">Amount:</span>
                            <span className="font-medium text-white">
                              $1,234.56
                            </span>
                          </div>
                          <div className="flex justify-between bg-gray-800/80 px-3 py-2 rounded border border-gray-700/50">
                            <span className="text-gray-400">Date:</span>
                            <span className="font-medium text-white">
                              Dec 12, 2024
                            </span>
                          </div>
                          <div className="flex justify-between bg-gray-800/80 px-3 py-2 rounded border border-gray-700/50">
                            <span className="text-gray-400">Category:</span>
                            <span className="font-medium text-white">
                              Purchase
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <div id="features" className="py-20 text-white">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-4">
              Everything you need for receipt management
            </h2>
            <p className="text-xl text-gray-200">
              Powerful AI features to streamline your bookkeeping
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  className="bg-white/5 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow border border-white/10"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: "easeOut",
                  }}
                >
                  <motion.div
                    className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6`}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{
                      duration: 0.6,
                      delay: index * 0.1 + 0.2,
                      type: "spring",
                      stiffness: 200,
                    }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-200">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="py-20 text-white">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-300">
              Three simple steps to organized finances
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.2,
                    ease: "easeOut",
                  }}
                  key={i}
                  className="text-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -270 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{
                      duration: 0.6,
                      delay: i * 0.2,
                    }}
                    className={`w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}
                    style={{ boxShadow: "0 0 25px rgba(147, 51, 234, 0.6)" }}
                  >
                    <span className="text-white text-2xl font-bold">
                      {i + 1}
                    </span>
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 + 0.4 }}
                    className="text-xl font-bold mb-2"
                  >
                    {step.title}
                  </motion.h3>
                  <motion.p
                    className="text-gray-300"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2 + 0.5 }}
                  >
                    {step.description}
                  </motion.p>{" "}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <motion.div
          className="py-16 bg-white/10 rounded-3xl shadow-lg shadow-purple-600/30 text-white my-10"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-4xl mx-auto flex flex-col items-center px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-4">
                Why Choose AI Receipt?
              </h2>
              <motion.div
                className="w-full h-[2px] bg-gradient-to-r from-purple-500 to-blue-500 mb-12"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {whyChooseAIReceipt.map((item, index) => {
                return (
                  <motion.div
                    key={index}
                    className="flex gap-3"
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.1,
                      ease: "easeOut",
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      whileInView={{ scale: 1, rotate: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.1 + 0.2,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      <motion.h4
                        className="font-semibold mb-1"
                        initial={{ y: 10, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.35 }}
                      >
                        {item.title}
                      </motion.h4>
                      <motion.p
                        className="text-gray-300 text-sm"
                        initial={{ y: 10, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.4 }}
                      >
                        {item.description}
                      </motion.p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* CTA Section */}
        <div className="py-20">
          <motion.div
            className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-12 text-center text-white max-w-4xl mx-auto relative overflow-hidden"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <motion.h2
              className="text-4xl font-bold mb-4"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Ready to automate your bookkeeping?
            </motion.h2>
            <motion.p
              className="text-xl mb-8 text-gray-100"
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Start processing receipts with AI today. No credit card required.
            </motion.p>
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/auth?mode=signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-purple-700 rounded-lg font-semibold text-lg shadow-purple-900/30 hover:shadow-2xl hover:scale-105 transition-all"
              >
                Get Started Free
                <Zap className="w-5 h-5 animate-pulse" />
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 text-white border border-white/30 rounded-lg font-semibold text-lg backdrop-blur-md hover:bg-white/20 hover:border-white/50 transition-all"
              >
                Sign In
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="pb-6 ">
        <div className="mx-auto px-6">
          <div className="flex flex-col justify-center items-center gap-6">
            <div className="origin-center bg-gradient-to-r from-transparent via-purple-400/70 via-blue-400/70 to-transparent w-full h-[2px]" />
            {/* <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-200">AI Receipt</span>
            </div> */}
            <p className="text-gray-200 text-sm">
              © 2025 AI Receipt. All rights reserved.
            </p>
            {/* <div className="flex gap-6 text-sm text-gray-100">
              <a href="#" className="hover:text-gray-400 transition">
                Privacy
              </a>
              <a href="#" className="hover:text-gray-400 transition">
                Terms
              </a>
              <a href="#" className="hover:text-gray-400 transition">
                Contact
              </a>
            </div> */}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
