<div align="center">

# ⚡ AetherCode

### Autonomous AI Software Engineer for VS Code

*A self-improving, multi-agent AI coding assistant powered by Google Gemini —*
*built with tree-of-thoughts reasoning, persistent memory, and reinforcement learning.*

[![VS Code](https://img.shields.io/badge/VS%20Code-v1.85+-007ACC?logo=visualstudiocode&logoColor=white)](https://code.visualstudio.com/)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-API-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-22c55e)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-a855f7)]()

</div>

---

## 🧠 What is AetherCode?

AetherCode isn't just another AI code assistant — it's an **autonomous software engineer** that lives inside VS Code. It decomposes complex tasks into reasoning trees, learns from its own mistakes through error pattern tracking, and continuously improves its strategies using MSE scoring and reward-based reinforcement.

> **Think of it as a junior developer that gets smarter with every task.**

---

## ✨ Features

### 🤖 Multi-Agent Architecture
A supervisor agent orchestrates specialized sub-agents, each responsible for a distinct phase of the development workflow:

| Agent | Role |
|-------|------|
| **Supervisor** | Task decomposition, orchestration, and self-learning |
| **Debug Agent** | Root cause analysis with auto-fix proposals |
| **Refactor Agent** | Code restructuring with safety-first diff previews |
| **Analyzer Agent** | Algorithm complexity analysis and optimization hints |

### 🌳 Tree-of-Thoughts Reasoning
Tasks are decomposed into decision trees with branching strategies. The engine evaluates multiple solution paths, selects the best branch via confidence/reward scoring, and supports **backtracking** when a path underperforms.

### 💾 Persistent Memory & Learning
- **SQLite-backed** long-term memory across sessions
- **Error pattern tracking** — recognizes recurring issues and retrieves past fix strategies
- **Project-specific knowledge** stored and recalled automatically

### 📊 Self-Improvement Engine
- **MSE scoring** evaluates solution quality
- **Reward-based reinforcement** promotes successful strategies
- **Confidence calibration** adjusts over time as the agent accumulates experience

### 🔒 Safety System
- Every code change generates a **diff preview** before applying
- User approval required for file modifications
- Rollback-friendly — never writes directly without consent

### 🎨 Sidebar UI
A built-in webview with three tabs:
- **💬 Chat** — Conversational interface for task requests
- **🌳 Tree** — Visual reasoning tree of the current task
- **🧠 Memory** — Learned patterns, success rates, and metrics

---

## 🚀 Getting Started

### Prerequisites

- [VS Code](https://code.visualstudio.com/) v1.85 or later
- [Node.js](https://nodejs.org/) v18+
- A [Google Gemini API key](https://aistudio.google.com/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/gvraghuveer/AetherCode.git
cd AetherCode

# Install dependencies
npm install

# Compile TypeScript
npm run compile
```

### Launch

1. Open the project in VS Code
2. Press **`F5`** to launch the Extension Development Host
3. In the new VS Code window, click the **⚡ AetherCode** icon in the Activity Bar
4. Set your Gemini API key when prompted (stored securely via VS Code secrets)
5. Start coding with your AI engineer

---

## 📋 Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

| Command | Description |
|---------|-------------|
| `AetherCode: Open AI Assistant` | Open the sidebar chat interface |
| `AetherCode: Debug Current File` | Analyze and auto-fix the active file |
| `AetherCode: Refactor Current File` | Restructure code with diff preview |
| `AetherCode: Analyze Algorithm` | Deep complexity analysis (time & space) |
| `AetherCode: Set Gemini API Key` | Configure or update your API key |

---

## 🏗️ Architecture

```
src/
├── extension.ts              # Extension entry point & command registration
│
├── agents/                   # AI Agent Layer
│   ├── supervisor.ts         #   Orchestrator — task routing & self-learning
│   ├── debugger.ts           #   Root cause analysis & auto-fix
│   ├── refactor.ts           #   Code restructuring proposals
│   └── analyzer.ts           #   Algorithm complexity evaluation
│
├── services/                 # Core Services
│   ├── gemini.ts             #   Gemini API client (streaming + JSON mode)
│   ├── context.ts            #   Project & file context aggregation
│   ├── safety.ts             #   Diff generation & approval workflow
│   └── terminal.ts           #   Terminal command execution
│
├── tree-engine/              # Reasoning Engine
│   └── tree.ts               #   Tree-of-thoughts with backtracking
│
├── ml-engine/                # Self-Improvement
│   ├── scorer.ts             #   MSE & reward-based scoring
│   └── learning.ts           #   Pattern reinforcement & adaptation
│
├── memory/                   # Persistence Layer
│   └── sqlite.ts             #   SQLite DB — nodes, errors, patterns
│
├── parsers/                  # Code Analysis
│   └── ast.ts                #   TypeScript AST metrics & type detection
│
└── ui/                       # Interface
    └── webviewProvider.ts    #   Sidebar webview (Chat / Tree / Memory)
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | VS Code Extension API + TypeScript |
| **AI** | Google Gemini API (streaming & structured JSON) |
| **Reasoning** | Tree-of-Thoughts with reward-based path selection |
| **Memory** | SQLite3 — persistent error patterns & project knowledge |
| **Analysis** | TypeScript Compiler API for AST parsing |
| **Diffing** | `diff` library for safe change previews |

---

## 📦 Packaging & Publishing

```bash
# Install the VS Code Extension CLI
npm install -g @vscode/vsce

# Compile and package
npm run compile
vsce package

# Publish to the Marketplace
vsce publish
```

---

## 🗺️ Roadmap

- [ ] Full React + Vite webview with rich visualizations
- [ ] Git integration with auto-commit and branch management
- [ ] Multi-file autonomous workflows
- [ ] Vector embeddings for semantic memory search
- [ ] Voice command support
- [ ] Plugin system for custom agents

---

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ⚡ by [G V Raghuveer](https://github.com/gvraghuveer)**

*AetherCode — Code smarter, not harder.*

</div>