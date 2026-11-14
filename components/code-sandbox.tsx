'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Copy, Check, Terminal, Layout, Code2, AlertCircle } from 'lucide-react';

interface CodePreset {
  id: string;
  name: string;
  language: 'javascript' | 'html';
  code: string;
}

const DEFAULT_PRESETS: CodePreset[] = [
  {
    id: 'js-async',
    name: 'Async/Await Data Fetching',
    language: 'javascript',
    code: `// Interactive JavaScript Sandbox
async function fetchUserDemo() {
  console.log("🚀 Initializing API request...");
  
  const user = {
    id: "user_9921",
    name: "BIT Student",
    role: "Developer",
    skills: ["Next.js 15", "React 19", "TypeScript", "Tailwind v4"]
  };
  
  await new Promise((resolve) => setTimeout(resolve, 800));
  
  console.log("✅ User fetched successfully:");
  console.log(user);
  console.log("✨ Active Skills:", user.skills.join(" • "));
  return user;
}

fetchUserDemo();`,
  },
  {
    id: 'html-card',
    name: 'Glassmorphism Card UI',
    language: 'html',
    code: `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 24px;
      font-family: system-ui, -apple-system, sans-serif;
      background: #020813;
      color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 200px;
    }
    .card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(12px);
      padding: 24px;
      border-radius: 16px;
      width: 100%;
      max-width: 320px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .badge {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      color: #fff;
      font-size: 10px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 9999px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }
    h3 { margin: 0 0 8px 0; font-size: 18px; color: #fff; }
    p { margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5; }
    button {
      margin-top: 16px;
      width: 100%;
      padding: 10px;
      border: none;
      border-radius: 10px;
      background: #2563eb;
      color: white;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #1d4ed8; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">UpBit Academy Interactive</span>
    <h3>Next.js 15 LMS</h3>
    <p>Practice writing clean code and dynamic styling right inside your lesson environment.</p>
    <button onclick="alert('Hello from UpBit Sandbox!')">Click Me</button>
  </div>
</body>
</html>`,
  },
  {
    id: 'js-array',
    name: 'Array Methods & State Sync',
    language: 'javascript',
    code: `// Array Methods Demo
const lessons = [
  { id: 1, title: 'Course Intro', duration: '5m', completed: true },
  { id: 2, title: 'Server Components', duration: '14m', completed: true },
  { id: 3, title: 'Mux Player Setup', duration: '20m', completed: false },
  { id: 4, title: 'Stripe Webhooks', duration: '18m', completed: false }
];

console.log("📚 Total Lessons:", lessons.length);

const completed = lessons.filter(l => l.completed);
console.log("🎉 Completed Lessons:", completed.map(l => l.title));

const progressPct = Math.round((completed.length / lessons.length) * 100);
console.log(\`📊 Overall Progress: \${progressPct}%\`);`,
  },
];

interface CodeSandboxProps {
  initialCode?: string;
  initialLanguage?: 'javascript' | 'html';
}

export default function CodeSandbox({ initialCode, initialLanguage = 'javascript' }: CodeSandboxProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>(DEFAULT_PRESETS[0].id);
  const [code, setCode] = useState<string>(initialCode || DEFAULT_PRESETS[0].code);
  const [language, setLanguage] = useState<'javascript' | 'html'>(initialLanguage);
  
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [executing, setExecuting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'split' | 'console' | 'preview'>('split');
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle Preset Change
  const handlePresetSelect = (presetId: string) => {
    const preset = DEFAULT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setSelectedPreset(preset.id);
      setCode(preset.code);
      setLanguage(preset.language);
      setLogs([]);
      setError(null);
      if (preset.language === 'html') {
        setViewMode('preview');
      } else {
        setViewMode('split');
      }
    }
  };

  // Run Code Logic
  const runCode = () => {
    setExecuting(true);
    setLogs([]);
    setError(null);

    if (language === 'html') {
      if (iframeRef.current) {
        iframeRef.current.srcdoc = code;
      }
      setExecuting(false);
      return;
    }

    // JavaScript Execution with Console Interception
    const capturedLogs: string[] = [];
    const customConsole = {
      log: (...args: any[]) => {
        capturedLogs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      },
      warn: (...args: any[]) => {
        capturedLogs.push(`[WARN] ` + args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      },
      error: (...args: any[]) => {
        capturedLogs.push(`[ERROR] ` + args.map((a) => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a))).join(' '));
      },
    };

    try {
      const runFn = new Function('console', 'setTimeout', code);
      runFn(customConsole, (fn: () => void, delay: number) => {
        setTimeout(() => {
          try {
            fn();
            setLogs([...capturedLogs]);
          } catch (e: any) {
            setError(e?.message || 'Async runtime error');
          }
        }, delay);
      });
      setLogs(capturedLogs.length ? capturedLogs : ['// Code executed with no console output']);
    } catch (err: any) {
      setError(err?.message || 'Syntax/Runtime Error');
    } finally {
      setExecuting(false);
    }
  };

  // Auto-run HTML preview on change if in html mode
  useEffect(() => {
    if (language === 'html' && iframeRef.current) {
      iframeRef.current.srcdoc = code;
    }
  }, [code, language]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetCode = () => {
    const current = DEFAULT_PRESETS.find((p) => p.id === selectedPreset);
    if (current) {
      setCode(current.code);
      setLogs([]);
      setError(null);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#030a16] overflow-hidden shadow-2xl flex flex-col font-sans">
      
      {/* ── Control Header ── */}
      <div className="px-4 py-3 bg-black/60 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          {/* Preset Selector */}
          <select
            value={selectedPreset}
            onChange={(e) => handlePresetSelect(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {DEFAULT_PRESETS.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#030a16] text-white">
                {p.name} ({p.language.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs text-gray-400">
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-md transition-colors ${viewMode === 'split' ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'}`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('console')}
              className={`px-2.5 py-1 rounded-md transition-colors ${viewMode === 'console' ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'}`}
            >
              Console
            </button>
            {language === 'html' && (
              <button
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded-md transition-colors ${viewMode === 'preview' ? 'bg-blue-600 text-white font-bold' : 'hover:text-white'}`}
              >
                UI Preview
              </button>
            )}
          </div>

          <button
            onClick={resetCode}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Reset Code"
          >
            <RotateCcw size={14} />
          </button>

          <button
            onClick={copyCode}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Copy Snippet"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>

          <button
            onClick={runCode}
            disabled={executing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            <Play size={13} fill="currentColor" /> {executing ? 'Running…' : 'Run Code'}
          </button>
        </div>
      </div>

      {/* ── Main Workspace Body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[380px] divide-y lg:divide-y-0 lg:divide-x divide-white/10">
        
        {/* Editor Column */}
        <div className={`flex flex-col bg-[#020712] ${viewMode === 'console' || viewMode === 'preview' ? 'hidden lg:flex' : ''}`}>
          <div className="px-4 py-2 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span className="flex items-center gap-1.5">
              <Code2 size={13} className="text-blue-400" /> {language === 'javascript' ? 'script.js' : 'index.html'}
            </span>
            <span className="text-gray-500">{code.split('\n').length} lines</span>
          </div>

          <div className="relative flex-1 p-3 font-mono text-xs text-gray-200">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              className="w-full h-full min-h-[320px] bg-transparent text-emerald-300 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-blue-500/30"
            />
          </div>
        </div>

        {/* Output / Preview Column */}
        <div className={`flex flex-col bg-[#040d1c] ${viewMode === 'split' ? 'block' : ''}`}>
          
          {/* Console / Output Tabs */}
          <div className="px-4 py-2 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400">
            <span className="flex items-center gap-1.5">
              {language === 'html' && viewMode === 'preview' ? (
                <>
                  <Layout size={13} className="text-cyan-400" /> Rendered UI Preview
                </>
              ) : (
                <>
                  <Terminal size={13} className="text-emerald-400" /> Output Console
                </>
              )}
            </span>
            <button
              onClick={() => { setLogs([]); setError(null); }}
              className="text-[10px] text-gray-500 hover:text-gray-300"
            >
              Clear Output
            </button>
          </div>

          {/* Render Area */}
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto">
            {language === 'html' && (viewMode === 'preview' || viewMode === 'split') ? (
              <iframe
                ref={iframeRef}
                title="Live HTML Preview"
                className="w-full h-full min-h-[300px] rounded-xl bg-white border border-white/10"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="space-y-2">
                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-start gap-2 text-xs">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Runtime Error</strong>
                      <span className="font-mono">{error}</span>
                    </div>
                  </div>
                )}

                {logs.length > 0 ? (
                  logs.map((log, i) => (
                    <pre
                      key={i}
                      className="p-2 rounded-lg bg-black/40 border border-white/5 text-emerald-400 font-mono text-xs leading-relaxed whitespace-pre-wrap break-all"
                    >
                      {log}
                    </pre>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500 space-y-2">
                    <Terminal size={24} className="opacity-40" />
                    <p className="text-xs">Click "Run Code" above to execute and see console output.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
