# QuantAlpha · AI Trading Research Assistant
### *Mini-Prototype for SUAS Enterprises (Assignment Option 1)*

An AI-native trading research assistant that translates natural language market hypotheses into structured, machine-executable quant experiments with automatic ambiguity detection and interactive parameter clarification.

---

## ⚡ Overview

- **Target Query (from Brief)**: *"Does buying NIFTY after a 1% fall work better during high-volatility periods?"*
- **Active Model Engine**: **Groq Cloud `openai/gpt-oss-120b` (high reasoning)**
- **Primary Goal**: Parse conversational trading inquiries, extract quantitative variables, detect critical missing parameters (holding horizon, risk rules, volatility thresholds), prompt the trader for clarification, and present a structured experiment ticket.
- **Backtesting Integration**: Compiles the clarified experiment parameters directly into executable Python / VectorBT code ready for backtesting engines.

---

## 🏛️ System Architecture

```text
               [ Natural Language Market Query ]
                              │
                              ▼
           ┌──────────────────────────────────────┐
           │        Dual LLM / NLP Gateway        │
           │  • Primary: Groq openai/gpt-oss-120b │
           │  • Fallback: Local Heuristic Engine  │
           └──────────────────┬───────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
  ┌───────────────────────┐       ┌────────────────────────┐
  │   Variable Extraction │       │  Ambiguity Detection   │
  │ • Instrument / Asset  │       │ • Missing Horizon      │
  │ • Direction / Trigger │       │ • Unbounded Risk/Stop  │
  │ • Regime Filters      │       │ • Undefined Volatility │
  └───────────┬───────────┘       └───────────┬────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
           ┌──────────────────────────────────────┐
           │      Interactive Clarification       │
           │  • Direct trader choices             │
           │  • Custom parameter inputs           │
           │  • One-click default applicator      │
           └──────────────────┬───────────────────┘
                              │
                              ▼
           ┌──────────────────────────────────────┐
           │   Structured Experiment Ticket       │
           │  • Parameter Grid                    │
           │  • Machine-Readable JSON Schema      │
           │  • Markdown Report Export            │
           │  • Executable Python Code Export     │
           └──────────────────────────────────────┘
```

---

## 🚀 Core Features (Aligned with Assignment Rubric)

### 1. Understanding the Question (Entity Extraction)
Deconstructs natural language into financial domain entities:
- **Instrument & Asset Class**: Recognizes indices (NIFTY 50, BANKNIFTY, SENSEX, SPY), equities (RELIANCE, TCS), commodities, and crypto.
- **Timeframe / Resolution**: Distinguishes between Daily, 15m, 1h, and Weekly candle resolutions.
- **Trade Direction**: Infers LONG (pullback / dip-buying) vs. SHORT (momentum / breakdown).
- **Entry Trigger**: Detects percentage falls ($\ge 1\%$), technical indicators (RSI $< 30$), and breakout criteria.
- **Filters & Regimes**: Identifies contextual market regimes such as elevated volatility (India VIX) or trend filters (200 EMA).
- **Question / Hypothesis**: Preserves and structures the core research inquiry.

### 2. Ambiguity Detection & Clarification
Core principle: **The system never blindly invents or assumes risk parameters without making them visible to the trader.**
- Flags missing holding periods (e.g. 1-day, 3-day, intraday, or custom duration).
- Flags unstated risk boundaries (e.g. missing Stop-Loss and Take-Profit criteria).
- Quantifies ambiguous qualitative terms (e.g., defines *"high volatility"* into concrete triggers like India VIX $> 18$ or historical averages).
- Provides direct choice buttons alongside custom parameter text inputs.

### 3. Structured Experiment Specification
- Formats the experiment into a clean, trader-centric trade ticket card.
- Allows 1-click toggling between:
  - **Trade Ticket**: Clean parameter grid
  - **JSON**: Machine-readable specification
  - **Python**: Executable VectorBT backtesting script
- Export capabilities: Copy JSON/Python, download Markdown specification report, and save to research history.

### 4. Experiment History & Local Persistence
- Stored locally via `localStorage`.
- Recall, inspect, or compare past research tickets at any time.

---

## 🛠️ Technology Stack

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Framework** | Next.js 16 (App Router) | High-performance server components and API routes |
| **Language** | TypeScript | Strict type safety for financial experiment models |
| **Styling** | Tailwind CSS (v4) | Dual-tone monochrome, high-contrast terminal aesthetic |
| **Icons** | Lucide React | Clean, lightweight functional glyphs |
| **LLM Engine** | Groq `openai/gpt-oss-120b` (high) | Ultra-fast inference with strict JSON object output |
| **Storage** | Browser LocalStorage | Persistent experiment history without requiring an external DB |

---

## 🤖 AI Tools Used

Full details are documented in **[AI_USAGE_NOTE.md](./AI_USAGE_NOTE.md)**.
* **Antigravity / ZCode**: Interactive pair-programming for scaffolding, state management, and refactoring.
* **Groq Cloud (`openai/gpt-oss-120b`)**: Production runtime model for fast, structured natural language query parsing.
* **Google Gemini 2.0 Flash**: Evaluated during early architecture testing.

---

## 💡 Key Decisions

1. **Ambiguity-First Architecture**:
   Instead of letting the LLM silently invent default parameters, the system explicitly detects unstated variables (holding period, risk rules, volatility thresholds) and requires confirmation before marking an experiment ready.
2. **Honest Quant Handoff over Fake Predictions**:
   Rejected fabricating artificial backtest performance metrics (win rates, simulated equity curves) without real historical tick data. Instead, the application outputs a verified Python / VectorBT script that traders can execute on their own data.
3. **Balanced Dual-Tone Monochrome Design**:
   Avoided all-dark fatigue and generic chatbot bubbles in favor of a 50/50 dual-tone monochrome interface (crisp white cards, sharp dark borders, pitch-black header and code viewers).
4. **Environment-Driven Configuration**:
   All API keys are strictly read from environment variables (`GROQ_API_KEY`), removing all hardcoded keys from client and server source files.

---

## 🚀 Deployment Guide

### Option A: Deploy on Vercel (Recommended Full-Stack)

1. Push this repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Under **Environment Variables**, add:
   * `GROQ_API_KEY`: Your Groq API key (from [console.groq.com](https://console.groq.com/keys))
   * `GROQ_MODEL`: `openai/gpt-oss-120b`
4. Click **Deploy**. Vercel will automatically build the Next.js frontend and serverless API backend.

### Option B: Deploy on Render (Web Service Backend)

This repository includes a `render.yaml` Blueprint for Render.com.

1. Push this repository to GitHub.
2. Log in to [Render](https://dashboard.render.com/) and click **New > Blueprint** (or **New > Web Service**).
3. Connect your repository.
4. Set the following settings (auto-detected if using Blueprint):
   * **Runtime**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm start`
5. Add Environment Variable:
   * `GROQ_API_KEY`: Your Groq API key
   * `GROQ_MODEL`: `openai/gpt-oss-120b`
6. Click **Create Web Service**. Render will build and host the full-stack service with live HTTPS.

---

## 💻 Running Locally

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd "SUAS enterprises ASSIGNMENT"
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory (refer to `.env.example`):
```bash
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-120b
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build & Start
```bash
npm run build
npm run start
```
"# QuantAlpha" 
