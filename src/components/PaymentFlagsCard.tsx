import React from 'react';
import { PaymentDemandFlag } from '../types';
import { DollarSign, AlertTriangle, ShieldCheck, Quote } from 'lucide-react';

interface PaymentFlagsCardProps {
  flags: PaymentDemandFlag[];
}

export const PaymentFlagsCard: React.FC<PaymentFlagsCardProps> = ({ flags }) => {
  return (
    <div id="payment-demand-card" className="bg-white/95 rounded-2xl border border-stone-200/90 p-5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-stone-700" />
          <h3 className="text-sm font-bold text-stone-900 font-display">
            Payment Demand & Deposit Red Flags
          </h3>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
            flags.length > 0
              ? 'bg-[#fce8e6] text-[#c5221f] border-[#fad2cf]'
              : 'bg-[#e6f4ea] text-[#137333] border-[#ceead6]'
          }`}
        >
          {flags.length > 0 ? `${flags.length} Demand(s) Detected` : 'Zero Extortion Demands'}
        </span>
      </div>

      {flags.length === 0 ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#e6f4ea]/60 border border-[#ceead6] text-xs text-[#137333]">
          <ShieldCheck className="w-5 h-5 text-[#1e8e3e] shrink-0" />
          <p>
            No advance check-cashing requests, equipment procurement fees, or wire transfer demands
            found in this document.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((item) => (
            <div
              key={item.id}
              id={`payment-flag-${item.id}`}
              className="rounded-xl border border-[#fad2cf] bg-[#fce8e6]/30 p-3.5 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-[#c5221f]">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#d93025] shrink-0" />
                  <span>{item.flag}</span>
                </div>
                <span className="shrink-0 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fad2cf]/70 text-[#c5221f] border border-[#fad2cf]">
                  RISK: {item.riskScore}%
                </span>
              </div>

              <p className="text-xs text-stone-700 leading-relaxed">{item.explanation}</p>

              {item.quote && (
                <div className="flex items-start gap-1.5 mt-2 rounded-lg bg-white p-2.5 text-[11px] text-stone-600 border border-[#fad2cf]/60 italic">
                  <Quote className="w-3 h-3 text-[#d93025]/60 shrink-0 mt-0.5" />
                  <span>"{item.quote}"</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
