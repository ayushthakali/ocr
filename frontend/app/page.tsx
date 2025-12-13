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
} from "lucide-react";

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
    <div className="min-h-screen ">
      {/* Header */}
      <header className="container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <span className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent font-poppins">
              AIReceipt
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/auth"
              className="text-white font-medium transition px-4 py-2 rounded-3xl hover:scale-105 transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/auth"
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-3xl font-medium hover:scale-105 transition-all"
            >
              Get Started Free
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6">
        <div className="flex flex-col items-center text-center pt-20 pb-32 text-white">
          <h1 className="text-6xl md:text-7xl font-bold mb-6 max-w-4xl">
            Transform receipts into
            <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
              {" "}
              organized data
            </span>{" "}
            instantly
          </h1>

          <p className="text-xl text-gray-200 mb-10 max-w-2xl">
            Upload receipts, invoices, and bank statements. Our AI extracts
            details and exports to CSV automatically. Manage multiple companies
            with ease.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/auth"
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
          </div>

          {/* Demo Image Placeholder */}
          <div className="mt-16 w-full max-w-5xl">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-2xl blur-3xl opacity-20"></div>
              <div className="relative bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>

                {/* Upload Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50">
                    <Receipt className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">
                      Drop receipt here
                    </p>
                    <p className="text-sm text-gray-400">or click to browse</p>
                  </div>

                  {/* Results Preview */}
                  <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      <span className="font-semibold text-gray-800">
                        Extracted Data
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between bg-white px-3 py-2 rounded">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium text-emerald-600">
                          Invoice
                        </span>
                      </div>
                      <div className="flex justify-between bg-white px-3 py-2 rounded">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">$1,234.56</span>
                      </div>
                      <div className="flex justify-between bg-white px-3 py-2 rounded">
                        <span className="text-gray-600">Date:</span>
                        <span className="font-medium">Dec 12, 2024</span>
                      </div>
                      <div className="flex justify-between bg-white px-3 py-2 rounded">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">Purchase</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-20 text-white">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything you need for receipt management
            </h2>
            <p className="text-xl text-gray-200">
              Powerful AI features to streamline your bookkeeping
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white/5 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow border border-white/10"
                >
                  <div
                    className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-200 ">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="py-20 text-white">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-300">
              Three simple steps to organized finances
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <div key={i} className="text-center">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4`}
                  >
                    <span className="text-white text-2xl font-bold">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-300">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="py-16 bg-white/10 rounded-3xl shadow-lg shadow-purple-600/30 text-white my-10">
          <div className="max-w-4xl mx-auto flex flex-col items-center px-8">
            <div>
              <h2 className="text-3xl font-bold mb-4">
                Why Choose AI Receipt?
              </h2>
              <div className="w-full h-[2px] bg-gradient-to-r from-purple-500 to-blue-500 mb-12" />
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {whyChooseAIReceipt.map((item, index) => {
                return (
                  <div key={index} className="flex gap-3 ">
                    <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-gray-300 text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20">
          <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-12 text-center text-white max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold mb-4">
              Ready to automate your bookkeeping?
            </h2>
            <p className="text-xl mb-8 text-gray-100">
              Start processing receipts with AI today. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-purple-700 rounded-lg font-semibold text-lg shadow-purple-900/30 hover:shadow-2xl hover:scale-105 transition-all"
              >
                Get Started Free
                <Zap className="w-5 h-5" />
              </Link>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/20 text-white border border-white/30 rounded-lg font-semibold text-lg backdrop-blur-md hover:bg-white/20 hover:border-white/50 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 mt-20">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-200">AI Receipt</span>
            </div>
            <p className="text-gray-200 text-sm">
              © 2025 AI Receipt. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-gray-100">
              <a href="#" className="hover:text-gray-400 transition">
                Privacy
              </a>
              <a href="#" className="hover:text-gray-400 transition">
                Terms
              </a>
              <a href="#" className="hover:text-gray-400 transition">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
