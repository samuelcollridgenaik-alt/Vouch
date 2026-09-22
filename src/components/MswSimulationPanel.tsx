import React, { useState } from 'react';
import {
  Radio,
  WifiOff,
  Clock,
  AlertTriangle,
  FileCode2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Activity,
  Server,
  Terminal
} from 'lucide-react';
import { MockSimulationMode, setSimulationMode, startBrowserWorker, stopBrowserWorker } from '../mocks/browser';

interface MswSimulationPanelProps {
  onSimulationChange?: (mode: MockSimulationMode) => void;
}

interface ModeOption {
  id: MockSimulationMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  expectedBehavior: string;
}

const MODES: ModeOption[] = [
  {
    id: 'normal',
    label: 'Live / Healthy (HTTP 200)',
    description: 'Normal network flow passing to live backend or verified mock',
    icon: CheckCircle2,
    expectedBehavior: 'Returns full AI analysis with source: "network"'
  },
  {
    id: 'http-500',
    label: 'Simulate HTTP 500',
    description: 'Server crash in backend AI inference pipeline',
    icon: AlertTriangle,
    expectedBehavior: 'Graceful fallback to local heuristic engine (errorType: "http")'
  },
  {
    id: 'http-503',
    label: 'Simulate HTTP 503',
    description: 'Upstream rate limit or quota exceeded',
    icon: Server,
    expectedBehavior: 'Non-blocking fallback preserving full threat analysis'
  },
  {
    id: 'network-drop',
    label: 'Simulate Network Drop',
    description: 'Complete offline / packet loss (HttpResponse.error)',
    icon: WifiOff,
    expectedBehavior: 'Zero network crash; instant offline heuristic evaluation'
  },
  {
    id: 'high-latency',
    label: 'Simulate High Latency (3s)',
    description: 'Slow cellular 3G response exceeding client timeout',
    icon: Clock,
    expectedBehavior: 'AbortController triggers prompt fallback in <500ms'
  },
  {
    id: 'malformed-json',
    label: 'Simulate Corrupted JSON',
    description: 'Malformed non-JSON payload stream from server',
    icon: FileCode2,
    expectedBehavior: 'JSON syntax error safely caught (errorType: "parsing")'
  },
  {
    id: 'invalid-schema',
    label: 'Simulate Schema Violation',
    description: 'Payload missing required threatIndex/threatLevel fields',
    icon: Terminal,
    expectedBehavior: 'Schema validator rejects malformed data and runs local heuristics'
  }
];

export const MswSimulationPanel: React.FC<MswSimulationPanelProps> = ({ onSimulationChange }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<MockSimulationMode>('normal');
  const [isWorkerActive, setIsWorkerActive] = useState<boolean>(false);

  const handleSelectMode = async (mode: MockSimulationMode) => {
    setActiveMode(mode);

    if (mode === 'normal') {
      setSimulationMode('normal');
    } else {
      // Ensure worker is running
      const started = await startBrowserWorker();
      setIsWorkerActive(started);
      setSimulationMode(mode, 3000);
    }

    onSimulationChange?.(mode);
  };

  const handleToggleWorker = async () => {
    if (isWorkerActive) {
      stopBrowserWorker();
      setIsWorkerActive(false);
      setActiveMode('normal');
      setSimulationMode('normal');
    } else {
      const started = await startBrowserWorker();
      setIsWorkerActive(started);
      if (started) {
        setSimulationMode(activeMode);
      }
    }
  };

  const currentOption = MODES.find((m) => m.id === activeMode) || MODES[0];

  return (
    <div
      id="msw-simulation-panel"
      className="rounded-xl border border-stone-200 bg-stone-50 overflow-hidden shadow-2xs transition-all text-stone-800"
    >
      <div className="flex items-center justify-between px-4 py-2.5 bg-stone-100/80 border-b border-stone-200">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-900 text-amber-400">
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight text-stone-900">
                MSW Fault Injection & Resilience Testing
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold ${
                  activeMode !== 'normal'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                Mode: {currentOption.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleWorker}
            className={`text-[11px] font-medium px-2.5 py-1 rounded-md border transition-colors cursor-pointer ${
              isWorkerActive
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : 'bg-white border-stone-300 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {isWorkerActive ? 'MSW Interceptor: ON' : 'Start MSW Interceptor'}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 px-2 py-1 rounded-md hover:bg-stone-200 transition-colors cursor-pointer"
            aria-expanded={isOpen}
          >
            <span className="text-[11px] font-medium">{isOpen ? 'Hide Matrix' : 'Configure Scenarios'}</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-4 space-y-3">
          <p className="text-xs text-stone-600">
            Simulate real-world API failures and hostile network environments to test vouch's client-side fallback defenses. Select any scenario below and submit a scan:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = activeMode === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleSelectMode(mode.id)}
                  className={`flex flex-col text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-stone-900 bg-white ring-1 ring-stone-900 shadow-xs'
                      : 'border-stone-200 bg-white hover:bg-stone-100/60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-600' : 'text-stone-500'}`} />
                    <span className="text-xs font-semibold text-stone-900">{mode.label}</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-snug mb-1.5">{mode.description}</p>
                  <span className="text-[10px] font-mono text-stone-600 bg-stone-50 border border-stone-200 rounded px-1.5 py-0.5 mt-auto">
                    {mode.expectedBehavior}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
