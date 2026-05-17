"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AetherWebviewProvider = void 0;
const vscode = __importStar(require("vscode"));
class AetherWebviewProvider {
    constructor(extensionUri, supervisor) {
        this.extensionUri = extensionUri;
        this.supervisor = supervisor;
    }
    resolveWebviewView(webviewView) {
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.extensionUri]
        };
        webviewView.webview.html = this.getAdvancedHtml(webviewView.webview);
        this.setupMessageHandler(webviewView);
    }
    setupMessageHandler(webviewView) {
        webviewView.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'sendPrompt':
                    try {
                        const result = await this.supervisor.processRequest(message.prompt);
                        webviewView.webview.postMessage({
                            command: 'response',
                            text: result.response,
                            treeId: result.treeRootId
                        });
                    }
                    catch (error) {
                        webviewView.webview.postMessage({ command: 'error', text: error.message });
                    }
                    break;
                case 'debugFile':
                    try {
                        const debugResult = await this.supervisor.debugCurrentFile();
                        webviewView.webview.postMessage({
                            command: debugResult ? 'response' : 'error',
                            text: debugResult?.analysis || 'Debug failed (check Extension Host logs for details).'
                        });
                    }
                    catch (e) {
                        webviewView.webview.postMessage({ command: 'error', text: e.message });
                    }
                    break;
                case 'refactorFile':
                    try {
                        const refactorResult = await this.supervisor.refactorCurrentFile();
                        webviewView.webview.postMessage({
                            command: refactorResult ? 'response' : 'error',
                            text: refactorResult ? 'Refactoring applied successfully!' : 'Refactoring failed.'
                        });
                    }
                    catch (e) {
                        webviewView.webview.postMessage({ command: 'error', text: e.message });
                    }
                    break;
                case 'analyzeFile':
                    try {
                        const analyzeResult = await this.supervisor.analyzeAlgorithm();
                        webviewView.webview.postMessage({
                            command: analyzeResult ? 'response' : 'error',
                            text: analyzeResult?.analysis || 'Analysis failed.'
                        });
                    }
                    catch (e) {
                        webviewView.webview.postMessage({ command: 'error', text: e.message });
                    }
                    break;
                case 'setApiKey':
                    vscode.commands.executeCommand('aethercode.setApiKey');
                    break;
                case 'getTreeData':
                    const treeData = await this.supervisor.getTreeState();
                    webviewView.webview.postMessage({
                        command: 'treeData',
                        data: treeData
                    });
                    break;
                case 'getMemoryData':
                    const memoryData = await this.supervisor.getMemoryState();
                    webviewView.webview.postMessage({
                        command: 'memoryData',
                        data: memoryData
                    });
                    break;
            }
        });
    }
    getAdvancedHtml(webview) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AetherCode Luminous</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root { color-scheme: dark; }
    body { 
      font-family: 'Geist', sans-serif; 
      background-color: #0a0a0a;
      background-image: 
        radial-gradient(at 0% 0%, rgba(188, 19, 254, 0.05) 0, transparent 50%), 
        radial-gradient(at 100% 100%, rgba(0, 242, 255, 0.05) 0, transparent 50%);
    }
    
    .font-mono { font-family: 'JetBrains Mono', monospace; }

    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

    /* Animations */
    .message-enter { animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    @keyframes slideUpFade {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    /* Glassmorphism */
    .glass {
      background: rgba(255, 255, 255, 0.03);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .neon-cyan-text { color: #00f2ff; text-shadow: 0 0 10px rgba(0, 242, 255, 0.4); }
    .neon-purple-text { color: #bc13fe; text-shadow: 0 0 10px rgba(188, 19, 254, 0.4); }

    .tab-active { 
      background: rgba(0, 242, 255, 0.1); 
      color: #00f2ff; 
      border-color: rgba(0, 242, 255, 0.3);
    }
  </style>
</head>
<body class="text-gray-200 h-screen flex flex-col overflow-hidden">
  
  <!-- Header -->
  <header class="glass z-10 flex flex-col px-5 py-4 shrink-0 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#00f2ff]/20 to-[#bc13fe]/20 flex items-center justify-center border border-white/10">
          <span class="font-bold text-[#00f2ff] text-xl tracking-tight">A</span>
        </div>
        <div>
          <h1 class="text-lg font-semibold tracking-tight leading-tight text-white">AetherCode</h1>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-pulse shadow-[0_0_8px_#00f2ff]"></span>
            <p class="text-[0.65rem] font-bold text-gray-400 tracking-widest uppercase font-mono">Neural Engine</p>
          </div>
        </div>
      </div>
      <button onclick="setApiKey()" class="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-gray-400 transition-colors" title="Settings / API Key">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
      </button>
    </div>

    <!-- Tabs Pill -->
    <div class="flex mt-4 bg-black/40 p-1 rounded-xl border border-white/5">
      <button onclick="switchTab(0)" class="tab tab-active flex-1 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 text-gray-400 hover:text-gray-200 border border-transparent" id="tab0">Chat</button>
      <button onclick="switchTab(1)" class="tab flex-1 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 text-gray-400 hover:text-gray-200 border border-transparent" id="tab1">Tree</button>
      <button onclick="switchTab(2)" class="tab flex-1 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 text-gray-400 hover:text-gray-200 border border-transparent" id="tab2">Memory</button>
    </div>
  </header>

  <!-- Main Content Area -->
  <main class="flex-1 relative overflow-hidden flex flex-col">
    
    <!-- Chat Panel -->
    <div id="panel0" class="absolute inset-0 flex flex-col transition-opacity duration-300">
      <div id="chat" class="flex-1 overflow-y-auto p-5 pb-36 space-y-6">
        <div class="message-enter flex justify-start">
          <div class="glass max-w-[90%] rounded-2xl rounded-tl-sm px-5 py-4 relative overflow-hidden">
            <div class="absolute left-0 top-0 bottom-0 w-1 bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]"></div>
            <p class="text-sm leading-relaxed text-gray-200">Hello! I'm AetherCode. How can I assist you with your project today?</p>
          </div>
        </div>
      </div>
      
      <!-- Input Dock -->
      <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent pt-16">
        <div class="glass rounded-2xl p-2 flex flex-col gap-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] focus-within:ring-1 focus-within:ring-[#00f2ff]/50 transition-all">
          <textarea id="promptInput" rows="1" 
            class="w-full bg-transparent border-none px-3 pt-2 pb-1 resize-none focus:outline-none text-sm text-gray-200 placeholder-gray-500 max-h-32 font-mono"
            placeholder="Ask AetherCode..."></textarea>
          
          <div class="flex justify-between items-center px-1 pb-1">
            <div class="flex gap-1.5">
              <button onclick="debugFile()" class="group flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#00f2ff] transition-colors" title="Debug Current File">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              </button>
              <button onclick="refactorFile()" class="group flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#bc13fe] transition-colors" title="Refactor Current File">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
              <button onclick="analyzeFile()" class="group flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-emerald-400 transition-colors" title="Analyze Algorithm">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              </button>
            </div>
            
            <button onclick="sendPrompt()" class="flex items-center justify-center px-4 h-8 rounded-full bg-gradient-to-r from-[#00f2ff] to-[#bc13fe] text-black font-semibold text-xs tracking-wide shadow-[0_0_15px_rgba(0,242,255,0.4)] hover:shadow-[0_0_20px_rgba(188,19,254,0.6)] transition-all transform hover:scale-105 active:scale-95">
              SEND
              <svg class="w-3 h-3 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tree Panel -->
    <div id="panel1" class="absolute inset-0 p-5 hidden transition-opacity duration-300 overflow-y-auto pb-24 space-y-4">
      <h2 class="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <svg class="w-5 h-5 text-[#bc13fe]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
        Reasoning Tree
      </h2>
      <div id="treeContainer" class="glass p-5 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden">
        <div class="absolute top-0 right-0 w-32 h-32 bg-[#bc13fe]/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <p class="text-sm text-gray-400 font-mono relative z-10 leading-loose" id="treeContent">
          Loading tree...
        </p>
      </div>
    </div>

    <!-- Memory Panel -->
    <div id="panel2" class="absolute inset-0 p-5 hidden transition-opacity duration-300 overflow-y-auto pb-24 space-y-4">
      <h2 class="text-lg font-semibold text-white mb-2 flex items-center gap-2">
        <svg class="w-5 h-5 text-[#00f2ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
        Persistent Memory
      </h2>
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="glass p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span class="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00f2ff] to-[#bc13fe] mb-1" id="memPatterns">0</span>
          <span class="text-xs text-gray-400 font-medium tracking-wide uppercase">Patterns</span>
        </div>
        <div class="glass p-4 rounded-2xl flex flex-col items-center justify-center text-center">
          <span class="text-3xl font-bold text-emerald-400 mb-1" id="memAccuracy">100%</span>
          <span class="text-xs text-gray-400 font-medium tracking-wide uppercase">Accuracy</span>
        </div>
      </div>
      <div class="glass p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden">
        <div class="absolute right-0 bottom-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"></div>
        <h3 class="text-emerald-400 font-medium text-sm mb-2 flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          Active Context
        </h3>
        <p class="text-xs text-gray-300 leading-relaxed font-mono" id="memContext">
          Loading context...
        </p>
      </div>
    </div>
  </main>

  <script>
    const vscode = acquireVsCodeApi();
    
    const textarea = document.getElementById('promptInput');
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });

    function switchTab(tab) {
      document.querySelectorAll('.tab').forEach((t, i) => {
        t.classList.toggle('tab-active', i === tab);
      });
      document.querySelectorAll('#panel0, #panel1, #panel2').forEach((p, i) => {
        if (i === tab) {
          p.classList.remove('hidden');
          setTimeout(() => p.style.opacity = '1', 10);
        } else {
          p.style.opacity = '0';
          setTimeout(() => p.classList.add('hidden'), 300);
        }
      });

      if (tab === 1) {
        vscode.postMessage({ command: 'getTreeData' });
      } else if (tab === 2) {
        vscode.postMessage({ command: 'getMemoryData' });
      }
    }

    function renderTree(nodes) {
      if (!nodes || nodes.length === 0) {
        document.getElementById('treeContent').innerHTML = 'Tree is empty. Run a task first.';
        return;
      }
      
      let html = '';
      nodes.forEach(node => {
        const prefix = node.parentId ? '&nbsp;&nbsp;├── ' : '';
        const color = node.type === 'error' ? 'text-red-400' : 'text-[#00f2ff]';
        html += \`\${prefix}<span class="\${color}">[\${node.type}]</span> \${node.prompt.substring(0, 50)}... <span class="text-emerald-400/80 text-xs">(\${node.metrics?.confidence || 0})</span><br>\`;
      });
      document.getElementById('treeContent').innerHTML = html;
    }

    function renderMemory(data) {
      document.getElementById('memPatterns').innerText = data.patterns;
      document.getElementById('memAccuracy').innerText = data.accuracy + '%';
      document.getElementById('memContext').innerText = data.activeContext;
    }

    function addMessage(text, isUser = false) {
      const chat = document.getElementById('chat');
      const div = document.createElement('div');
      div.className = \`message-enter flex \${isUser ? 'justify-end' : 'justify-start'}\`;
      
      const contentClass = isUser 
        ? 'glass rounded-2xl rounded-tr-sm border-r-2 border-r-[#bc13fe] text-gray-200 shadow-[0_0_15px_rgba(188,19,254,0.1)]' 
        : 'glass rounded-2xl rounded-tl-sm border-l-2 border-l-[#00f2ff] text-gray-200 shadow-[0_0_15px_rgba(0,242,255,0.1)]';
        
      div.innerHTML = \`
        <div class="\${contentClass} max-w-[90%] px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap font-mono">\${text}</div>
      \`;
      chat.appendChild(div);
      chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
    }

    function sendPrompt() {
      const prompt = textarea.value.trim();
      if (!prompt) return;
      addMessage(prompt, true);
      vscode.postMessage({ command: 'sendPrompt', prompt });
      textarea.value = '';
      textarea.style.height = 'auto';
    }

    function debugFile() { addMessage("🔍 Analyzing current file for bugs...", true); vscode.postMessage({ command: 'debugFile' }); }
    function refactorFile() { addMessage("♻️ Analyzing code for refactoring opportunities...", true); vscode.postMessage({ command: 'refactorFile' }); }
    function analyzeFile() { addMessage("📊 Analyzing algorithm complexity...", true); vscode.postMessage({ command: 'analyzeFile' }); }
    function setApiKey() { vscode.postMessage({ command: 'setApiKey' }); }

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.command === 'response') {
        addMessage(msg.text);
      } else if (msg.command === 'error') {
        addMessage('<span class="text-[#ffb4ab] font-bold tracking-widest">ERROR:</span> ' + msg.text);
      } else if (msg.command === 'treeData') {
        renderTree(msg.data);
      } else if (msg.command === 'memoryData') {
        renderMemory(msg.data);
      }
    });

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendPrompt();
      }
    });
  </script>
</body>
</html>`;
    }
}
exports.AetherWebviewProvider = AetherWebviewProvider;
//# sourceMappingURL=webviewProvider.js.map