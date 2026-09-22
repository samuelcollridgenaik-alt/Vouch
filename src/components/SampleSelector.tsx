import React from 'react';
import { SAMPLE_CASES, SampleCase } from '../data/samples';
import { Sparkles, ShieldAlert, ShieldCheck } from 'lucide-react';

interface SampleSelectorProps {
  onSelectSample: (sample: SampleCase) => void;
  selectedId: string | null;
  compact?: boolean;
}

export const SampleSelector: React.FC<SampleSelectorProps> = ({
  onSelectSample,
  selectedId,
  compact = false,
}) => {
  return (
    <div id="sample-selector-panel" className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-stone-600" />
          <span className="text-xs font-semibold tracking-tight text-stone-700">
            Quick Test Cases (One-Click Pre-filled Scenarios)
          </span>
        </div>
        <span className="text-[11px] text-stone-400 hidden sm:inline">
          Click any preset to analyze instantly
        </span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth">
        {SAMPLE_CASES.map((sample) => {
          const isSelected = selectedId === sample.id;
          const isSafe = sample.category === 'Legitimate';

          return (
            <button
              key={sample.id}
              id={`preset-btn-${sample.id}`}
              onClick={() => onSelectSample(sample)}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full text-xs transition-all cursor-pointer select-none active:scale-[0.98] ${
                isSelected
                  ? 'bg-[#1a73e8] text-white shadow-[0_1px_3px_rgba(26,115,232,0.35)] border border-[#1a73e8]'
                  : 'liquid-glass-subtle hover:bg-white text-stone-700 hover:text-[#1a73e8] border border-stone-200/90 hover:border-[#1a73e8]/40'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isSafe ? (
                  <ShieldCheck className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#1e8e3e]'}`} />
                ) : (
                  <ShieldAlert className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#d93025]'}`} />
                )}
                <span className="font-semibold whitespace-nowrap text-[12px]">{sample.name}</span>
              </div>
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : isSafe
                    ? 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]'
                    : 'bg-[#fce8e6] text-[#c5221f] border border-[#fad2cf]'
                }`}
              >
                {sample.expectedRisk}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
