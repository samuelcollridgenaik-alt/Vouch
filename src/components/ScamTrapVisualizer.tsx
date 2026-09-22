import React, { useState } from 'react';
import { AlertCircle, HelpCircle, ArrowRight, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';

interface ScamTrapVisualizerProps {
  hasPaymentFlag: boolean;
}

export const ScamTrapVisualizer: React.FC<ScamTrapVisualizerProps> = ({ hasPaymentFlag }) => {
  const [showExplanation, setShowExplanation] = useState(false);

  if (!hasPaymentFlag) return null;

  const steps = [
    {
      step: '01',
      title: 'Counterfeit Check Delivery',
      desc: 'Scammer issues a physical or digital check ($3,000–$5,500) for "equipment setup" or "sign-on advance".',
      badge: 'Bait',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      step: '02',
      title: 'Provisional Credit Illusion',
      desc: 'Bank regulations mandate funds appear in your account within 24h. The check has NOT actually cleared yet.',
      badge: 'The Deception',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      step: '03',
      title: 'Urgent Wire to "Vendor"',
      desc: 'You are coerced to forward $3,000+ via Zelle, Wire, or Crypto to a "certified hardware supplier" (the scammer).',
      badge: 'The Drain',
      badgeColor: 'bg-rose-200 text-rose-900 border-rose-300 font-bold',
    },
    {
      step: '04',
      title: 'Check Bounces & Total Loss',
      desc: '5–10 days later, the bogus check returns fraudulent. Your bank pulls back the full amount; you owe the bank.',
      badge: 'Victim Liability',
      badgeColor: 'bg-stone-200 text-stone-800 border-stone-300',
    },
  ];

  return (
    <div
      id="scam-trap-visualizer"
      className="rounded-2xl border border-rose-200/90 bg-linear-to-b from-rose-50/80 via-white to-white p-5 space-y-4 shadow-2xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-950 font-display">
            Scam Anatomy: The Fake Check & Wire Trap
          </h4>
        </div>
        <span className="text-[11px] font-mono font-semibold text-rose-800 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200 self-start sm:self-auto">
          High-Risk Extraction Mechanism
        </span>
      </div>

      <p className="text-xs text-stone-700 leading-relaxed">
        This offer matches the classic <strong>advance-fee financial trap</strong>. Understanding the 4-phase
        timeline below protects candidates from severe personal debt and banking liability:
      </p>

      {/* 4-Step Diagram */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((s, idx) => (
          <div
            key={s.step}
            className="rounded-xl border border-rose-100 bg-white/95 p-3.5 shadow-2xs flex flex-col justify-between space-y-2 relative"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-stone-400">Phase {s.step}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${s.badgeColor}`}>
                {s.badge}
              </span>
            </div>
            <div>
              <h5 className="text-xs font-bold text-stone-900 leading-snug">{s.title}</h5>
              <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">{s.desc}</p>
            </div>
            {idx < steps.length - 1 && (
              <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-rose-300">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dropdown: Why does the bank show money available? */}
      <div className="rounded-xl border border-rose-200/80 bg-rose-50/60 p-3 text-xs">
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center justify-between w-full text-left font-semibold text-rose-950 hover:text-rose-800 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
            Why does my bank account show "Available Funds" if the check is counterfeit?
          </span>
          {showExplanation ? <ChevronUp className="w-4 h-4 text-rose-600" /> : <ChevronDown className="w-4 h-4 text-rose-600" />}
        </button>

        {showExplanation && (
          <div className="mt-2.5 pt-2.5 border-t border-rose-200/60 text-stone-700 space-y-2 text-[11px] leading-relaxed">
            <p>
              Under federal banking statutes (such as the U.S. Expedited Funds Availability Act / Regulation CC and equivalent international clearing rules), banks
              are legally required to make deposited funds accessible within 1 to 2 business days.
            </p>
            <p>
              <strong>However, "available" does NOT mean "cleared".</strong> It often takes 5 to 10 business days for the
              originating bank to discover that the routing account is stolen or forged. When the
              check ultimately bounces, your bank will reverse the provisional credit and legally debit your account for
              the full amount, leaving you responsible for any money already transferred.
            </p>
            <div className="p-2.5 bg-white rounded-lg border border-rose-200 font-semibold text-rose-950 flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Universal Standard: Real employers ship laptops directly via IT courier. They NEVER instruct new hires to purchase gear via wire transfer, UPI, or personal checks.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
