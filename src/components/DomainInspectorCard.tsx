import React from 'react';
import { DomainAudit } from '../types';
import { Globe, AlertOctagon, CheckCircle, Calendar, ShieldCheck, Mail } from 'lucide-react';

interface DomainInspectorCardProps {
  audit: DomainAudit;
}

export const DomainInspectorCard: React.FC<DomainInspectorCardProps> = ({ audit }) => {
  return (
    <div id="domain-inspector-card" className="bg-white/95 rounded-2xl border border-stone-200/90 p-5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-stone-700" />
          <h3 className="text-sm font-bold text-stone-900 font-display">
            Domain & Origin Integrity Audit
          </h3>
        </div>
        {audit.isTyposquatting || audit.isSuspiciousTld ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fce8e6] px-2.5 py-0.5 text-[11px] font-semibold text-[#c5221f] border border-[#fad2cf]">
            <AlertOctagon className="w-3 h-3 text-[#d93025]" /> Spoof / High Risk
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#e6f4ea] px-2.5 py-0.5 text-[11px] font-semibold text-[#137333] border border-[#ceead6]">
            <ShieldCheck className="w-3 h-3 text-[#1e8e3e]" /> Syntax Verified
          </span>
        )}
      </div>

      <div className="space-y-3.5 text-xs">
        {/* Domain name display */}
        <div className="flex items-center justify-between bg-stone-50/80 rounded-xl p-3 border border-stone-200">
          <span className="text-stone-500 font-medium">Scanned Hostname:</span>
          <span className="font-mono font-semibold text-stone-900">
            {audit.domainName || 'None identified'}
          </span>
        </div>

        {/* Estimated Domain Age */}
        <div className="flex items-start gap-2.5">
          <Calendar className="w-4 h-4 text-[#1a73e8] mt-0.5 shrink-0" />
          <div>
            <div className="font-medium text-stone-900">Estimated Domain Age:</div>
            <div className="text-stone-600 font-mono text-[11px]">{audit.estimatedAge}</div>
          </div>
        </div>

        {/* Typosquatting / Impersonation */}
        <div className="flex items-start gap-2.5">
          {audit.isTyposquatting ? (
            <AlertOctagon className="w-4 h-4 text-[#d93025] mt-0.5 shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-[#1e8e3e] mt-0.5 shrink-0" />
          )}
          <div>
            <div className="font-medium text-stone-900">Brand Impersonation Check:</div>
            <div className="text-stone-600">
              {audit.isTyposquatting
                ? 'CRITICAL: Hostname contains unauthorized trademark keywords with modified TLD or deceptive hyphenation.'
                : 'No obvious corporate brand lookalike strings detected.'}
            </div>
          </div>
        </div>

        {/* TLD & Webmail Checks */}
        <div className="flex items-start gap-2.5">
          <Mail className="w-4 h-4 text-[#1a73e8] mt-0.5 shrink-0" />
          <div>
            <div className="font-medium text-stone-900">Sender Routing Analysis:</div>
            <p className="text-stone-600 leading-relaxed mt-0.5">{audit.riskNotes}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
