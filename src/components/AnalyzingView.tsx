import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Globe, CreditCard, Sparkles, CheckCircle2 } from 'lucide-react';

interface AnalyzingViewProps {
  onCancel?: () => void;
}

const STAGES = [
  {
    icon: Globe,
    title: 'Domain & Origin Integrity',
    description: 'Analyzing domain age, brand typosquatting, disposable TLDs, and MX routing...',
    color: '#1a73e8', // Google Blue
    badgeBg: 'bg-[#e8f0fe] text-[#1967d2] border-[#d2e3fc]',
    iconBg: 'bg-[#1a73e8]',
    ringColor: 'rgba(26, 115, 232, 0.25)',
  },
  {
    icon: CreditCard,
    title: 'Financial Demand Audit',
    description: 'Scanning for fake cashier check refunds, wire transfer traps, and UPI deposit demands...',
    color: '#d93025', // Google Red
    badgeBg: 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]',
    iconBg: 'bg-[#d93025]',
    ringColor: 'rgba(217, 48, 37, 0.25)',
  },
  {
    icon: Sparkles,
    title: 'Linguistic & Process Coercion',
    description: 'Measuring artificial urgency, off-platform chat directives, and interview anomalies...',
    color: '#f9ab00', // Google Yellow
    badgeBg: 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]',
    iconBg: 'bg-[#f9ab00]',
    ringColor: 'rgba(249, 171, 0, 0.25)',
  },
  {
    icon: ShieldAlert,
    title: 'Multi-Vector Threat Synthesis',
    description: 'Calculating mathematical Scam Threat Index and generating defense docket...',
    color: '#1e8e3e', // Google Green
    badgeBg: 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]',
    iconBg: 'bg-[#1e8e3e]',
    ringColor: 'rgba(30, 142, 62, 0.25)',
  },
];

export const AnalyzingView: React.FC<AnalyzingViewProps> = ({ onCancel }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
    }, 700);

    return () => clearInterval(timer);
  }, []);

  const currentStage = STAGES[currentStageIndex];
  const CurrentIcon = currentStage.icon;

  return (
    <div id="analyzing-view-container" className="flex flex-col items-center justify-center py-12 px-4 max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="w-full liquid-glass rounded-3xl p-8 sm:p-10 border border-stone-200/80 shadow-2xl relative overflow-hidden text-center space-y-8"
      >
        {/* Google 4-Color Ambient Matte Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-700 opacity-20"
          style={{ backgroundColor: currentStage.color }}
        />

        {/* Liquid Pulsing Radar Stage with Active Google Matte Color */}
        <div className="relative mx-auto flex items-center justify-center w-24 h-24">
          <motion.div
            className="absolute inset-0 rounded-full border"
            style={{ borderColor: currentStage.color, backgroundColor: currentStage.ringColor }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -inset-3 rounded-full border"
            style={{ borderColor: currentStage.color, backgroundColor: currentStage.ringColor }}
            animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2.2, delay: 0.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div
            className="relative z-10 w-16 h-16 rounded-2xl text-white flex items-center justify-center shadow-lg transition-colors duration-500"
            style={{ backgroundColor: currentStage.color }}
          >
            <CurrentIcon className="w-8 h-8 text-white animate-pulse" />
          </div>
        </div>

        {/* Stage Content */}
        <div className="space-y-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-[11px] font-semibold border transition-all duration-300 ${currentStage.badgeBg}`}>
            <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: currentStage.color }} />
            Stage {currentStageIndex + 1} of {STAGES.length}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-display">
            {currentStage.title}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
            {currentStage.description}
          </p>
        </div>

        {/* Visual Progress Steps Checklist with Google Matte Accents */}
        <div className="space-y-2 text-left bg-stone-50/70 rounded-2xl p-4 border border-stone-200/60 text-xs">
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;

            return (
              <div
                key={stage.title}
                className={`flex items-center gap-3 p-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-white shadow-2xs font-semibold text-stone-900 border border-stone-200/80'
                    : isCompleted
                    ? 'text-stone-700'
                    : 'text-stone-400 opacity-60'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#1e8e3e]" />
                ) : isCurrent ? (
                  <div
                    className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin shrink-0"
                    style={{ borderColor: stage.color, borderTopColor: 'transparent' }}
                  />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-stone-300 shrink-0" />
                )}
                <span className="truncate">{stage.title}</span>
                {isCurrent && (
                  <span
                    className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: stage.ringColor, color: stage.color }}
                  >
                    Processing...
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Cancel Action if taking long */}
        {onCancel && (
          <div>
            <button
              type="button"
              onClick={onCancel}
              className="text-xs text-stone-500 hover:text-stone-800 transition-colors cursor-pointer underline underline-offset-4"
            >
              Cancel and return to intake
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
