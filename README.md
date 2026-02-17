# AI Resume Optimizer (Local-First ATS Coach)

A local-first resume optimizer that compares a resume against a job description and returns **structured ATS feedback**: score, missing keywords, a tailored headline/summary, and rewritten bullet points — powered by **Ollama** running on your machine.

> Built for portfolio/demo use: no external API keys, no cloud LLM required.

---

## Features

- **ATS Score (0–100)** based on match quality
- **Missing Keywords** with short “why it matters”
- **Tailored Headline & Summary** aligned to the job description
- **Rewritten Bullets** (impact-focused, clearer, more ATS-friendly)
- **JSON-structured output** from the model (stable for UI rendering)

---

## Tech Stack

- **Next.js (App Router)**
- **TypeScript**
- **Ollama** (local LLM runtime)
- UI renders results from a strict `OptimizeData` JSON schema

---

## Prerequisites

1) Install Ollama:  
- macOS/Linux/Windows: use the installer from the official Ollama site.

2) Start Ollama and pull a model (example):

```bash
ollama serve
ollama pull llama3
