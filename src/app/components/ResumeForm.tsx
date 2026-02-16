"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { optimizeResumeAction } from "../actions/optimizeResume";
import type { OptimizeData, OptimizeState } from "../lib/optimizeSchemas";

const initialState: OptimizeState | null = null;

const SAMPLE_RESUME = `Senior Frontend Developer with 4 years of experience building scalable web applications using React, Next.js, and TypeScript. Designed reusable component libraries and implemented performance optimization techniques such as code splitting, lazy loading, and memoization to reduce bundle size by 30%. Collaborated with backend engineers to integrate RESTful and GraphQL APIs. Improved SEO by implementing server-side rendering and dynamic metadata strategies. Led code reviews and mentored junior developers in modern frontend architecture and clean coding practices. Experienced in CI/CD workflows and deploying applications using Docker and Vercel.`;

const SAMPLE_JD = `We are hiring a Frontend Engineer with strong experience in React, TypeScript, and Next.js. The candidate should understand performance optimization, SEO best practices, component-driven architecture, and API integration. Experience with CI/CD pipelines and cloud deployment is preferred. The ideal applicant should be able to lead code reviews, mentor team members, and contribute to scalable frontend systems.`;

export type HistoryItem = {
  id: string;
  createdAt: number;
  resumePreview: string;
  jdPreview: string;
  result: OptimizeData;
};

const HISTORY_KEY = "resume_optimizer_history_v1";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function preview(s: string, n = 70) {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length <= n ? t : t.slice(0, n) + "…";
}

export default function ResumeForm({ selectedHistoryItem }: { selectedHistoryItem?: HistoryItem }) {
  const [state, formAction, pending] = useActionState(optimizeResumeAction, initialState);

  const [resumeText, setResumeText] = useState(selectedHistoryItem ? "" : "");
  const [jobDescription, setJobDescription] = useState(selectedHistoryItem ? "" : "");

  const [toast, setToast] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showKeywords, setShowKeywords] = useState(true);
  const [showBullets, setShowBullets] = useState(true);

  // Load selected history item data if provided
  useEffect(() => {
    if (selectedHistoryItem) {
      // Display the stored result without modifying the form inputs
      // This keeps the form clean for new optimizations
    }
  }, [selectedHistoryItem]);

  // load history once
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

  function pushHistory(result: OptimizeData) {
    const item: HistoryItem = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      resumePreview: preview(resumeText),
      jdPreview: preview(jobDescription),
      result,
    };
    const next = [item, ...history].slice(0, 5);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }

  // when a new successful result arrives, store it
  useEffect(() => {
    if (state?.ok === true && !selectedHistoryItem) {
      pushHistory(state.data);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.ok, selectedHistoryItem]); // only react to ok flip

  // toast auto-hide
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1200);
    return () => clearTimeout(t);
  }, [toast]);

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setToast("Copied!");
  }

  const score = useMemo(() => (state?.ok === true ? clamp(state.data.score, 0, 100) : 0), [state]);

  const allImprovedBullets = useMemo(() => {
    const data = selectedHistoryItem ? selectedHistoryItem.result : (state?.ok === true ? state.data : null);
    if (!data) return "";
    return data.rewrittenBullets.map((b) => `- ${b.improved}`).join("\n");
  }, [state, selectedHistoryItem]);

  const allResultText = useMemo(() => {
    const data = selectedHistoryItem ? selectedHistoryItem.result : (state?.ok === true ? state.data : null);
    if (!data) return "";
    const d = data;
    const keywords = d.missingKeywords.map((k) => `- ${k.keyword}: ${k.whyItMatters}`).join("\n");
    const bullets = d.rewrittenBullets.map((b) => `- ${b.improved}`).join("\n");
    return [
      `ATS Score: ${d.score}/100`,
      "",
      `Headline: ${d.headline}`,
      "",
      "Summary:",
      d.summary,
      "",
      "Missing Keywords:",
      keywords || "- (none)",
      "",
      "Improved Bullets:",
      bullets || "- (none)",
    ].join("\n");
  }, [state, selectedHistoryItem]);

  return (
    <div className="mt-6 grid gap-4">
      {/* Top actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setResumeText(SAMPLE_RESUME);
            setJobDescription(SAMPLE_JD);
          }}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 transition-all duration-200 hover:bg-slate-200 hover:text-slate-900 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          Use sample
        </button>

        <button
          type="button"
          onClick={() => {
            setResumeText("");
            setJobDescription("");
          }}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:text-slate-900 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          Clear
        </button>

        {state?.ok === true && (
          <button
            type="button"
            onClick={() => copy(allResultText)}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-blue-500 px-3 py-2 text-xs font-medium text-white shadow-lg transition-all duration-200 hover:bg-blue-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Copy all result
          </button>
        )}
      </div>

      {/* Form */}
      <form action={formAction} className="grid gap-4">
        {/* Hidden inputs so FormData carries values */}
        <input type="hidden" name="resumeText" value={resumeText} />
        <input type="hidden" name="jobDescription" value={jobDescription} />

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-900">Resume Text</span>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={8}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-y"
            placeholder="Paste the resume here..."
          />
          {state?.ok === false && state.error.resumeText?.[0] && (
            <p className="text-sm text-red-500">{state.error.resumeText[0]}</p>
          )}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-900">Job Description</span>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={8}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 resize-y"
            placeholder="Paste the job description here..."
          />
          {state?.ok === false && state.error.jobDescription?.[0] && (
            <p className="text-sm text-red-500">{state.error.jobDescription[0]}</p>
          )}
        </label>

        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-200 hover:bg-blue-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? "Optimizing..." : "Optimize"}
        </button>

        {state?.ok === false && state.error.general?.[0] && (
          <p className="text-sm text-red-500">{state.error.general[0]}</p>
        )}
      </form>

      {/* Result - show either selected history item or new result */}
      {(selectedHistoryItem || (state?.ok === true)) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm shadow-sm hover:shadow-md hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-200 space-y-6">
          {/* Score */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <p className="font-semibold text-slate-900">ATS Score</p>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold shadow-sm">
                {selectedHistoryItem ? selectedHistoryItem.result.score : (state?.ok === true ? state.data?.score : 0)}/100
              </div>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full progress-fill"
                style={{ width: `${selectedHistoryItem ? selectedHistoryItem.result.score : (state?.ok === true ? state.data?.score : 0)}%` }}
                aria-label={`score bar ${selectedHistoryItem ? selectedHistoryItem.result.score : score}`}
              />
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">Headline</p>
              <button
                type="button"
                onClick={() => copy(selectedHistoryItem ? selectedHistoryItem.result.headline : (state?.ok === true ? state.data?.headline : ""))}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-2 py-1 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                Copy
              </button>
            </div>
            <p className="text-slate-600 bg-slate-50 rounded-lg p-3">{selectedHistoryItem ? selectedHistoryItem.result.headline : (state?.ok === true ? state.data?.headline : "")}</p>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">Summary</p>
              <button
                type="button"
                onClick={() => copy(selectedHistoryItem ? selectedHistoryItem.result.summary : (state?.ok === true ? state.data?.summary : ""))}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-2 py-1 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                Copy
              </button>
            </div>
            <p className="text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{selectedHistoryItem ? selectedHistoryItem.result.summary : (state?.ok === true ? state.data?.summary : "")}</p>
          </div>

          {/* Missing Keywords */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">Missing Keywords</p>
              <button
                type="button"
                onClick={() => setShowKeywords((v) => !v)}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-2 py-1 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {showKeywords ? "Hide" : "Show"}
              </button>
            </div>

            {showKeywords &&
              ((selectedHistoryItem ? selectedHistoryItem.result.missingKeywords : (state?.ok === true ? state.data?.missingKeywords : [])).length === 0 ? (
                <p className="text-slate-600 bg-slate-50 rounded-lg p-3">No major missing keywords detected.</p>
              ) : (
                <ul className="list-disc pl-5 text-slate-600 space-y-2">
                  {(selectedHistoryItem ? selectedHistoryItem.result.missingKeywords : (state?.ok === true ? state.data?.missingKeywords : [])).slice(0, 10).map((k: any, i: number) => (
                    <li key={i} className="bg-slate-50 rounded-lg p-2">
                      <span className="font-medium text-slate-900">{k.keyword}:</span> {k.whyItMatters}
                    </li>
                  ))}
                </ul>
              ))}
          </div>

          {/* Rewritten Bullets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-900">Rewritten Bullets</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copy(allImprovedBullets)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-2 py-1 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  Copy all
                </button>
                <button
                  type="button"
                  onClick={() => setShowBullets((v) => !v)}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-2 py-1 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                >
                  {showBullets ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {showBullets &&
              ((selectedHistoryItem ? selectedHistoryItem.result.rewrittenBullets : (state?.ok === true ? state.data?.rewrittenBullets : [])).length === 0 ? (
                <p className="text-slate-600 bg-slate-50 rounded-lg p-3">No bullet rewrites returned.</p>
              ) : (
                <div className="space-y-4">
                  {(selectedHistoryItem ? selectedHistoryItem.result.rewrittenBullets : (state?.ok === true ? state.data?.rewrittenBullets : [])).slice(0, 5).map((b: any, i: number) => (
                    <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">Original</p>
                        <p className="text-slate-600 bg-slate-50 rounded-lg p-3 whitespace-pre-wrap">{b.original}</p>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-slate-500">Improved</p>
                        <button
                          type="button"
                          onClick={() => copy(b.improved)}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-2 py-1 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-slate-900 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 whitespace-pre-wrap border border-blue-100">{b.improved}</p>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-slate-900">History (last 5)</p>
            <button
              type="button"
              onClick={() => {
                setHistory([]);
                localStorage.removeItem(HISTORY_KEY);
              }}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl px-2 py-1 text-xs font-medium text-slate-700 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
            >
              Clear history
            </button>
          </div>

          <div className="space-y-3">
            {history.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => {
                  setToast("Loaded from history");
                  // load inputs (previews only—inputs are not stored fully)
                  // If you want full text, we can store it too (privacy tradeoff).
                }}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm hover:shadow-md hover:shadow-blue-500/10 hover:border-blue-200 transition-all duration-200 w-full text-left"
                title={new Date(h.createdAt).toLocaleString()}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold shadow-sm">
                    Score: {h.result.score}/100
                  </div>
                  <p className="text-xs text-slate-500">{new Date(h.createdAt).toLocaleString()}</p>
                </div>
                <p className="mt-2 text-slate-600 text-xs">
                  Resume: {h.resumePreview}
                </p>
                <p className="text-slate-600 text-xs">
                  JD: {h.jdPreview}
                </p>
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 rounded-lg p-3">
            Note: History saves only "results + previews." If you want it to save the full text as well, we can add that as an option.
          </p>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-2xl bg-slate-900 px-6 py-3 text-sm text-white shadow-xl backdrop-blur-sm border border-slate-700/20 toast-modern">
          {toast}
        </div>
      )}
    </div>
  );
}
