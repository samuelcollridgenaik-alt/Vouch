import React from 'react';
import {
  X,
  ShieldCheck,
  PhoneCall,
  AlertTriangle,
  Globe,
  ExternalLink,
  Lock,
  Building2,
  FileCheck2,
  Video
} from 'lucide-react';

interface SafetyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyGuideModal: React.FC<SafetyGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      id="safety-guide-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-stone-200 my-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                Corporate & Candidate Safety Handbook
              </h2>
              <p className="text-xs text-stone-500">
                Verified Indian & International anti-fraud standards for job offers and contracts
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

        {/* Golden Rules Grid */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500">
            The 4 Golden Rules: Spot Fake Offers in 10 Seconds
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-xs text-stone-900">
                <Building2 className="w-4 h-4 text-rose-600 shrink-0" />
                <span>1. Zero Hardware Fees</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Legitimate employers provision laptops directly through verified corporate IT logistics. They <strong>never</strong> ask candidates to wire money, pay "laptop security deposits", or purchase equipment from third-party vendors.
              </p>
            </div>

            <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-xs text-stone-900">
                <Globe className="w-4 h-4 text-amber-600 shrink-0" />
                <span>2. Authenticated Domain</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Legitimate recruiters communicate exclusively from corporate email domains (e.g. <code>@company.com</code>). Beware of <code>@gmail.com</code>, <code>@yahoo.com</code>, or fake typosquatted lookalikes.
              </p>
            </div>

            <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-xs text-stone-900">
                <Video className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>3. Live Video Interviews</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                No enterprise company extends offers based on a 10-minute text questionnaire on <strong>Telegram, WhatsApp, or Signal</strong>. Always require a face-to-face video conference via an official video platform.
              </p>
            </div>

            <div className="rounded-xl border border-stone-200/80 bg-stone-50/70 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-xs text-stone-900">
                <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>4. Verify Job Requisition</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Always open a separate browser tab, navigate directly to the official employer's website, and search the Job Requisition ID. If it does not appear on their career portal, the offer is fabricated.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Helplines & Authorities */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
            <PhoneCall className="w-4 h-4 text-amber-600" />
            <span>Official Cyber Crime Helplines (Immediate Filing)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-amber-900">
            <div className="bg-white/80 rounded-lg p-2.5 border border-amber-200/70 space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span>🇮🇳 India Cyber Helpline</span>
                <span className="font-mono text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded text-[10px]">
                  Call 1930
                </span>
              </div>
              <p className="text-[11px] text-stone-600">
                Ministry of Home Affairs <strong>National Cyber Crime Portal</strong>. Call 1930 immediately within the golden hour to freeze fraudulent bank transfers.
              </p>
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noreferrer noopener"
                className="text-[11px] text-stone-900 font-semibold inline-flex items-center gap-1 hover:underline"
              >
                cybercrime.gov.in <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="bg-white/80 rounded-lg p-2.5 border border-amber-200/70 space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span>🌐 USA & Global Reporting</span>
                <span className="font-mono text-indigo-700 bg-indigo-100/70 px-1.5 py-0.2 rounded text-[10px]">
                  IC3 / FTC
                </span>
              </div>
              <p className="text-[11px] text-stone-600">
                FBI Internet Crime Complaint Center (IC3) and Federal Trade Commission. Used globally for wire fraud & counterfeit check tracking.
              </p>
              <div className="flex items-center gap-2 text-[11px]">
                <a
                  href="https://www.ic3.gov"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-stone-900 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  ic3.gov <ExternalLink className="w-3 h-3" />
                </a>
                <span>•</span>
                <a
                  href="https://reportfraud.ftc.gov"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-stone-900 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  reportfraud.ftc.gov <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Understood, Return to Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
