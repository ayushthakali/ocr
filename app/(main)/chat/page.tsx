import Header from "@/components/Header";
import { ArrowUp } from "lucide-react";

function Chat() {
  return (
    <section className="h-screen">
      <Header title="RAG Chat - Chat with your documents" />

      <div className="pt-32 pb-4 px-4 max-h-screen h-full w-full flex flex-col items-center justify-start gap-4">
        {/* Chat messages area */}
        <div className="bg-white/10 w-full max-w-3xl flex-1 rounded-xl overflow-y-auto"></div>

        {/* Chat bar */}
        <div className="relative w-full max-w-lg ">
          <input
            type="text"
            placeholder="Ask anything about your receipt..."
            className="peer w-full pl-6 pr-14 py-2 bg-gray-800 border border-white/20 rounded-4xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/60 transition-all"
          />

          <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 hover:bg-gray-700 peer-focus:bg-white/80 transition-all text-white peer-focus:text-black">
            <ArrowUp className="w-4 h-4 " />
          </button>
        </div>
      </div>
    </section>
  );
}

export default Chat;
