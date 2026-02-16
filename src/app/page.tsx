"use client";

import { useState, useEffect } from "react";
import ResumeForm from "./components/ResumeForm";
import HistorySidebar from "./components/HistorySidebar";
import type { HistoryItem } from "./components/ResumeForm";


const HISTORY_KEY = "resume_optimizer_history_v1";

export default function Home() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as HistoryItem[];
      if (Array.isArray(parsed)) setHistory(parsed);
    } catch {
      // ignore
    }
  }, []);

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
  };

  const handleClearHistory = () => {
    setHistory([]);
    setSelectedHistoryItem(undefined);
    localStorage.removeItem(HISTORY_KEY);
  };

  const handleNewOptimization = () => {
    setSelectedHistoryItem(undefined);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors duration-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex">
        {/* Sidebar */}
        <HistorySidebar
          history={history}
          selectedId={selectedHistoryItem?.id || null}
          onSelectItem={handleSelectHistoryItem}
          onClearHistory={handleClearHistory}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main content */}
        <div className="flex-1 lg:ml-0">
          <div className="mx-auto max-w-3xl p-4 md:p-8">
            {/* Header */}
            <div className="mb-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  AI Resume Optimizer
                </h1>
                {selectedHistoryItem && (
                  <button
                    onClick={handleNewOptimization}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:bg-blue-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  >
                    New Optimization
                  </button>
                )}
              </div>
              <p className="text-base text-slate-600 leading-relaxed">
                Optimize your resume against a specific job description using a locally running AI model. Get structured insights, missing keywords, and improved bullet suggestions instantly.
                {selectedHistoryItem && (
                  <span className="text-blue-600 font-medium"> Viewing history from {new Date(selectedHistoryItem.createdAt).toLocaleDateString()}.</span>
                )}
              </p>
            </div>

            {/* Form */}
            <ResumeForm selectedHistoryItem={selectedHistoryItem} />
          </div>
        </div>
      </div>
    </div>
  );
}
