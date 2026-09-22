import React, { useState } from 'react';
import { ThreatLevel, BreakdownScores } from '../types';
import { ShieldAlert, ShieldCheck, AlertTriangle, HelpCircle, CheckCircle2 } from 'lucide-react';

interface ThreatGaugeProps {
  score: number;
  level: ThreatLevel;
  confidenceLevel?: 'High' | 'Medium' | 'Low';
  confidenceReason?: string;
  verdictTitle: string;
  breakdown: BreakdownScores;
}

export const ThreatGauge: React.FC<ThreatGaugeProps> = ({
  score,
  level,
  confidenceLevel = 'High',
  confidenceReason,
  verdictTitle,
  breakdown,
}) => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  // Default explanation if none provided by scanner/model
  const defaultExplanation =
    confidenceLevel === 'High'
      ? 'High Confidence: Multiple independent indicators (financial demands, domain origin, and structural markers) strongly corroborate this evaluation.'
      : confidenceLevel === 'Medium'
      ? 'Medium Confidence: Specific risk indicators were identified, but cross-channel corroboration or document depth is moderately bounded.'
      : 'Low Confidence: Limited input context or minimal structural signals. Results reflect preliminary baseline heuristics.';

  const explanation = confidenceReason || defaultExplanation;

  // Gauge color mappings
  let strokeColor = '#1e8e3e'; // Green
  let bgBadge = 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]';
  let gaugeIcon = <ShieldCheck className="w-5 h-5 text-[#1e8e3e]" />;

  if (score >= 75) {
    strokeColor = '#d93025'; // Red
    bgBadge = 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]';
    gaugeIcon = <ShieldAlert className="w-5 h-5 text-[#d93025]" />;
  } else if (score >= 50) {
    strokeColor = '#e37400'; // Amber
    bgBadge = 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]';
    gaugeIcon = <AlertTriangle className="w-5 h-5 text-[#e37400]" />;
  } else if (score >= 25) {
    strokeColor = '#f9ab00'; // Yellow
    bgBadge = 'bg-[#fef7e0] text-[#9b6300] border-[#feefc3]';
    gaugeIcon = <AlertTriangle className="w-5 h-5 text-[#f9ab00]" />;
  }

  // Visual Confidence Indicator Styling & Signal Bars
  let confBars = 3;
  let confBadgeStyle = 'bg-[#e8f0fe] text-[#1967d2] border-[#d2e3fc]';
  let confDotColor = 'bg-[#1967d2]';
  if (confidenceLevel === 'Medium') {
    confBars = 2;
    confBadgeStyle = 'bg-[#fef7e0] text-[#b06000] border-[#feefc3]';
    confDotColor = 'bg-[#b06000]';
  } else if (confidenceLevel === 'Low') {
    confBars = 1;
    confBadgeStyle = 'bg-[#f1f3f4] text-[#5f6368] border-[#dadce0]';
    confDotColor = 'bg-[#5f6368]';
  }

  // Semi-circle SVG calculation
  const radius = 70;
  const circumference = Math.PI * radius; // half circle length
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      id="threat-gauge-panel"
      className={`rounded-2xl border p-6 transition-all shadow-xs relative ${
        score >= 75
          ? 'bg-linear-to-b from-rose-50/70 via-white to-white border-rose-200/90'
          : score >= 50
          ? 'bg-linear-to-b from-amber-50/70 via-white to-white border-amber-200/90'
          : score >= 25
          ? 'bg-linear-to-b from-yellow-50/70 via-white to-white border-yellow-200/90'
          : 'bg-linear-to-b from-emerald-50/70 via-white to-white border-emerald-200/90'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-100 pb-4 mb-5 gap-3">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-stone-600 font-semibold">
            Real-Time Forensic Evaluation
          </span>
          <h3 className="text-lg font-bold text-stone-900 font-display">Scam Threat Index</h3>
        </div>

        {/* Status badges container */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Visual Confidence Level Indicator with Interactive Help Icon & Tooltip */}
          <div className="relative inline-flex items-center">
            <div
              id="confidence-indicator-badge"
              className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 shadow-2xs select-none ${confBadgeStyle}`}
            >
              {/* Signal strength bars */}
              <span className="flex items-end gap-0.5 h-3">
                <span className={`w-1 rounded-xs transition-all ${confBars >= 1 ? 'bg-current h-1.5' : 'bg-stone-300 h-1.5'}`} />
                <span className={`w-1 rounded-xs transition-all ${confBars >= 2 ? 'bg-current h-2.5' : 'bg-stone-300 h-2.5'}`} />
                <span className={`w-1 rounded-xs transition-all ${confBars >= 3 ? 'bg-current h-3.5' : 'bg-stone-300 h-3.5'}`} />
              </span>
              <span>{confidenceLevel} Confidence</span>

              {/* Help button triggering the tooltip */}
              <button
                type="button"
                id="confidence-help-btn"
                aria-label={`Why is confidence ${confidenceLevel}?`}
                onClick={() => setShowTooltip((prev) => !prev)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-black/5 text-current/80 hover:text-current transition-colors focus:outline-hidden cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Explanatory Tooltip Popover */}
            {showTooltip && (
              <div
                id="confidence-tooltip"
                role="tooltip"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 w-72 sm:w-80 p-3.5 rounded-xl bg-stone-900 text-white text-xs shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 border border-stone-700/80"
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${confDotColor} mt-1.5 shrink-0`} />
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-100 text-[11px] tracking-wide uppercase font-mono">
                        {confidenceLevel} Confidence Rating
                      </span>
                      <span className="text-[10px] text-stone-400">Model Interpretability</span>
                    </div>
                    <p className="text-[11px] text-stone-300 leading-relaxed font-sans">
                      {explanation}
                    </p>
                  </div>
                </div>
                {/* Arrow */}
                <div className="absolute -top-1.5 right-6 sm:right-auto sm:left-6 w-3 h-3 bg-stone-900 border-t border-l border-stone-700/80 transform rotate-45" />
              </div>
            )}
          </div>

          {/* Threat Level Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${bgBadge}`}>
            {gaugeIcon}
            <span>{level} THREAT</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-2">
        {/* Semi-circle Speedometer SVG & Confidence Details */}
        <div className="relative flex flex-col items-center">
          <svg width="190" height="115" viewBox="0 0 180 110" className="overflow-visible">
            {/* Background Track */}
            <path
              d="M 20 95 A 70 70 0 0 1 160 95"
              fill="none"
              stroke="#f5f5f4"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* Value Arc */}
            <path
              d="M 20 95 A 70 70 0 0 1 160 95"
              fill="none"
              stroke={strokeColor}
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          <div className="absolute top-10 flex flex-col items-center">
            <span className="text-4xl font-extrabold tracking-tight text-stone-900 font-mono">
              {score}%
            </span>
            <span className="text-[11px] font-semibold text-stone-600 uppercase tracking-wider">
              Scam Risk
            </span>
          </div>

          <div className="text-center mt-1">
            <p className="text-xs font-bold text-stone-900">{verdictTitle}</p>
          </div>

          {/* Interpretability Callout: Confidence Reason */}
          <div
            id="confidence-reason-callout"
            className="mt-3 flex items-start gap-1.5 rounded-xl bg-white/90 p-2.5 border border-stone-200 text-[11px] text-stone-600 max-w-xs text-left shadow-2xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <span className="font-semibold text-stone-900">{confidenceLevel} Certainty: </span>
              <span>{explanation}</span>
            </div>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="w-full sm:w-64 space-y-3 bg-white/70 p-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <h4 className="text-[11px] font-bold text-stone-600 uppercase tracking-wider">
            Risk Vectors
          </h4>

          {/* Payment demands (Google Red Matte) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-stone-700 font-medium">Payment Demands</span>
              <span className="font-mono text-stone-900 font-semibold">{breakdown.paymentRisk}%</span>
            </div>
            <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#d93025] rounded-full transition-all duration-500"
                style={{ width: `${breakdown.paymentRisk}%` }}
              />
            </div>
          </div>

          {/* Process anomalies (Google Yellow Matte) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-stone-700 font-medium">Process Anomalies</span>
              <span className="font-mono text-stone-900 font-semibold">{breakdown.processRisk}%</span>
            </div>
            <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#f9ab00] rounded-full transition-all duration-500"
                style={{ width: `${breakdown.processRisk}%` }}
              />
            </div>
          </div>

          {/* Domain origin (Google Blue Matte) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-stone-700 font-medium">Domain & Origin</span>
              <span className="font-mono text-stone-900 font-semibold">{breakdown.domainRisk}%</span>
            </div>
            <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#1a73e8] rounded-full transition-all duration-500"
                style={{ width: `${breakdown.domainRisk}%` }}
              />
            </div>
          </div>

          {/* Psychological urgency (Google Muted Grey Matte) */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-stone-700 font-medium">Urgency Pressure</span>
              <span className="font-mono text-stone-900 font-semibold">{breakdown.urgencyRisk}%</span>
            </div>
            <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5f6368] rounded-full transition-all duration-500"
                style={{ width: `${breakdown.urgencyRisk}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
