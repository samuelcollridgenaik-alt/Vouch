import React, { useState } from 'react';
import { Send, Copy, Check, ShieldCheck, HelpCircle } from 'lucide-react';

interface RecruiterChallengeScriptProps {
  claimedCompany?: string;
  senderEmail?: string;
}

export const RecruiterChallengeScript: React.FC<RecruiterChallengeScriptProps> = ({
  claimedCompany,
  senderEmail,
}) => {
  const [copied, setCopied] = useState(false);
  const company = claimedCompany || 'your organization';

  const scriptText = `Dear Hiring Team,

Thank you for sending the offer documentation regarding the opportunity at ${company}.

Before proceeding with signing or onboarding preparations, our campus career advisory policy requires that I verify employment opportunities via official corporate protocols:

1. Official Corporate Email Confirmation:
Could you please re-send this confirmation directly from an authenticated corporate email domain (@${claimedCompany ? claimedCompany.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com' : 'company.com'}) rather than public or third-party webmail?

2. Job Requisition Reference:
Please provide the direct Job Requisition ID and its public listing link on your official corporate careers portal (${claimedCompany ? 'careers.' + claimedCompany.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com' : 'careers.company.com'}).

3. Face-to-Face Video Verification:
I request a brief 10-minute video conference via an official enterprise video meeting with our designated hiring manager or HR business partner.

4. IT Procurement Protocol:
Per standard corporate guidelines, please confirm whether enterprise hardware (laptop, security peripherals) will be provisioned and shipped directly by your IT department, as my policy strictly prohibits processing personal check reimbursements or third-party equipment wires.

Thank you for your understanding, and I look forward to your verification response.

Sincerely,
[Candidate Name]`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div
      id="recruiter-challenge-panel"
      className="rounded-2xl border border-stone-200/90 bg-white/95 p-5 space-y-3 shadow-2xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-stone-700" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 font-display">
            Candidate Counter-Challenge Script
          </h4>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-800 transition-colors shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700">Script Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-stone-600" />
              <span>Copy Verification Script</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-stone-600 leading-relaxed">
        Send this professional verification message to the recruiter. Real employers will gladly provide corporate
        links and video calls. <strong>Impostors will immediately ghost, panic, or pressure you to bypass these questions.</strong>
      </p>

      <div className="relative rounded-lg border border-stone-200 bg-stone-50/70 p-3.5 text-[11px] font-mono text-stone-800 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
        {scriptText}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>Designed to expose Telegram impostors, free-domain spoofers, and advance-check syndicates.</span>
      </div>
    </div>
  );
};
