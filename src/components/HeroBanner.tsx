import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const BANNERS = [
  { src: "/banners/banner-1.jpg", alt: "Second Opinion scam & misinformation checker banner" },
  { src: "public/ChatGPT Image Jul 16, 2026, 05_12_14 PM.png", alt: "Identify phishing and fake scholarships instantly" },
  { src: "/banners/banner-3.jpg", alt: "Community safety and AI analytics banner" }
];

export default function HeroBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div 
      className="max-w-6xl mx-auto px-4 w-full mb-8 mt-4" 
      id="hero_banner_container"
    >
      <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden relative w-full aspect-[16/9] flex items-center justify-center">
        {/* Banner Images */}
        <div className="relative w-full h-full">
          <AnimatePresence initial={false}>
            <motion.img
              key={currentIndex}
              src={BANNERS[currentIndex].src}
              alt={BANNERS[currentIndex].alt}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 w-full h-full object-cover bg-[#141414]"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
        </div>

        {/* Dot Navigation */}
        <div 
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/5"
          id="banner_dots_navigation"
        >
          {BANNERS.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <button
                key={index}
                onClick={() => handleDotClick(index)}
                className="focus:outline-none transition-all duration-300"
                aria-label={`Go to slide ${index + 1}`}
                id={`banner_dot_${index}`}
              >
                <motion.div
                  animate={{
                    width: isActive ? 24 : 8,
                    backgroundColor: isActive ? "#3b82f6" : "rgba(255, 255, 255, 0.3)"
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="h-2 rounded-full"
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
