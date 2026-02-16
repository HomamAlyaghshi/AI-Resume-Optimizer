"use client";

import type { HistoryItem } from "./ResumeForm";

interface HistorySidebarProps {
  history: HistoryItem[];
  selectedId: string | null;
  onSelectItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function HistorySidebar({
  history,
  selectedId,
  onSelectItem,
  onClearHistory,
  isOpen,
  onToggle,
}: HistorySidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 left-0 z-50 h-full w-80 border-r border-slate-200 bg-white
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 lg:transform-none lg:h-screen
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-lg font-semibold text-slate-900">History</h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
              title="Clear all history"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={onToggle}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors duration-200 hover:bg-slate-100 lg:hidden"
              aria-label="Close sidebar"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {history.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">No history yet</p>
              <p className="mt-2 text-xs text-slate-400">
                Your optimization results will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {history.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectItem(item);
                    onToggle(); // Close sidebar on mobile after selection
                  }}
                  className={`
                    w-full rounded-xl p-3 text-left transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                    ${
                      selectedId === item.id
                        ? "border border-blue-200 bg-blue-50 shadow-sm"
                        : "border border-transparent hover:bg-slate-50"
                    }
                  `}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-semibold shadow-sm">
                      {item.result.score}/100
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <p className="truncate text-xs text-slate-600">
                      Resume: {item.resumePreview}
                    </p>
                    <p className="truncate text-xs text-slate-600">
                      JD: {item.jdPreview}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
