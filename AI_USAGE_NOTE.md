# AI Usage Note
### Project: QuantAlpha · AI Trading Research Assistant (Option 1)
**Author**: Candidate Submission  
**Date**: September 2026  

---

### 1. Which AI tools did you use?
* **Antigravity / ZCode**: Used as the primary interactive pair-programming environment for scaffolding, refactoring, and project maintenance.
* **Groq Cloud API (`openai/gpt-oss-120b` - High Reasoning)**: Integrated as the production LLM engine driving live natural language extraction and experiment structuring.
* **Google Gemini 2.0 Flash (AI Studio)**: Evaluated during early architecture testing for schema generation and latency benchmarking.

---

### 2. What did you use them for?
* **Scaffolding & Typing**: Generating initial Next.js 16 App Router boilerplate, TypeScript interfaces (`StructuredExperiment`, `MissingField`, `ExtractedEntity`), and Tailwind CSS layout configurations.
* **Query Parsing & Prompt Engineering**: Drafting and refining system prompts to reliably extract financial variables (Instruments, Timeframes, Triggers, Filters) into strict JSON format without markdown artifacts.
* **Code Refactoring**: Accelerating the renaming of variables, breaking down monolithic methods into single-purpose functions, and enforcing clean early returns across the codebase.
* **Python VectorBT Script Template**: Generating clean baseline Python code that maps the structured experiment parameters into an executable quantitative script.

---

### 3. Which important decisions did you make yourself?
* **Ambiguity-First Architecture**: Typical LLM apps silently hallucinate default parameters. I decided that this system must do the exact opposite: deliberately surface unstated parameters (Holding Period, Stop Loss, Volatility Metric) and refuse to finalize the ticket until the user confirms them.
* **Choosing Groq `openai/gpt-oss-120b`**: Evaluated model choices and selected Groq's high-reasoning 120B model for sub-2-second JSON generation, ensuring the user experience feels like a responsive tool rather than a slow chat completion.
* **Dual-Engine Strategy (Zero-Setup Fallback)**: Built a deterministic local heuristic parser alongside the cloud LLM so that an evaluator can test the application offline or without needing their own API key.
* **Design Direction**: Explicitly chose a clean, squarish monochrome terminal aesthetic over generic "vibe-coded" SaaS gradients or chatbot bubble interfaces. Real quantitative traders need high-density, structured parameter tickets, not chat bubbles.
* **Rejecting Fake Predictions**: When the AI generated mock performance numbers (e.g. simulated 64.2% win rate, Sharpe 1.62, and artificial equity curves), I decided to strip them out entirely. A research assistant should structure hypotheses honestly, not fabricate historical backtest results without real tick data.

---

### 4. Did you reject or modify any AI-generated suggestions? Why?
* **Rejected Conversational Chatbot UI**: The AI originally suggested a ChatGPT-style conversational thread with message bubbles. I rejected this because financial research requires a stateful workbench where variables stay visible and editable in place.
* **Rejected Simulated Equity Curves & Win Rates**: The AI initially built a mock backtest chart with fabricated return numbers to fulfill the "bonus" prompt. I rejected and deleted this component because showing unverified metrics damages user trust. Instead, I replaced it with clean, copyable Python code so users can run real backtests on their own data.
* **Fixed False-Positive Regex Collisions**: The AI's initial heuristic parser misclassified words like "high" in "high volatility" as a "52-week high breakout". I rewrote the matching logic with dedicated lookahead rules to cleanly separate market regimes from price triggers.
* **Removed Robotic / Preachy Copy**: The AI generated wordy, patronizing explanations for each option (e.g., *"Classic asymmetrical 2:1 risk-reward ratio"*, *"A dip-buying strategy requires a defined holding horizon..."*). I stripped all of this out in favor of concise, professional trading options (e.g. `1 Day`, `3 Days`, `TP: 2% / SL: 1%`).

---

### 5. What part of the solution are you most proud of?
**The Interactive Clarification Resolver.**  
Most AI wrappers either guess missing values or respond with vague text paragraphs like *"Please tell me your stop loss."* This application identifies exactly *which* parameters are missing, explains why in one sentence, presents 3–4 standard institutional defaults, allows custom manual overrides, and live-updates the experiment specification ticket the moment a choice is clicked. It bridges the gap between natural language ambiguity and strict quantitative execution.
