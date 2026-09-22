import React from 'react';
import { ProcessRedFlag, LinguisticSignal, HighlightedExcerpt } from '../types';
import { Search, MessageSquare, Clock, AlertCircle } from 'lucide-react';

interface ForensicBreakdownProps {
  processFlags: ProcessRedFlag[];
  linguisticSignals: LinguisticSignal[];
  highlightedExcerpts: HighlightedExcerpt[];
}

export const ForensicBreakdown: React.FC<ForensicBreakdownProps> = ({
  processFlags,
  linguisticSignals,
  highlightedExcerpts,
}) => {
  return (
    <div id="forensic-breakdown-panel" className="bg-white/95 rounded-2xl border border-stone-200/90 p-5 shadow-2xs space-y-5">
      <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
        <Search className="w-4 h-4 text-stone-700" />
        <h3 className="text-sm font-bold text-stone-900 font-display">
          Forensic Breakdown & Social Engineering Signals
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Process Red Flags */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <MessageSquare className="w-3.5 h-3.5 text-stone-500" />
            <span>Recruitment / Leasing Process Anomalies</span>
          </div>

          {processFlags.length === 0 ? (
            <p className="text-xs text-stone-500 italic bg-stone-50 p-3 rounded-lg border border-stone-150">
              No interview process or communication channel anomalies detected.
            </p>
          ) : (
            <div className="space-y-2">
              {processFlags.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-stone-200 bg-stone-50/50 p-3 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-stone-900">{item.flag}</span>
                    <span
                      className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                        item.severity === 'critical'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-stone-600 leading-normal">{item.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Linguistic & Psychological Urgency */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-600">
            <Clock className="w-3.5 h-3.5 text-stone-500" />
            <span>Psychological Urgency & Framing</span>
          </div>

          {linguisticSignals.length === 0 ? (
            <p className="text-xs text-stone-500 italic bg-stone-50 p-3 rounded-lg border border-stone-150">
              Standard professional tone without coercive pressure or time compression.
            </p>
          ) : (
            <div className="space-y-2">
              {linguisticSignals.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-stone-200 bg-stone-50/50 p-3 text-xs space-y-1"
                >
                  <span className="font-semibold text-stone-900">{item.signal}</span>
                  <p className="text-stone-600 leading-normal">{item.detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Flagged Excerpts Viewer */}
      {highlightedExcerpts.length > 0 && (
        <div className="pt-2 border-t border-stone-100">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>High-Risk Excerpts Highlighted from Document:</span>
          </div>
          <div className="space-y-2">
            {highlightedExcerpts.map((h) => (
              <div
                key={h.id}
                className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs space-y-1"
              >
                <div className="font-mono text-[11px] text-rose-900 bg-white/70 p-1.5 rounded border border-rose-100">
                  "{h.text}"
                </div>
                <div className="text-[11px] text-rose-800 font-medium">
                  Indicator: {h.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
