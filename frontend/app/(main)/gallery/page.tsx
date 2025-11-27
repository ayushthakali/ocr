"use client";

import Header from "@/components/Header";
import Image from "next/image";
import { useState } from "react";

interface Receipt {
  id: number;
  url: string;
}

function Gallery() {
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  const receipts: Receipt[] = [
    { id: 1, url: "/Receipt_20251123131355140845.png" },
    { id: 2, url: "/Receipt_20251123145342353615.webp" },
    { id: 3, url: "/Receipt_20251123150156482521.webp" },
    { id: 4, url: "/Receipt_20251124042709142832.png" },
    { id: 5, url: "/Receipt_20251124043131881915.jpg" },
    { id: 6, url: "/Receipt_20251124060034416573.jpg" },
    { id: 7, url: "/Receipt_20251124062421243090.png" },
    { id: 8, url: "/Receipt_20251124062753490619.png" },
    { id: 9, url: "/Receipt_20251124064255672037.png" },
    { id: 10, url: "/Receipt_20251124070909627899.png" },
    { id: 11, url: "/Receipt_20251124071005133638.png" },
    { id: 12, url: "/Receipt_20251124071028646786.png" },
    { id: 13, url: "/Receipt_20251124071247330571.png" },
    { id: 14, url: "/Receipt_20251124081429810083.png" },
  ];

  const handlePreview = (id: number) => {
    const receipt = receipts.find((rec) => rec.id === id);
    if (receipt) {
      setImageUrl(receipt.url);
      setShowPreview(true);
    }
  };

  return (
    <section>
      <Header title="Gallery" />

      <div className="pt-32 px-4 pb-6">
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8 py-2">
          {receipts.map((recp) => (
            <div key={recp.id} className="relative group">
              <figure
                onClick={() => handlePreview(recp.id)}
                className="relative w-full h-76 cursor-pointer group-hover:scale-105 transform transition-transform duration-300 ease-in-out"
              >
                <Image
                  src={recp.url}
                  alt={`Receipt ${recp.id}`}
                  className="object-cover rounded-lg"
                  fill
                  priority
                />
              </figure>

              {/* Preview Button Overlay */}
              <div className="absolute inset-0 bg-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center group-hover:scale-105 transform transition-transform duration-300 ease-in-out">
                <button
                  className="bg-black/80 hover:bg-black/50 border border-white/20 backdrop-blur-md px-4 py-2 text-sm rounded text-white font-medium cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(recp.id);
                  }}
                >
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="relative w-4/5 h-4/5">
              <Image
                src={imageUrl}
                alt="Preview image"
                className="object-contain rounded-lg"
                fill
                priority
              />
              <button
                className="absolute top-2 right-2 text-white text-2xl cursor-pointer font-bold"
                onClick={() => setShowPreview(false)}
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default Gallery;
