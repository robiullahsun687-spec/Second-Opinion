import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  Image as ImageIcon, 
  UploadCloud, 
  Trash2, 
  AlertCircle, 
  ArrowRight, 
  ChevronRight,
  HelpCircle,
  Clock,
  Sparkles,
  Info
} from "lucide-react";
import { AnalysisResult } from "./types";
import HeroBanner from "./components/HeroBanner";

const PRESET_EXAMPLES = [
  {
    label: "bKash Scholarship Scam",
    type: "text",
    text: "অভিনন্দন! বাংলাদেশ শিক্ষা বোর্ড কর্তৃক শিক্ষার্থীদের জন্য ১০,০০০ টাকা উপবৃত্তি দেওয়া হচ্ছে। টাকা তুলতে নিচের লিংকে ক্লিক করে আপনার bKash নাম্বার ও পিন ভেরিফাই করুন: bKash-shikkha-bd.com/otp",
    description: "Urgency message requesting OTP/bKash credentials."
  },
  {
    label: "RU Admission Notice",
    type: "text",
    text: "রাজশাহী বিশ্ববিদ্যালয় (RU) স্নাতক (সম্মান) ১ম বর্ষের ২০২৩-২৪ শিক্ষাবর্ষের ভর্তি কার্যক্রম ও ফি জমাদানের শেষ তারিখ আগামী ২৫ শে জুলাই ২০২৪। ভর্তি সংক্রান্ত যেকোনো লেনদেন শুধুমাত্র অফিসিয়াল ওয়েবসাইট http://admission.ru.ac.bd এর মাধ্যমে সম্পন্ন করতে হবে। — রেজিস্ট্রার, রাবি।",
    description: "Authentic notice using verified official academic portal."
  },
  {
    label: "Student Smartphone Job Scam",
    type: "text",
    text: "Urgent: Part-time job for students! Earn 5,000 to 15,000 BDT per week by working just 2 hours/day on your smartphone. No experience needed. Security deposit of 500 BDT is required for training registration. Contact on WhatsApp: +8801700000000",
    description: "Part-time smartphone job scam demanding an advance fee."
  }
];

// Staggered entry animation variants for professional assessment display
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 120,
      damping: 14
    }
  }
};

const flagVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 8 },
  show: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 140,
      damping: 12
    }
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"text" | "screenshot">("text");
  const [textInput, setTextInput] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  // Monitor clipboard paste events for quick screenshot analysis
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (activeTab !== "screenshot") return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleImageFile(file);
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [activeTab]);

  const handleImageFile = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      setImageMimeType(file.type);
      setFileName(file.name || "pasted-screenshot.png");
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target?.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    } else {
      setError("Please select a valid image file (PNG, JPG, WEBP).");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImageMimeType("");
    setFileName("");
  };

  const handleLoadPreset = (presetText: string) => {
    setActiveTab("text");
    setTextInput(presetText);
    setResult(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    setError(null);
    setResult(null);

    // Validate inputs
    if (activeTab === "text" && (!textInput || textInput.trim() === "")) {
      setError("Please enter or paste a message to analyze.");
      return;
    }
    if (activeTab === "screenshot" && !image) {
      setError("Please upload or paste a screenshot to analyze.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: activeTab === "text" ? textInput : null,
          image: activeTab === "screenshot" ? image : null,
          imageMimeType: activeTab === "screenshot" ? imageMimeType : null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "An error occurred during analysis.");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to contact analysis engine. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const score = result?.trustScore ?? 0;
  
  // Set ratings colors for dynamic UI theme
  let themeConfig = {
    badgeClass: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20",
    glowClass: "bg-emerald-500/10",
    strokeColor: "text-emerald-500",
    actionBoxClass: "bg-emerald-500/5 border-emerald-500/20",
    actionTextClass: "text-emerald-500",
    actionIconClass: "text-emerald-500 bg-emerald-500/20",
    borderClass: "border-emerald-500/30"
  };

  if (result) {
    if (score <= 33) {
      themeConfig = {
        badgeClass: "bg-red-500/20 text-red-400 border-red-500/20",
        glowClass: "bg-red-500/10",
        strokeColor: "text-red-500",
        actionBoxClass: "bg-red-500/5 border-red-500/20",
        actionTextClass: "text-red-500",
        actionIconClass: "text-red-500 bg-red-500/20",
        borderClass: "border-red-500/30"
      };
    } else if (score <= 66) {
      themeConfig = {
        badgeClass: "bg-amber-500/20 text-amber-400 border-amber-500/20",
        glowClass: "bg-amber-500/10",
        strokeColor: "text-amber-500",
        actionBoxClass: "bg-amber-500/5 border-amber-500/20",
        actionTextClass: "text-amber-500",
        actionIconClass: "text-amber-500 bg-amber-500/20",
        borderClass: "border-amber-500/30"
      };
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans antialiased flex flex-col justify-between" id="app_root">
      {/* Header Section */}
      <header className="border-b border-white/5 bg-[#0e0e0e]/90 backdrop-blur-md sticky top-0 z-50 py-5 px-6 sm:px-8" id="app_header">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-white flex items-center gap-2.5 select-none">
              <span className="flex items-center justify-center w-9 h-9 rounded-xl overflow-hidden border border-white/10 bg-black/30 shrink-0">
                <img src="/favicon.png" alt="Second Opinion" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </span>
              SECOND OPINION
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm mt-1">
              A second opinion for suspicious messages — before you click, pay, or share.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-xs font-mono text-blue-500 uppercase tracking-widest font-semibold">Gemini 2.0 Flash Active</span>
          </div>
        </div>
      </header>

      <HeroBanner />

      {/* Main Workspace split panel layout */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8" id="main_content">
        
        {/* Left Side: Inputs */}
        <div className="lg:col-span-5 flex flex-col gap-6" id="left_panel">
          <div className="bg-[#141414] border border-white/10 rounded-2xl overflow-hidden flex flex-col" id="input_card">
            
            {/* Input Switch Tabs */}
            <div className="flex border-b border-white/10" id="tabs_container">
              <button
                id="tab_text"
                onClick={() => { setActiveTab("text"); setError(null); }}
                className={`flex-1 py-4 text-xs sm:text-sm font-semibold transition-all border-b-2 ${
                  activeTab === "text"
                    ? "border-blue-500 text-white bg-white/5"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Paste Text
              </button>
              <button
                id="tab_screenshot"
                onClick={() => { setActiveTab("screenshot"); setError(null); }}
                className={`flex-1 py-4 text-xs sm:text-sm font-semibold transition-all border-b-2 ${
                  activeTab === "screenshot"
                    ? "border-blue-500 text-white bg-white/5"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Upload Screenshot
              </button>
            </div>

            {/* Inputs & Form Wrapper */}
            <div className="p-6 flex flex-col gap-5" id="input_form">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Suspicious Message Content
              </label>

              <AnimatePresence mode="wait">
                {activeTab === "text" ? (
                  <motion.div
                    key="text"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="relative flex-1"
                  >
                    <textarea
                      id="text_area_input"
                      rows={7}
                      placeholder="Paste suspicious Facebook post, WhatsApp forward, SMS, email, or scholarship announcement here..."
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="screenshot"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-4"
                  >
                    {!image ? (
                      <div
                        id="drop_zone"
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                          isDragging
                            ? "border-blue-500 bg-blue-500/5"
                            : "border-white/10 hover:border-white/20 bg-black/30"
                        }`}
                        onClick={() => document.getElementById("file-upload")?.click()}
                      >
                        <input
                          id="file-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                        <UploadCloud className="h-10 w-10 text-zinc-500 mx-auto mb-3" />
                        <p className="text-sm font-medium text-zinc-300">
                          Drag and drop screenshot here, or <span className="text-blue-500 hover:underline">browse</span>
                        </p>
                        <p className="text-xs text-zinc-600 mt-2">
                          Supports PNG, JPG, WEBP • You can also paste directly (Ctrl+V)
                        </p>
                      </div>
                    ) : (
                      <div className="border border-white/5 rounded-xl p-3 bg-black/40 space-y-3" id="image_preview_box">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                          <div className="flex items-center space-x-2.5">
                            <ImageIcon className="h-4 w-4 text-blue-500" />
                            <span className="text-xs font-mono text-zinc-400 truncate max-w-[180px]">{fileName}</span>
                          </div>
                          <button
                            id="remove_image_btn"
                            onClick={clearImage}
                            className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-rose-400 hover:text-rose-300 transition"
                            title="Remove image"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <div className="flex justify-center bg-zinc-950 rounded-lg overflow-hidden max-h-[220px]" id="preview_frame">
                          <img
                            src={image}
                            alt="Screenshot Preview"
                            className="object-contain max-h-[220px]"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="flex items-center space-x-2 text-rose-400 text-xs bg-rose-500/5 border border-rose-500/10 px-3 py-2.5 rounded-xl" id="error_banner">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                id="check_button"
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 uppercase tracking-wider text-xs cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Evaluating Content...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>CHECK THIS CONTENT</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Presets Section */}
          {activeTab === "text" && (
            <div className="space-y-3" id="presets_container">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                💡 CAMPUS FORUM PRESETS
              </span>
              <div className="grid grid-cols-1 gap-2.5" id="presets_grid">
                {PRESET_EXAMPLES.map((preset, index) => (
                  <button
                    key={index}
                    id={`preset_btn_${index}`}
                    onClick={() => handleLoadPreset(preset.text)}
                    className="text-left bg-[#141414] border border-white/5 hover:border-blue-500/20 p-3.5 rounded-xl hover:bg-blue-950/5 transition-all text-xs group cursor-pointer"
                  >
                    <div className="font-bold text-blue-400 group-hover:text-blue-300 flex items-center justify-between">
                      <span>{preset.label}</span>
                      <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-500" />
                    </div>
                    <p className="text-zinc-500 mt-1 line-clamp-1">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Results or Placeholders */}
        <div className="lg:col-span-7" id="right_panel">
          <AnimatePresence mode="wait">
            {isLoading ? (
              /* Loading state card matching style */
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-[#141414] border border-white/10 rounded-2xl p-8 h-full flex flex-col justify-center items-center text-center space-y-6 animate-pulse"
                id="loading_skeleton"
              >
                <div className="w-24 h-24 rounded-full bg-zinc-900 border-4 border-dashed border-blue-500/30 flex items-center justify-center animate-spin" />
                <div className="space-y-3 max-w-sm">
                  <h3 className="text-lg font-bold text-white tracking-tight">AI Assessment is underway</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">
                    Analyzing phrasing, request channels, local payment patterns, and verifying against student scam heuristics...
                  </p>
                </div>
                <div className="w-full max-w-md pt-6 border-t border-white/5 space-y-3">
                  <div className="h-3 bg-zinc-900 rounded w-1/3 mx-auto" />
                  <div className="flex justify-center gap-2">
                    <div className="h-6 bg-zinc-900 rounded-full w-20" />
                    <div className="h-6 bg-zinc-900 rounded-full w-24" />
                    <div className="h-6 bg-zinc-900 rounded-full w-16" />
                  </div>
                </div>
              </motion.div>
            ) : result ? (
              /* Actual Realized Assessment Report Card */
              <motion.div
                key="result"
                variants={containerVariants}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: 15 }}
                className="bg-[#141414] border border-white/10 rounded-2xl p-6 sm:p-8 h-full flex flex-col relative overflow-hidden"
                id="results_section"
              >
                {/* Visual Ornament Glow based on risk level */}
                <div className={`absolute -top-24 -right-24 w-64 h-64 ${themeConfig.glowClass} rounded-full blur-[100px] pointer-events-none`}></div>
                
                <div className="relative z-10 flex flex-col h-full space-y-6">
                  
                  {/* Verdict assessment banner with score */}
                  <motion.div 
                    variants={itemVariants}
                    className="flex flex-col sm:flex-row sm:items-start justify-between gap-6" 
                    id="verdict_header_row"
                  >
                    <div className="flex flex-col gap-3">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border self-start ${themeConfig.badgeClass}`}>
                        <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
                        {result.verdict}
                      </div>
                      <h2 className="text-3xl font-bold tracking-tight text-white">Assessment Report</h2>
                    </div>

                    {/* Highly polished dial gauge with dynamic drawing stroke */}
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0" id="circle_gauge">
                      <svg className="w-full h-full -rotate-90">
                        <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                        <motion.circle
                          cx="56"
                          cy="56"
                          r="48"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray="301.6"
                          initial={{ strokeDashoffset: 301.6 }}
                          animate={{ strokeDashoffset: 301.6 - (score / 100) * 301.6 }}
                          transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
                          className={`${themeConfig.strokeColor}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <motion.span 
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.6, delay: 0.3 }}
                          className="text-2xl font-mono font-black"
                        >
                          {score}
                        </motion.span>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Trust Score</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Why this is suspicious / safe analysis block */}
                  <motion.div variants={itemVariants} className="space-y-2.5">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Analysis Verdict Explanation</p>
                    <div className="bg-black/35 border border-white/5 rounded-xl p-4 sm:p-5" id="verdict_explanation_box">
                      <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                        {result.explanation}
                      </p>
                    </div>
                  </motion.div>

                  {/* Red Flags tags block */}
                  <motion.div variants={itemVariants} className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Detected Scam Signatures</p>
                    {result.redFlags.length === 0 ? (
                      <p className="text-xs text-zinc-500 italic">No malicious patterns or scam signatures were found.</p>
                    ) : (
                      <motion.div 
                        variants={{
                          hidden: {},
                          show: {
                            transition: {
                              staggerChildren: 0.08
                            }
                          }
                        }}
                        className="flex flex-wrap gap-2" 
                        id="scam_flags_container"
                      >
                        {result.redFlags.map((flag, index) => (
                          <motion.span
                            key={index}
                            variants={flagVariants}
                            className={`px-3 py-1.5 bg-black/60 border ${themeConfig.borderClass} text-zinc-300 rounded-lg text-xs flex items-center gap-1`}
                          >
                            <span>🚩</span>
                            <span>{flag}</span>
                          </motion.span>
                        ))}
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Recommended Action callout box */}
                  <motion.div 
                    variants={itemVariants}
                    className={`mt-auto ${themeConfig.actionBoxClass} rounded-xl p-5 flex items-start sm:items-center gap-4`} 
                    id="action_callout"
                  >
                    <div className={`${themeConfig.actionIconClass} p-3 rounded-lg shrink-0`}>
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-[10px] uppercase tracking-widest ${themeConfig.actionTextClass} font-black mb-1`}>
                        Recommended Action
                      </p>
                      <p className="text-xs sm:text-sm text-zinc-100 font-medium italic">
                        {result.recommendedAction}
                      </p>
                    </div>
                  </motion.div>

                </div>
              </motion.div>
            ) : (
              /* Pre-analysis elegant placeholder state card */
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#141414] border border-white/10 rounded-2xl p-8 h-full flex flex-col justify-center items-center text-center space-y-6 relative overflow-hidden"
                id="pre_assessment_placeholder"
              >
                {/* Subtle cool watermark ornament */}
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="max-w-sm space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto shadow-inner text-zinc-400">
                    <Sparkles className="h-7 w-7 text-blue-500/80" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">Awaiting Assessment Content</h3>
                    <p className="text-sm text-zinc-500 leading-relaxed">
                      Please paste suspicious university messages or upload screenshots in the left-hand workspace to initiate risk scoring and scam pattern detection.
                    </p>
                  </div>
                  <div className="pt-2 text-[11px] text-zinc-500 inline-flex items-center gap-1.5 justify-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                    <Info className="h-3 w-3" />
                    <span>Always verify bKash links and university web domains!</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      {/* Campus Guidelines / Responsible use section */}
      <section className="max-w-6xl w-full mx-auto px-6 sm:px-8 pb-8" id="safety_section">
        <div className="border border-white/10 bg-[#141414] rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
            <span>🛡️ Campus Safety & Responsible Use Guidelines</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm text-zinc-400 leading-relaxed" id="guidance_grid">
            <div className="space-y-1.5">
              <h4 className="font-bold text-zinc-200">Sharpens Students' Intuition</h4>
              <p>
                Second Opinion is an assistive assistant that uses scam pattern indicators. It is not an official disciplinary or academic board. Use it as a secondary check to confirm suspicions, but always consult authorized university personnel for formal matters.
              </p>
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-zinc-200">How to Protect Your Wallet</h4>
              <p>
                Official Rajshahi University notices never prompt you to make fast payments to personal mobile agent wallets (bKash/Nagad) to claim prizes or bypass administrative registration queues. Be aware of phishing links and inspect domain hosts diligently.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 px-6 sm:px-8 border-t border-white/5 bg-[#0e0e0e] text-[10px] font-bold text-zinc-500 uppercase tracking-widest" id="app_footer">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>Verified by Gemini Deep Analysis Engine</div>
          <div className="flex gap-6">
            <span className="text-zinc-600">Privacy First (No data stored)</span>
            <span>&copy; 2026 SECOND OPINION — CAMPUS SHIELD</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
