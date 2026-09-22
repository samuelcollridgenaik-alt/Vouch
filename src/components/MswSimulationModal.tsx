import React, { useState } from 'react';
import {
  X,
  Radio,
  WifiOff,
  Clock,
  AlertTriangle,
  FileCode2,
  CheckCircle2,
  Activity,
  Server,
  Terminal,
  Zap,
  RotateCcw
} from 'lucide-react';
import { MockSimulationMode, setSimulationMode, startBrowserWorker, stopBrowserWorker } from '../mocks/browser';

interface MswSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: MockSimulationMode;
  onModeSelect: (mode: MockSimulationMode) => void;
  latencyMs?: number | null;
  scanSource?: 'network' | 'heuristic-fallback' | null;
}

interface ModeOption {
  id: MockSimulationMode;
  label: string;
  badge: string;
  badgeColor: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  expectedBehavior: string;
}

const MODES: ModeOption[] = [
  {
    id: 'normal',
    label: 'Standard Live Flow (HTTP 200)',
    badge: 'Healthy API',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    description: 'Normal network flow passing to live backend or verified mock endpoint.',
    icon: CheckCircle2,
    expectedBehavior: 'Returns complete response payload with source: "network"'
  },
  {
    id: 'http-500',
    label: 'Simulate HTTP 500 (Server Crash)',
    badge: 'Server 500',
    badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
    description: 'Server crash in backend AI inference or database pipeline.',
    icon: AlertTriangle,
    expectedBehavior: 'Gracefully catches HTTP error; triggers instant heuristic fallback (errorType: "http")'
  },
  {
    id: 'http-503',
    label: 'Simulate HTTP 503 (Quota Exceeded)',
    badge: 'Rate Limit 503',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    description: 'Simulates upstream Gemini quota limit or cloud service downtime.',
    icon: Server,
    expectedBehavior: 'Seamless fallback without throwing unhandled UI exceptions'
  },
  {
    id: 'network-drop',
    label: 'Simulate Network Drop (Offline)',
    badge: 'Offline Drop',
    badgeColor: 'bg-stone-100 text-stone-800 border-stone-300',
    description: 'Complete transport connection drop or offline mobile environment.',
    icon: WifiOff,
    expectedBehavior: 'Zero transport crash; instant deterministic client evaluation'
  },
  {
    id: 'high-latency',
    label: 'Simulate High Latency (3s Delay)',
    badge: 'Timeout 3000ms',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
    description: 'Simulates sluggish cellular 3G network exceeding client threshold.',
    icon: Clock,
    expectedBehavior: 'AbortController triggers prompt fallback in < 500ms'
  },
  {
    id: 'malformed-json',
    label: 'Simulate Corrupted JSON Stream',
    badge: 'Syntax Error',
    badgeColor: 'bg-orange-50 text-orange-800 border-orange-200',
    description: 'Malformed non-JSON payload stream returned from server.',
    icon: FileCode2,
    expectedBehavior: 'JSON syntax parser error caught safely (errorType: "parsing")'
  },
  {
    id: 'invalid-schema',
    label: 'Simulate Schema Violation',
    badge: 'Schema Breach',
    badgeColor: 'bg-red-50 text-red-800 border-red-200',
    description: 'Payload missing mandatory threatIndex or threatLevel fields.',
    icon: Terminal,
    expectedBehavior: 'Schema validator rejects payload and activates local heuristics'
  }
];

export const MswSimulationModal: React.FC<MswSimulationModalProps> = ({
  isOpen,
  onClose,
  activeMode,
  onModeSelect,
  latencyMs,
  scanSource
}) => {
  const [isWorkerRunning, setIsWorkerRunning] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleModeChange = async (mode: MockSimulationMode) => {
    onModeSelect(mode);
    if (mode === 'normal') {
      setSimulationMode('normal');
    } else {
      const started = await startBrowserWorker();
      setIsWorkerRunning(started);
      setSimulationMode(mode, 3000);
    }
  };

  const handleToggleWorker = async () => {
    if (isWorkerRunning) {
      stopBrowserWorker();
      setIsWorkerRunning(false);
      handleModeChange('normal');
    } else {
      const started = await startBrowserWorker();
      setIsWorkerRunning(started);
      if (started) {
        setSimulationMode(activeMode);
      }
    }
  };

  return (
    <div
      id="msw-simulation-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 my-8 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-amber-400 shadow-xs">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 tracking-tight">
                  MSW Fault Injection & Resilience Testing
                </h2>
                <span className="font-mono text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full border border-stone-200">
                  Mock Service Worker v2
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Simulate network outages, timeouts, and corrupted payloads to test client-side resilience
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Status Bar */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span className="font-medium text-stone-700">Active Scenario:</span>
            <span className="font-semibold text-stone-900">
              {MODES.find((m) => m.id === activeMode)?.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleWorker}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
                isWorkerRunning
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
              }`}
            >
              {isWorkerRunning ? '● Browser Worker: ACTIVE' : 'Start MSW Worker'}
            </button>
          </div>
        </div>

        {/* Modes Grid */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = activeMode === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleModeChange(mode.id)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-stone-900 bg-stone-50/90 ring-1 ring-stone-900 shadow-xs'
                      : 'border-stone-200 bg-white hover:bg-stone-50/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-600' : 'text-stone-500'}`} />
                      <span className="text-xs font-semibold text-stone-900">{mode.label}</span>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${mode.badgeColor}`}>
                      {mode.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-snug mb-2">{mode.description}</p>
                  <div className="mt-auto pt-1.5 border-t border-stone-100 text-[10px] font-mono text-stone-600">
                    Behavior: {mode.expectedBehavior}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-100 text-xs text-stone-500">
          <span>Automated tests: <code>npm run test:msw</code></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 text-white font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Apply Scenario & Close
          </button>
        </div>
      </div>
    </div>
  );
};
