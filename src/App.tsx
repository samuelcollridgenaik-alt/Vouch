import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  RotateCcw,
  Sparkles,
  FileText,
  Globe,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ClipboardPaste,
  Copy,
  Check,
  Camera,
  X,
  Printer,
  ChevronDown,
  ChevronUp,
  Activity,
  BookOpen,
  ArrowRight,
  PhoneCall,
  ArrowLeft,
  SlidersHorizontal,
  ExternalLink,
  Layers,
  Scale
} from 'lucide-react';
import { ScanResult, ScanRequest } from './types';
import { ThreatGauge } from './components/ThreatGauge';
import { DomainInspectorCard } from './components/DomainInspectorCard';
import { PaymentFlagsCard } from './components/PaymentFlagsCard';
import { ScamTrapVisualizer } from './components/ScamTrapVisualizer';
import { ForensicBreakdown } from './components/ForensicBreakdown';
import { IncidentResponseCard } from './components/IncidentResponseCard';
import { RecruiterChallengeScript } from './components/RecruiterChallengeScript';
import { SampleSelector } from './components/SampleSelector';
import { LetterUploadModal, ExtractedLetterData } from './components/LetterUploadModal';
import { SafetyGuideModal } from './components/SafetyGuideModal';
import { MswSimulationModal } from './components/MswSimulationModal';
import { AnalyzingView } from './components/AnalyzingView';
import { SAMPLE_CASES, SampleCase } from './data/samples';
import { runHeuristicScan } from './utils/securityScanner';
import { formatSecurityReport } from './utils/reportFormatter';
import { executeScanWithFallback } from './services/scanService';
import { MockSimulationMode } from './mocks/browser';

type InputTab = 'paste' | 'upload' | 'url';
type AppView = 'intake' | 'analyzing' | 'results';
type ResultsTab = 'overview' | 'forensics' | 'defense';

export default function App() {
  // Navigation & View States (Multi-stage flow)
  const [currentView, setCurrentView] = useState<AppView>('intake');
  const [resultsTab, setResultsTab] = useState<ResultsTab>('overview');
  const [showFullDocket, setShowFullDocket] = useState<boolean>(false);

  // Input states
  const [activeTab, setActiveTab] = useState<InputTab>('paste');
  const [inputText, setInputText] = useState<string>('');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [senderEmail, setSenderEmail] = useState<string>('');
  const [showOptionalMeta, setShowOptionalMeta] = useState<boolean>(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState<boolean>(false);
  const [isMswModalOpen, setIsMswModalOpen] = useState<boolean>(false);

  // Simulation & Telemetry
  const [simulationMode, setSimulationModeState] = useState<MockSimulationMode>('normal');
  const [isReportCopied, setIsReportCopied] = useState<boolean>(false);
  const [extractedLetterInfo, setExtractedLetterInfo] = useState<ExtractedLetterData | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSource, setScanSource] = useState<'network' | 'heuristic-fallback' | null>(null);
  const [scanLatency, setScanLatency] = useState<number | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  // Dynamic Headline Shuffle
  const headlinePhrases = [
    'Verify offer legitimacy before you commit.',
    'Detect advance-fee traps before you transfer.',
    'Authenticate corporate domains before you reply.',
    'Protect your career identity before you sign.',
  ];
  const [headlineIndex, setHeadlineIndex] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % headlinePhrases.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [headlinePhrases.length]);

  // Keyboard shortcut: Cmd/Ctrl + Enter to scan
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        const form = document.getElementById('inspection-form') as HTMLFormElement | null;
        if (form) form.requestSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputText, inputUrl, senderEmail]);

  const handleSelectSample = (sample: SampleCase) => {
    setSelectedSampleId(sample.id);
    setInputText(sample.text);
    setInputUrl(sample.url);
    setSenderEmail(sample.senderEmail);
    setExtractedLetterInfo(null);
    setScanError(null);
    setFallbackNotice(null);
    setActiveTab('paste');

    // Trigger analyzing transition and result
    executeScanPipeline(sample.text, sample.url, sample.senderEmail);
  };

  const executeScanPipeline = async (text: string, url: string, email: string) => {
    if (!text.trim() && !url.trim() && !email.trim()) {
      setScanError('Please paste offer text, enter a sender email, or provide a URL to inspect.');
      return;
    }

    setIsLoading(true);
    setCurrentView('analyzing');
    setScanError(null);

    const payload: ScanRequest = {
      text,
      url,
      senderEmail: email,
    };

    // Minimum delay to let the high-craft liquid scanning animation communicate credibility
    const startTime = Date.now();

    try {
      const response = await executeScanWithFallback(payload, {
        timeoutMs: 4500,
        onFallback: (reason, errorType) => {
          console.warn(`[${errorType}] Fallback engaged:`, reason);
        },
      });

      const elapsed = Date.now() - startTime;
      if (elapsed < 1100) {
        await new Promise((r) => setTimeout(r, 1100 - elapsed));
      }

      setScanResult(response.result);
      setScanSource(response.source);
      setScanLatency(response.latencyMs);
      setFallbackNotice(response.error || null);
      setCurrentView('results');
    } catch (err: any) {
      console.warn('Scan encountered unexpected failure, falling back to heuristic scanner:', err);
      const fallback = runHeuristicScan(payload);

      const elapsed = Date.now() - startTime;
      if (elapsed < 900) {
        await new Promise((r) => setTimeout(r, 900 - elapsed));
      }

      setScanResult(fallback);
      setScanSource('heuristic-fallback');
      setFallbackNotice(err?.message || 'Unexpected scan execution failure');
      setCurrentView('results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    executeScanPipeline(inputText, inputUrl, senderEmail);
  };

  const handleReset = () => {
    setInputText('');
    setInputUrl('');
    setSenderEmail('');
    setSelectedSampleId(null);
    setExtractedLetterInfo(null);
    setScanResult(null);
    setScanError(null);
    setScanSource(null);
    setScanLatency(null);
    setFallbackNotice(null);
    setCurrentView('intake');
  };

  const handlePrintDocket = () => {
    try {
      window.print();
    } catch (e) {
      console.warn('Direct print call prevented by iframe sandbox:', e);
    }
  };

  const handleCopyResults = async () => {
    if (!scanResult) return;
    try {
      const reportText = formatSecurityReport(scanResult);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reportText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = reportText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsReportCopied(true);
      setTimeout(() => setIsReportCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy report:', err);
    }
  };

  const handleExtractedLetter = (data: ExtractedLetterData) => {
    setSelectedSampleId(null);
    setInputText(data.text);
    if (data.url) setInputUrl(data.url);
    if (data.senderEmail) setSenderEmail(data.senderEmail);
    setExtractedLetterInfo(data);
    setScanError(null);
    setActiveTab('paste');

    // Automatically trigger inspection of extracted letter
    executeScanPipeline(data.text, data.url || inputUrl, data.senderEmail || senderEmail);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputText(text);
        setSelectedSampleId(null);
        setActiveTab('paste');
      }
    } catch {
      // Handled if clipboard read is restricted in iframe
    }
  };

  return (
    <div
      id="vouch-app"
      className="min-h-screen text-stone-900 selection:bg-stone-900 selection:text-white antialiased flex flex-col justify-between"
    >
      {/* ========================================================================= */}
      {/* 1. TOP NAVIGATION                                                         */}
      {/* ========================================================================= */}
      <header
        id="main-header"
        className="sticky top-0 z-40 border-b border-stone-200/70 bg-white/80 backdrop-blur-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3">
          {/* Logo & Identity */}
          <div
            onClick={() => setCurrentView('intake')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            {/* Dark container with Google colors gradient overlay and mix-blend animation */}
            <div className="relative flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-black shadow-md border border-stone-800/80 overflow-hidden group-hover:scale-105 transition-transform duration-300">
              {/* Google colors gradient layer with mix-blend-screen / overlay */}
              <div
                className="absolute inset-0 google-gradient-anim opacity-85 mix-blend-screen pointer-events-none"
                style={{ filter: 'blur(3px)' }}
              />
              <div
                className="absolute inset-0 bg-radial from-transparent via-black/30 to-black/80 pointer-events-none"
              />
              {/* Shield Icon */}
              <ShieldCheck className="relative z-10 h-4.5 w-4.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight font-display google-gradient-text drop-shadow-[0_1px_1px_rgba(0,0,0,0.06)]">
                vouch
              </span>
              <span className="inline-flex items-center rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[10px] font-mono font-medium text-[#1967d2] border border-[#d2e3fc]">
                security
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Helpline Indicator */}
            <button
              type="button"
              onClick={() => setIsSafetyModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass-subtle hover:bg-white text-stone-700 text-xs font-medium border border-stone-200/80 transition-all cursor-pointer shadow-2xs active:scale-[0.98]"
              title="Official Cyber Crime Helpline (India 1930 & US IC3)"
            >
              <PhoneCall className="w-3.5 h-3.5 text-stone-500" />
              <span className="text-[11px]">Helpline <strong>1930</strong></span>
            </button>

            {/* Safety Handbook Button */}
            <button
              type="button"
              onClick={() => setIsSafetyModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full liquid-glass-subtle hover:bg-white px-3.5 py-1.5 text-xs font-medium text-stone-800 shadow-2xs hover:border-stone-300 transition-all cursor-pointer active:scale-[0.98]"
            >
              <BookOpen className="h-3.5 w-3.5 text-stone-600" />
              <span>Guide</span>
            </button>

            {/* Simulation Lab Button */}
            <button
              type="button"
              onClick={() => setIsMswModalOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-[0.98] ${
                simulationMode !== 'normal'
                  ? 'bg-amber-50 border border-amber-300 text-amber-900 font-bold ring-1 ring-amber-400'
                  : 'liquid-glass-subtle hover:bg-white border border-stone-200/90 text-stone-700'
              }`}
              title="Simulate network drops, HTTP 500/503 errors, and latency"
            >
              <Activity className={`h-3.5 w-3.5 ${simulationMode !== 'normal' ? 'text-amber-600 animate-pulse' : 'text-stone-500'}`} />
              <span>Fault Lab</span>
              {simulationMode !== 'normal' && (
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. BODY CONTENT ROUTED BY MULTI-STAGE MACHINE (Intake -> Analyzing -> Results) */}
      {/* ========================================================================= */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {/* ===================================================================== */}
          {/* STATE 1: INTAKE & DISCOVERY                                           */}
          {/* ===================================================================== */}
          {currentView === 'intake' && (
            <motion.div
              key="intake-stage"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="max-w-4xl mx-auto space-y-8"
            >
              {/* Serene Headline */}
              <div className="text-center space-y-3 pt-4 sm:pt-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full liquid-glass-subtle border border-stone-200/80 text-xs font-semibold text-stone-700 shadow-2xs">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#1a73e8]" />
                    <span className="w-2 h-2 rounded-full bg-[#ea4335]" />
                    <span className="w-2 h-2 rounded-full bg-[#fbbc04]" />
                    <span className="w-2 h-2 rounded-full bg-[#34a853]" />
                  </div>
                  <span>Autonomous Document & Phishing Defense</span>
                </div>
                <div className="relative min-h-[4rem] sm:min-h-[4.5rem] lg:min-h-[5.5rem] flex items-center justify-center overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.h1
                      key={headlineIndex}
                      initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -18, filter: 'blur(4px)' }}
                      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                      className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 font-display text-center leading-[1.15]"
                    >
                      {headlinePhrases[headlineIndex]}
                    </motion.h1>
                  </AnimatePresence>
                </div>
                <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
                  Scan appointment letters, contracts, and recruiter communications against advance-fee check schemes, brand typosquatting, and payment extortion.
                </p>
              </div>

              {/* Central Floating Intake Capsule */}
              <section
                id="inspection-form-section"
                className="liquid-glass rounded-3xl p-5 sm:p-7 shadow-2xl relative space-y-5"
              >
                {/* Segmented Liquid Switcher */}
                <div className="flex p-1 rounded-full bg-stone-100/90 border border-stone-200/70 text-xs max-w-md mx-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('paste')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full font-semibold transition-all cursor-pointer ${
                      activeTab === 'paste'
                        ? 'bg-[#1a73e8] text-white shadow-sm'
                        : 'text-stone-600 hover:text-[#1a73e8]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Paste Text</span>
                  </button>

                  <button
                    type="button"
                    id="open-letter-upload-btn"
                    onClick={() => {
                      setActiveTab('upload');
                      setIsUploadModalOpen(true);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full font-semibold transition-all cursor-pointer ${
                      activeTab === 'upload'
                        ? 'bg-[#1a73e8] text-white shadow-sm'
                        : 'text-stone-600 hover:text-[#1a73e8]'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5 text-[#f9ab00]" />
                    <span>Scan Letter (OCR)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('url');
                      setShowOptionalMeta(true);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full font-semibold transition-all cursor-pointer ${
                      activeTab === 'url'
                        ? 'bg-[#1a73e8] text-white shadow-sm'
                        : 'text-stone-600 hover:text-[#1a73e8]'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Domain / URL</span>
                  </button>
                </div>

                {/* Form Intake */}
                <form id="inspection-form" onSubmit={handleScan} className="space-y-4">
                  {/* Digitized Letter Pre-fill Banner */}
                  {extractedLetterInfo && (
                    <div
                      id="extracted-letter-banner"
                      className="rounded-2xl bg-emerald-50/90 border border-emerald-200 p-3.5 text-xs text-emerald-950 flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 mt-0.5">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap font-bold">
                            <span>Document Digitized via Gemini OCR</span>
                            {extractedLetterInfo.companyName && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900 font-mono">
                                {extractedLetterInfo.companyName}
                              </span>
                            )}
                          </div>
                          <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
                            {extractedLetterInfo.summary || 'Verbatim text, domain URL, and recruiter email were extracted and loaded into inspection fields.'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExtractedLetterInfo(null)}
                        className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                        title="Dismiss notification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Primary Offer Textarea with Liquid Glass Styling */}
                  <div className="relative">
                    <textarea
                      id="offer-text-input"
                      rows={6}
                      value={inputText}
                      onChange={(e) => {
                        setInputText(e.target.value);
                        setSelectedSampleId(null);
                      }}
                      placeholder="Paste the full offer letter, appointment email, recruitment message, or WhatsApp / Telegram chat here..."
                      className="w-full liquid-glass-input rounded-2xl p-4 text-xs font-mono leading-relaxed focus:outline-none transition-all placeholder:text-stone-400"
                    />

                    {/* Inline Text Controls (Char count + Paste) */}
                    <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-white/80 backdrop-blur-md rounded-xl px-2.5 py-1 border border-stone-200/80 text-[11px] text-stone-500 shadow-2xs">
                      <button
                        type="button"
                        id="paste-clipboard-btn"
                        onClick={handlePasteClipboard}
                        className="hover:text-stone-900 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <ClipboardPaste className="w-3 h-3" />
                        <span>Paste</span>
                      </button>
                      <span className="text-stone-300">•</span>
                      <span className="font-mono">{inputText.length} chars</span>
                    </div>
                  </div>

                  {/* Progressive Disclosure Drawer: Sender Email & URL Link */}
                  <div className="rounded-2xl border border-stone-200/60 p-3 bg-white/50 backdrop-blur-md space-y-3">
                    <button
                      type="button"
                      onClick={() => setShowOptionalMeta(!showOptionalMeta)}
                      className="flex items-center justify-between w-full text-left text-xs font-semibold text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-stone-500" />
                        <span>Sender Domain & Recruiter Email (Optional for deeper origin forensics)</span>
                      </span>
                      {showOptionalMeta ? <ChevronUp className="w-4 h-4 text-stone-500" /> : <ChevronDown className="w-4 h-4 text-stone-500" />}
                    </button>

                    {showOptionalMeta && (
                      <div className="pt-2 border-t border-stone-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-stone-600 mb-1 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-stone-400" />
                            Sender Email Address
                          </label>
                          <input
                            type="email"
                            id="sender-email-input"
                            value={senderEmail}
                            onChange={(e) => {
                              setSenderEmail(e.target.value);
                              setSelectedSampleId(null);
                            }}
                            placeholder="e.g. hr-campus@tcs-careers.xyz"
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs font-mono focus:border-stone-900 focus:outline-none bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-medium text-stone-600 mb-1 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-stone-400" />
                            Website / Application Link
                          </label>
                          <input
                            type="text"
                            id="url-input"
                            value={inputUrl}
                            onChange={(e) => {
                              setInputUrl(e.target.value);
                              setSelectedSampleId(null);
                            }}
                            placeholder="e.g. https://careers-tcs-verify.top/portal"
                            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-xs font-mono focus:border-stone-900 focus:outline-none bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Error Notification */}
                  {scanError && (
                    <div className="rounded-2xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{scanError}</span>
                    </div>
                  )}

                  {/* Form Action Row: Clear + Primary Action Pill */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      id="reset-inputs-btn"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors px-3 py-2 rounded-full hover:bg-stone-100 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear inputs</span>
                    </button>

                    <button
                      type="submit"
                      id="run-scan-btn"
                      disabled={isLoading}
                      className="w-full sm:w-auto flex items-center justify-center gap-2.5 rounded-full btn-vouch-primary px-7 py-3.5 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]"
                    >
                      <ShieldAlert className="w-4 h-4 text-white" />
                      <span>Inspect Offer Safety</span>
                      <ArrowRight className="w-4 h-4 text-white/80" />
                    </button>
                  </div>
                </form>
              </section>

              {/* Quick Suggestion Pills */}
              <div className="space-y-3 pt-2">
                <SampleSelector
                  onSelectSample={handleSelectSample}
                  selectedId={selectedSampleId}
                />
              </div>

              {/* 3-Pillar Security Architecture Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-left">
                <div className="liquid-glass-card rounded-2xl p-4 space-y-2 border-t-2 border-t-[#1a73e8]">
                  <div className="w-8 h-8 rounded-xl bg-[#e8f0fe] flex items-center justify-center text-[#1a73e8]">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 font-display">1. Origin & DNS Integrity</h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Audits registration age, brand typosquatting (.xyz, .top), and free webmail corporate impersonation.
                  </p>
                </div>

                <div className="liquid-glass-card rounded-2xl p-4 space-y-2 border-t-2 border-t-[#d93025]">
                  <div className="w-8 h-8 rounded-xl bg-[#fce8e6] flex items-center justify-center text-[#d93025]">
                    <Scale className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 font-display">2. Advance-Fee Trap Scan</h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Flags fake cashier check refunds, crypto transfers, and mandatory security deposits before work begins.
                  </p>
                </div>

                <div className="liquid-glass-card rounded-2xl p-4 space-y-2 border-t-2 border-t-[#1e8e3e]">
                  <div className="w-8 h-8 rounded-xl bg-[#e6f4ea] flex items-center justify-center text-[#1e8e3e]">
                    <ShieldCheck className="w-4 h-4 text-[#1e8e3e]" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 font-display">3. Candidate Rights Defense</h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Generates verifiable counter-challenge questions and pre-formatted IC3 & 1930 cybercrime reports.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ===================================================================== */}
          {/* STATE 2: ANALYZING (Fluid Scanning Radar View)                        */}
          {/* ===================================================================== */}
          {currentView === 'analyzing' && (
            <motion.div
              key="analyzing-stage"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <AnalyzingView onCancel={() => setCurrentView('intake')} />
            </motion.div>
          )}

          {/* ===================================================================== */}
          {/* STATE 3: RESULTS (Curated Multi-Tab Forensic Dossier)                 */}
          {/* ===================================================================== */}
          {currentView === 'results' && scanResult && (
            <motion.div
              key="results-stage"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Results Top Navigation Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200/80 pb-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentView('intake')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass-subtle hover:bg-white text-xs font-semibold text-stone-800 border border-stone-200/90 shadow-2xs hover:border-stone-400 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Inspect Another Offer</span>
                  </button>

                  <span className="text-stone-300 hidden sm:inline">|</span>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-900 font-display">
                      {selectedSampleId
                        ? SAMPLE_CASES.find((s) => s.id === selectedSampleId)?.name
                        : extractedLetterInfo?.companyName
                        ? `Scanned Letter: ${extractedLetterInfo.companyName}`
                        : 'Custom Inspection Dossier'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        scanResult.threatIndex >= 75
                          ? 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]'
                          : scanResult.threatIndex >= 50
                          ? 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]'
                          : 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
                      }`}
                    >
                      {scanResult.threatLevel} ({scanResult.threatIndex}%)
                    </span>
                  </div>
                </div>

                {/* Primary Report Actions (Print, Copy, Re-scan) */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="print-docket-btn"
                    onClick={handlePrintDocket}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full liquid-glass-subtle hover:bg-white text-xs font-semibold text-stone-800 border border-stone-200/90 shadow-2xs transition-all cursor-pointer"
                    title="Print or save official PDF forensic docket"
                  >
                    <Printer className="w-3.5 h-3.5 text-stone-600" />
                    <span>Print Docket</span>
                  </button>

                  <button
                    type="button"
                    id="copy-results-btn"
                    onClick={handleCopyResults}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full liquid-glass-subtle hover:bg-white text-xs font-semibold text-stone-800 border border-stone-200/90 shadow-2xs transition-all cursor-pointer"
                    title="Copy full forensic threat assessment to clipboard"
                  >
                    {isReportCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#1e8e3e]" />
                        <span className="text-[#137333] font-semibold">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-stone-600" />
                        <span>Copy Report</span>
                      </>
                    )}
                  </button>

                  {/* Toggle: Continuous Full Dossier View */}
                  <button
                    type="button"
                    onClick={() => setShowFullDocket(!showFullDocket)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                      showFullDocket
                        ? 'bg-[#1a73e8] text-white border-[#1a73e8] shadow-sm'
                        : 'liquid-glass-subtle hover:bg-white text-stone-700 border-stone-200/90'
                    }`}
                    title="Toggle continuous view of all sections"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{showFullDocket ? 'Tabbed View' : 'Expand All'}</span>
                  </button>
                </div>
              </div>

              {/* Telemetry & Fallback Indicators */}
              {fallbackNotice ? (
                <div
                  id="heuristic-fallback-alert"
                  className="rounded-2xl border border-[#feefc3] bg-[#fef7e0]/90 p-4 text-xs text-[#b06000] flex items-start gap-3 shadow-2xs"
                >
                  <AlertTriangle className="w-5 h-5 text-[#f9ab00] shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[#804200]">Resilient Heuristic Fallback Engaged</span>
                      <span className="font-mono text-[10px] bg-[#feefc3] px-2 py-0.5 rounded-full text-[#b06000] border border-[#feefc3]">
                        Latency: {scanLatency ?? 0}ms • Source: heuristic-fallback
                      </span>
                    </div>
                    <p className="mt-1 text-[#804200] leading-relaxed font-sans text-[11px]">
                      {fallbackNotice} — Evaluated seamlessly via local deterministic rules.
                    </p>
                  </div>
                </div>
              ) : scanSource === 'network' ? (
                <div
                  id="network-telemetry-banner"
                  className="rounded-full border border-[#ceead6] bg-[#e6f4ea]/80 px-4 py-2 text-xs text-[#137333] flex items-center justify-between gap-2 shadow-2xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#1e8e3e] shrink-0" />
                    <span className="font-semibold font-sans">Network Telemetry:</span>
                    <span className="text-[#137333]">HTTP 200 Live Analysis</span>
                  </div>
                  <div className="text-[11px] text-[#137333]">
                    {scanLatency ?? 0}ms • {scanResult.scanEngine}
                  </div>
                </div>
              ) : null}

              {/* Segmented Liquid Dossier Tab Switcher (Unless Full Continuous View) */}
              {!showFullDocket && (
                <div className="flex p-1 rounded-full bg-stone-100/90 border border-stone-200/70 text-xs max-w-xl mx-auto shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setResultsTab('overview')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full font-semibold transition-all cursor-pointer ${
                      resultsTab === 'overview'
                        ? 'bg-[#1a73e8] text-white shadow-sm'
                        : 'text-stone-600 hover:text-[#1a73e8]'
                    }`}
                  >
                    <Activity className={`w-3.5 h-3.5 ${resultsTab === 'overview' ? 'text-white' : 'text-[#1a73e8]'}`} />
                    <span>Executive Assessment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultsTab('forensics')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full font-semibold transition-all cursor-pointer ${
                      resultsTab === 'forensics'
                        ? 'bg-[#1a73e8] text-white shadow-sm'
                        : 'text-stone-600 hover:text-[#d93025]'
                    }`}
                  >
                    <Search className={`w-3.5 h-3.5 ${resultsTab === 'forensics' ? 'text-white' : 'text-[#d93025]'}`} />
                    <span>Forensic Evidence</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultsTab('defense')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full font-semibold transition-all cursor-pointer ${
                      resultsTab === 'defense'
                        ? 'bg-[#1a73e8] text-white shadow-sm'
                        : 'text-stone-600 hover:text-[#1e8e3e]'
                    }`}
                  >
                    <ShieldCheck className={`w-3.5 h-3.5 ${resultsTab === 'defense' ? 'text-white' : 'text-[#1e8e3e]'}`} />
                    <span>Counter-Defense</span>
                  </button>
                </div>
              )}

              {/* The Dossier Content Section */}
              <div id="results-display-section" className="space-y-6">
                {/* TAB 1: EXECUTIVE ASSESSMENT & SPEEDOMETER */}
                {(showFullDocket || resultsTab === 'overview') && (
                  <div className="space-y-6">
                    {/* Speedometer Gauge & Threat Assessment */}
                    <ThreatGauge
                      score={scanResult.threatIndex}
                      level={scanResult.threatLevel}
                      confidenceLevel={scanResult.confidenceLevel}
                      confidenceReason={scanResult.confidenceReason}
                      verdictTitle={scanResult.verdictTitle}
                      breakdown={scanResult.breakdownScores}
                    />

                    {/* Executive Summary Narrative */}
                    <div id="executive-summary-card" className="liquid-glass-card rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 font-display">
                            Executive Security Assessment
                          </h3>
                          <span className="text-[11px] font-mono text-stone-400">
                            • {scanResult.scanEngine}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-stone-800 leading-relaxed font-medium">
                        {scanResult.executiveSummary}
                      </p>
                    </div>

                    {/* Interactive Scam Trap Flow if financial trap detected */}
                    {scanResult.paymentDemandFlags && scanResult.paymentDemandFlags.length > 0 && (
                      <ScamTrapVisualizer hasPaymentFlag={true} />
                    )}
                  </div>
                )}

                {/* TAB 2: FORENSIC EVIDENCE & ORIGIN AUDIT */}
                {(showFullDocket || resultsTab === 'forensics') && (
                  <div className="space-y-6">
                    {/* 2-Column Liquid Cards: Domain & Payment Demands */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <DomainInspectorCard audit={scanResult.domainAudit} />
                      <PaymentFlagsCard flags={scanResult.paymentDemandFlags} />
                    </div>

                    {/* Forensic Signals: Process & Linguistic Highlights */}
                    <ForensicBreakdown
                      processFlags={scanResult.processRedFlags}
                      linguisticSignals={scanResult.linguisticSignals}
                      highlightedExcerpts={scanResult.highlightedExcerpts}
                    />
                  </div>
                )}

                {/* TAB 3: COUNTER-DEFENSE & LEGAL ACTION */}
                {(showFullDocket || resultsTab === 'defense') && (
                  <div className="space-y-6">
                    {/* Candidate Counter-Challenge Verification Script */}
                    {scanResult.threatIndex >= 30 && (
                      <RecruiterChallengeScript
                        claimedCompany={extractedLetterInfo?.companyName}
                        senderEmail={senderEmail}
                      />
                    )}

                    {/* Incident Response & Law Enforcement Plan */}
                    <IncidentResponseCard
                      actionPlan={scanResult.actionPlan}
                      reportTemplate={scanResult.reportTemplate}
                      threatIndex={scanResult.threatIndex}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ========================================================================= */}
      {/* 3. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="border-t border-stone-200/80 bg-white/70 backdrop-blur-md py-6 text-center text-xs text-stone-500 mt-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-stone-900 font-display">vouch</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#ea4335]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#fbbc04]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#34a853]" />
            </div>
            <span>• Document & Contract Security</span>
          </div>
          <div className="flex items-center gap-3">
            <span>© 2026 samuelio. All rights reserved.</span>
            <span>•</span>
            <span className="font-mono text-[10px] text-[#137333] bg-[#e6f4ea] px-2.5 py-0.5 rounded-full border border-[#ceead6]">
              Verified Production Ready
            </span>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 4. MODALS (Accessible Dialogs for Guides & Fault Injection)                */}
      {/* ========================================================================= */}
      <SafetyGuideModal
        isOpen={isSafetyModalOpen}
        onClose={() => setIsSafetyModalOpen(false)}
      />

      <MswSimulationModal
        isOpen={isMswModalOpen}
        onClose={() => setIsMswModalOpen(false)}
        activeMode={simulationMode}
        onModeSelect={(mode) => setSimulationModeState(mode)}
        latencyMs={scanLatency}
        scanSource={scanSource}
      />

      <LetterUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onExtracted={handleExtractedLetter}
      />
    </div>
  );
}
