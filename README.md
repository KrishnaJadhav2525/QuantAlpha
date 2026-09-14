# QuantAlpha · AI Trading Research Assistant
### *Mini-Prototype for SUAS Enterprises (Assignment Option 1)*

An AI-native trading research assistant that translates natural language market hypotheses into structured, machine-executable quant experiments with automatic ambiguity detection and interactive parameter clarification.

---

## ⚡ Overview

- **Target Query (from Brief)**: *"Does buying NIFTY after a 1% fall work better during high-volatility periods?"*
- **Active Model Engine**: **Groq Cloud `openai/gpt-oss-120b` (high reasoning)**
- **Live Deployed Prototype**: [https://quant-alpha-rouge.vercel.app/](https://quant-alpha-rouge.vercel.app/)
- **Backup Deployment (Render)**: [https://quantalpha-trading-assistant.onrender.com/](https://quantalpha-trading-assistant.onrender.com/)
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
           │  • Dynamic Parsing (Zero Hallucination)│
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

## 📝 Assignment Reflection & Questions Answered

### 1. What Parts Did I Personally Design?
- **Ambiguity-First Research Flow**: Rather than treating the LLM as a chatbot that makes assumptions or answers conversationally, I designed the product experience around stateful research tickets where missing parameters (holding duration, exit stop loss, volatility thresholds) are surfaced explicitly for user clarification.
- **Data Model & Type Architecture**: Designed the strict TypeScript schema (`StructuredExperiment`, `MissingField`, `ExtractedEntity`, `TradeDirection`) ensuring that unstated parameters remain `null` or `UNSPECIFIED` rather than falling back to default values.
- **Dual-Tone Monochrome Terminal UI**: Created an institutional high-contrast visual design (white cards, black header and buttons, squarish borders) that prioritizes readability and density over consumer-facing chatbot bubbles.
- **Executable Code Bridge**: Designed the Python / VectorBT export layer so that once an experiment is complete, it outputs a reproducible script ready for quant engine execution.

### 2. What Parts Did I Review, Reject, or Modify?
- **Rejected Hallucinated Fallbacks**: Early AI-assisted prototypes contained fallback defaults (`|| 'NIFTY 50'`, `|| 'NIFTY falls >= 1%'`, `|| 'LONG'`). When testing with non-trading inputs like `"hi"`, the system was fabricating NIFTY variables. I caught this and rewrote the extraction logic to ensure that every variable is dynamically extracted from the user's sentence, with invalid or casual queries properly rejected.
- **Rejected Fake Backtest Predictions**: The AI initially suggested showing a mock equity curve with fabricated win rates (e.g. 64.2% win rate, Sharpe 1.62). I rejected this completely because inventing performance metrics without real historical tick data is deceptive and undermines trust in a research tool.
- **Rejected Chatbot Conversational Bubbles**: The AI suggested a conversational WhatsApp/ChatGPT-style chat layout. I rejected this in favor of a structured parameter workbench where the hypothesis and trade ticket remain visible and editable.
- **Stripped Out Pseudo-Scientific Buzzwords**: Removed AI-generated academic jargon (e.g. *"Null Hypothesis H0"*, *"Alternative Hypothesis H1"*, *"4-Stage Automated Execution Chain"*) to keep the UI direct, professional, and accessible.

---

## 🤖 Detailed AI Usage Note

*(Also available in [AI_USAGE_NOTE.md](./AI_USAGE_NOTE.md))*

1. **Which AI tools did you use?**
   - **Antigravity / ZCode**: Interactive pair-programming environment for code generation, refactoring, and state management.
   - **Groq Cloud API (`openai/gpt-oss-120b` - High Reasoning)**: Production runtime LLM engine for dynamic natural language parsing.
   - **Google Gemini 2.0 Flash**: Benchmarked during early architecture prototyping.

2. **What did you use them for?**
   - Scaffolding Next.js 16 App Router boilerplate, TypeScript interfaces, and Tailwind CSS styles.
   - Prompt engineering to output strict JSON schemas without markdown fences.
   - Fast refactoring of variable naming and single-purpose function decomposition.
   - Generating baseline Python `vectorbt` backtest templates.

3. **Which important decisions did you make yourself?**
   - Designed the Ambiguity-First user flow requiring explicit trader confirmation of missing risk boundaries.
   - Selected Groq's `openai/gpt-oss-120b` for low-latency (~1.2s) inference.
   - Mandated zero hardcoded variables or fallback dictionaries.
   - Designed the dual-tone monochrome terminal aesthetic.

4. **Did you reject or modify any AI-generated suggestions? Why?**
   - Rejected conversational chat bubbles in favor of a structured parameter workbench.
   - Deleted simulated backtest returns and fake equity curves.
   - Rewrote extraction regexes and prompts that previously misclassified words like "high volatility" as "52-week high breakouts".
   - Removed robotic, patronizing explanations in option cards.

5. **What part of the solution are you most proud of?**
   - **The Interactive Clarification Resolver**: Rather than guessing missing values or asking open-ended text questions, it identifies exactly what is missing, explains why in one sentence, presents actionable institutional choices, allows custom manual overrides, and live-updates the experiment specification ticket the moment a choice is clicked.

---

## ⚠️ Quantitative Risks & "What Could Go Wrong?"

When moving from a natural language hypothesis to a real backtest, several subtle quantitative traps can produce misleading or dangerous conclusions:

1. **Look-Ahead Bias**:
   If an entry condition is defined as "NIFTY falls >= 1%", executing the trade at the day's close based on end-of-day return is feasible, but executing during the day before the drop has finalized introduces look-ahead error. The system must clearly specify whether execution happens at bar close or next market open.
2. **Execution Friction & Slippage**:
   Index mean-reversion strategies frequently trade during volatile sessions (e.g., VIX > 18). During high volatility, bid-ask spreads widen significantly and market orders experience substantial slippage. A strategy showing +1.5% edge can easily become negative after factoring in 10–15 bps of execution drag and exchange transaction costs.
3. **Regime Overfitting**:
   Defining "High Volatility" with a static threshold (like India VIX > 18) can overfit to a specific macro cycle (e.g. 2020–2022). In prolonged low-volatility bull markets (e.g. 2017), the strategy might never trigger, leading to severe cash drag.
4. **Survivorship & Asymmetric Gap Risk**:
   Dip-buying index futures carries overnight gap risk. Global overnight events (SGX NIFTY / US CPI releases) can cause massive negative opening gaps that bypass intraday stop-loss orders.
5. **Sample Size & Insufficient Evidence**:
   A 1% drop in NIFTY during elevated volatility may only occur 10–15 times per year. Drawing statistical confidence from fewer than 30–50 independent trades risks mistaking random market noise for true edge.

---

## 🔮 What I Would Improve With More Time

1. **Live Historical Tick Data Ingestion**:
   Connect to Yahoo Finance / NSE India to fetch real historical OHLCV data directly in the browser and compute actual sample sizes ($N$) for the hypothesis.
2. **In-Browser WebAssembly Backtest Engine**:
   Execute the generated Python script in real-time using Pyodide (WASM Python) in the browser, providing real returns without requiring a separate backend server.
3. **Monte Carlo Permutation Testing**:
   Shuffle historical trade returns 1,000 times to compute $p$-values, proving whether the observed edge is statistically significant or pure chance.
4. **Multi-Asset Rotation Comparison**:
   Allow traders to compare the same pullback hypothesis across NIFTY 50, BANKNIFTY, and S&P 500 simultaneously to verify cross-market robustness.

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

## 🚀 Deployment Guide

### Option A: Deploy on Vercel (Full-Stack)
1. Push this repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Under **Environment Variables**, add:
   * `GROQ_API_KEY`: Your Groq API key (from [console.groq.com](https://console.groq.com/keys))
   * `GROQ_MODEL`: `openai/gpt-oss-120b`
4. Click **Deploy**. Vercel will automatically build the Next.js frontend and serverless API backend.

### Option B: Deploy on Render (Web Service Backend)
The repository includes a `render.yaml` Blueprint for Render.com.
1. Push this repository to GitHub.
2. Log in to [Render](https://dashboard.render.com/) and click **New > Blueprint**.
3. Connect your repository.
4. Set `GROQ_API_KEY` and click **Create Web Service**.

---

## 💻 Running Locally

```bash
# 1. Clone
git clone https://github.com/KrishnaJadhav2525/QuantAlpha.git
cd "SUAS enterprises ASSIGNMENT"

# 2. Install
npm install

# 3. Environment Setup
cp .env.example .env.local
# Add your GROQ_API_KEY in .env.local

# 4. Start Development Server
npm run dev
# Open http://localhost:3000
```
