import React, { useState } from 'react';
import { ReportTemplate } from '../types';
import { ShieldCheck, Copy, Check, FileWarning, ExternalLink } from 'lucide-react';

interface IncidentResponseCardProps {
  actionPlan: string[];
  reportTemplate: ReportTemplate;
  threatIndex: number;
}

export const IncidentResponseCard: React.FC<IncidentResponseCardProps> = ({
  actionPlan,
  reportTemplate,
  threatIndex,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullText = `${reportTemplate.title}\n\nTarget Entity: ${reportTemplate.agency}\n\n${reportTemplate.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="incident-response-panel" className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#1e8e3e]" />
          <h3 className="text-sm font-semibold text-stone-900">
            Recommended Action Plan & Incident Reporting
          </h3>
        </div>
        <span className="text-xs font-mono text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded-full border border-[#d2e3fc]">
          Defense Directive
        </span>
      </div>

      {/* Immediate Triage Checklist */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Immediate Steps for Target Recipient:
        </h4>
        <ul className="space-y-2 text-xs">
          {actionPlan.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-stone-700">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e8f0fe] font-mono text-[10px] font-bold text-[#1967d2] border border-[#d2e3fc]">
                {idx + 1}
              </span>
              <span className="mt-0.5 leading-relaxed">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Official Complaint Report Generator */}
      {threatIndex >= 40 && (
        <div className="mt-4 pt-4 border-t border-stone-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
              <FileWarning className="w-4 h-4 text-[#f9ab00]" />
              <span>Generated Incident Report for Authorities (FTC / IC3 / Employer)</span>
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1967d2] bg-[#e8f0fe] hover:bg-[#d2e3fc] border border-[#d2e3fc] px-2.5 py-1 rounded-full transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-[#1e8e3e]" /> : <Copy className="w-3 h-3 text-[#1a73e8]" />}
              {copied ? 'Copied' : 'Copy Report'}
            </button>
          </div>

          <pre className="p-3 bg-stone-900 text-stone-200 rounded-xl text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
            {reportTemplate.title}
            {'\n\n'}
            {reportTemplate.body}
          </pre>

          <div className="flex items-center gap-3 pt-1 text-[11px]">
            <a
              href="https://www.ic3.gov"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#1a73e8] hover:underline font-medium"
            >
              FBI Internet Crime Complaint Center (IC3)
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-stone-300">•</span>
            <a
              href="https://reportfraud.ftc.gov"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#1a73e8] hover:underline font-medium"
            >
              FTC Fraud Report
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
