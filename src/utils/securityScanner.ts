import { ScanResult, ScanRequest, ThreatLevel, PaymentDemandFlag, ProcessRedFlag, LinguisticSignal, HighlightedExcerpt } from '../types';

export function runHeuristicScan(req: ScanRequest): ScanResult {
  const text = (req.text || '').trim();
  const url = (req.url || '').trim();
  const senderEmail = (req.senderEmail || '').trim();

  const lowerText = text.toLowerCase();
  const lowerUrl = url.toLowerCase();
  const lowerEmail = senderEmail.toLowerCase();

  // Pre-split sentences once per document to avoid repeated regex allocations
  const preSplit = splitIntoSentences(text);

  // 1. Payment Demand Detection
  const paymentFlags: PaymentDemandFlag[] = [];
  let paymentScore = 0;

  if (
    hasAffirmativeDemand(text, ["cashier's check", "cashiers check", "check refund"], preSplit) ||
    (hasAffirmativeDemand(text, ['deposit', 'check'], preSplit) && hasAffirmativeDemand(text, ['vendor'], preSplit))
  ) {
    paymentScore += 35;
    paymentFlags.push({
      id: 'chk-refund',
      flag: "Advance Check & Vendor Forwarding Scam",
      category: 'CHECK_REFUND',
      riskScore: 95,
      explanation: "Classic fake check bounce scam. Banks credit checks preliminarily before clearing; once bounced (in 7-14 days), you are liable for all forwarded funds.",
      quote: extractMatchingSentence(text, ["cashier's check", "cashiers check", "deposit this check", "vendor"], preSplit)
    });
  }

  if (
    hasAffirmativeDemand(text, ['hardware vendor', 'authorized vendor', 'procure your encrypted', 'buy equipment', 'pay for equipment'], preSplit)
  ) {
    paymentScore += 25;
    paymentFlags.push({
      id: 'equip-pay',
      flag: 'Pay-for-Equipment / Third-Party Vendor Redirection',
      category: 'EQUIPMENT_PURCHASE',
      riskScore: 90,
      explanation: "Legitimate corporate employers ship corporate hardware directly via IT logistics. They never instruct new hires to purchase laptops through personal money transfers.",
      quote: extractMatchingSentence(text, ["hardware vendor", "authorized vendor", "procure", "equipment"], preSplit)
    });
  }

  if (
    hasAffirmativeDemand(text, ['wire', 'western union', 'moneygram', 'zelle', 'apple cash', 'bitcoin', 'crypto', 'usdt', 'upi', 'imps'], preSplit)
  ) {
    paymentScore += 25;
    paymentFlags.push({
      id: 'wire-crypto',
      flag: 'Irreversible / Unregulated Payment Rails (Crypto / Wire / Zelle / UPI)',
      category: 'WIRE_TRANSFER',
      riskScore: 92,
      explanation: "Demanding untraceable, non-refundable payment methods with zero fraud protection is the hallmark of financial phishing traps.",
      quote: extractMatchingSentence(text, ["zelle", "bitcoin", "western union", "wire", "usdt", "upi", "imps"], preSplit)
    });
  }

  if (
    hasAffirmativeDemand(text, ['training fee', 'certification module', 'administration fee', 'clearance fee', 'placement contract'], preSplit)
  ) {
    paymentScore += 20;
    paymentFlags.push({
      id: 'training-fee',
      flag: 'Upfront Placement / Certification Toll Fee',
      category: 'TRAINING_FEE',
      riskScore: 85,
      explanation: "Legitimate placement firms and employers cover all orientation/training costs. Requiring candidates to pay for guaranteed placement violates labor and recruitment codes.",
      quote: extractMatchingSentence(text, ["training", "certification", "clearance fee", "administrative"], preSplit)
    });
  }

  if (
    hasAffirmativeDemand(text, ['laptop security deposit', 'hardware security deposit', 'refundable security deposit', 'laptop allocation', 'laptop deposit'], preSplit) &&
    !text.toLowerCase().includes('in-person viewing')
  ) {
    paymentScore += 30;
    paymentFlags.push({
      id: 'laptop-deposit-trap',
      flag: 'Upfront Laptop / Hardware Security Deposit Trap',
      category: 'EQUIPMENT_PURCHASE',
      riskScore: 94,
      explanation: "Scammers pose as tier-1 IT firms (TCS, Infosys, Wipro, Amazon) and demand refundable 'laptop security deposits' via UPI or direct transfer. Real corporate firms provision IT equipment at zero employee cost.",
      quote: extractMatchingSentence(text, ["laptop security deposit", "security deposit", "laptop", "upi", "dispatch"])
    });
  }

  if (
    lowerText.includes('security deposit') &&
    (lowerText.includes('in-person viewing') || lowerText.includes('viewings are strictly suspended') || lowerText.includes('keys and original lease'))
  ) {
    paymentScore += 30;
    paymentFlags.push({
      id: 'rental-trap',
      flag: 'Sight-Unseen Advance Rental Deposit Trap',
      category: 'WIRE_TRANSFER',
      riskScore: 96,
      explanation: "Scammers copy real estate listings and invent excuses (abroad, missionary trip, sickness) to extort deposit wires before keys are supposedly mailed.",
      quote: extractMatchingSentence(text, ["security deposit", "viewings are strictly suspended", "keys and original lease"])
    });
  }

  // 2. Domain & Sender Audit
  let domainName: string | null = null;
  let domainRisk = 0;
  let isSuspiciousTld = false;
  let isTyposquatting = false;
  let isFreeWebmail = false;
  let riskNotes = 'No external domain or URL provided.';
  let estimatedAge = 'Unknown (No domain parsed)';

  // Parse domain from url, senderEmail, or auto-extract from text
  let effectiveUrl = url;
  let effectiveEmail = senderEmail;

  if (!effectiveUrl) {
    const extractedUrl = text.match(/https?:\/\/[^\s"'<>]+/i)?.[0];
    if (extractedUrl) {
      effectiveUrl = extractedUrl;
    }
  }

  if (!effectiveEmail) {
    const extractedEmail = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0];
    if (extractedEmail) {
      effectiveEmail = extractedEmail;
    }
  }

  if (effectiveUrl) {
    try {
      const parsed = new URL(effectiveUrl.startsWith('http') ? effectiveUrl : `https://${effectiveUrl}`);
      domainName = parsed.hostname;
    } catch {
      domainName = effectiveUrl.split('/')[0];
    }
  } else if (effectiveEmail) {
    const parts = effectiveEmail.split('@');
    if (parts.length > 1) {
      domainName = parts[1];
    }
  }

  if (domainName) {
    const suspiciousTlds = ['.top', '.xyz', '.biz', '.info', '.live', '.icu', '.site', '.click', '.tk', '.cf', '.work', '.cc', '.online'];
    isSuspiciousTld = suspiciousTlds.some((tld) => domainName!.endsWith(tld));
    isFreeWebmail = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'protonmail.com'].includes(domainName.toLowerCase());

    const brandSpoofs = ['google', 'microsoft', 'amazon', 'apple', 'stripe', 'meta', 'netflix', 'paypal', 'target', 'walmart', 'fedex', 'dhl', 'ups'];
    const hasBrand = brandSpoofs.some((b) => domainName!.includes(b));
    const isExactBrand = brandSpoofs.some((b) => domainName === `${b}.com` || domainName!.endsWith(`.${b}.com`));

    if (hasBrand && !isExactBrand) {
      isTyposquatting = true;
      domainRisk += 85;
      riskNotes = `Brand Impersonation Detected! Domain "${domainName}" mimics an enterprise company brand on an unauthorized registrar.`;
      estimatedAge = '< 15 days (High likelihood of newly registered disposable domain)';
    } else if (isSuspiciousTld) {
      domainRisk += 65;
      riskNotes = `Suspicious high-risk TLD (${domainName.substring(domainName.lastIndexOf('.'))}) commonly utilized in automated disposable phishing campaigns.`;
      estimatedAge = '< 30 days (Recent registration pattern)';
    } else if (isFreeWebmail) {
      domainRisk += 45;
      riskNotes = `Free webmail provider (${domainName}) used for recruitment or legal agreements. Legitimate corporate firms recruit from verified corporate email domains.`;
      estimatedAge = 'Established webmail provider, but inappropriate for official recruitment';
    } else {
      domainRisk += 10;
      riskNotes = `Domain appears syntactically formatted, but lacks verified cryptographic DKIM/DMARC headers.`;
      estimatedAge = 'Indeterminate without live registrar query';
    }
  }

  // 3. Process Red Flags
  const processFlags: ProcessRedFlag[] = [];
  let processRisk = 0;

  if (lowerText.includes('telegram') || lowerText.includes('whatsapp') || lowerText.includes('signal') || lowerText.includes('text questionnaire')) {
    processRisk += 30;
    processFlags.push({
      id: 'proc-chat',
      flag: 'Off-Platform Chat Interview (Telegram/WhatsApp)',
      severity: 'critical',
      detail: 'Interviews conducted exclusively via text message or Telegram with zero live video/voice rounds are a signature tactic of impersonation rings.'
    });
  }

  if (lowerText.includes('no prior experience') && (lowerText.includes('$60') || lowerText.includes('$65') || lowerText.includes('$80') || lowerText.includes('$100k') || lowerText.includes('$110k'))) {
    processRisk += 25;
    processFlags.push({
      id: 'proc-comp',
      flag: 'Unrealistic Compensation vs. Minimal Qualifications',
      severity: 'high',
      detail: 'Offering $60+/hr for entry-level data entry or admin tasks is an emotional hook designed to lower victim skepticism.'
    });
  }

  if (lowerText.includes('missionary') || lowerText.includes('unicef') || lowerText.includes('god-fearing') || lowerText.includes('blessings')) {
    processRisk += 25;
    processFlags.push({
      id: 'proc-charity',
      flag: 'Moral Authority / Religious Affinity Manipulation',
      severity: 'high',
      detail: 'Fabricating humanitarian missions or religious piety to explain why the party cannot meet in person and to solicit unearned trust.'
    });
  }

  if (lowerText.includes('concierge') && lowerText.includes('do not attempt to contact')) {
    processRisk += 20;
    processFlags.push({
      id: 'proc-isolate',
      flag: 'Victim Isolation & Channel Silencing',
      severity: 'critical',
      detail: 'Instructing candidates/renters not to communicate with building staff or corporate HR creates an echo chamber to conceal fraud.'
    });
  }

  // 4. Linguistic & Urgency Signals
  const linguisticSignals: LinguisticSignal[] = [];
  let urgencyRisk = 0;

  if (lowerText.includes('urgent') || lowerText.includes('within 24 hours') || lowerText.includes('within 12 hours') || lowerText.includes('within 6 hours') || lowerText.includes('immediate')) {
    urgencyRisk += 35;
    linguisticSignals.push({
      id: 'ling-urgency',
      signal: 'Artificial Time Compression & Threat of Forfeiture',
      detail: 'Arbitrary 6-24 hour deadlines prevent victims from doing background checks or consulting advisors.'
    });
  }

  if (lowerText.includes('dear applicant') || lowerText.includes('dear candidate') || lowerText.includes('hello,')) {
    urgencyRisk += 15;
    linguisticSignals.push({
      id: 'ling-generic',
      signal: 'Impersonal & Generic Salutation',
      detail: 'Official enterprise letters address recipients with their full legal name and specific job requisition code.'
    });
  }

  if (lowerText.includes('void your employment') || lowerText.includes('legal recovery')) {
    urgencyRisk += 20;
    linguisticSignals.push({
      id: 'ling-threat',
      signal: 'Intimidation & Coercive Legal Language',
      detail: 'Premature threats of legal action against prospective employees are designed to enforce compliance.'
    });
  }

  // Check for legitimate indicators
  const hasLegitSignals =
    lowerText.includes('401(k)') ||
    lowerText.includes('restricted stock units') ||
    lowerText.includes('rsu') ||
    lowerText.includes('checkr') ||
    lowerText.includes('workday') ||
    lowerText.includes('stripe it') ||
    lowerText.includes('greenhouse') ||
    lowerText.includes('lever.co') ||
    (lowerText.includes('zero cost to you') && lowerText.includes('never ask you to pay')) ||
    (lowerText.includes('equity') && lowerText.includes('healthcare') && lowerText.includes('zero cost'));

  if (hasLegitSignals && paymentFlags.length === 0 && processFlags.length === 0) {
    paymentScore = 0;
    domainRisk = Math.min(domainRisk, 10);
    processRisk = 0;
    urgencyRisk = 0;
    // Clear false positive linguistic signals such as generic salutations or deadlines on safe offers
    linguisticSignals.length = 0;
  }

  // Clamp category scores 0-100
  const normalizedPayment = Math.min(Math.round(paymentScore), 100);
  const normalizedDomain = Math.min(Math.round(domainRisk), 100);
  const normalizedProcess = Math.min(Math.round(processRisk), 100);
  const normalizedUrgency = Math.min(Math.round(urgencyRisk), 100);

  // Calculate composite Threat Index: weighted formula
  // If text is minimal (< 40 characters), scale domain threat directly
  let compositeThreat: number;
  if (lowerText.length < 40 && domainName) {
    compositeThreat = normalizedDomain;
  } else {
    // Payment carries 45% weight, Process 25%, Domain 20%, Urgency 10%
    compositeThreat = Math.round(
      normalizedPayment * 0.45 +
      normalizedProcess * 0.25 +
      normalizedDomain * 0.20 +
      normalizedUrgency * 0.10
    );
  }

  // Domain spoofing/typosquatting elevates baseline threat floor
  if (isTyposquatting) {
    compositeThreat = Math.max(compositeThreat, 78);
  } else if (isSuspiciousTld) {
    compositeThreat = Math.max(compositeThreat, 58);
  }

  // If critical payment scam detected, floor threat index at 92%
  if (paymentFlags.some((f) => f.category === 'CHECK_REFUND' || f.category === 'EQUIPMENT_PURCHASE')) {
    compositeThreat = Math.max(compositeThreat, 92);
  } else if (paymentFlags.length > 0) {
    compositeThreat = Math.max(compositeThreat, 80);
  }

  if (hasLegitSignals && paymentFlags.length === 0 && !isTyposquatting && !isSuspiciousTld) {
    compositeThreat = Math.min(compositeThreat, 8);
  }

  // Determine threat level
  let threatLevel: ThreatLevel = 'LOW';
  let verdictTitle = 'Minimal Suspicious Indicators Detected';

  if (compositeThreat >= 80) {
    threatLevel = 'CRITICAL';
    verdictTitle = 'Critical Scam Phishing Operation Detected';
  } else if (compositeThreat >= 60) {
    threatLevel = 'HIGH';
    verdictTitle = 'High-Risk Suspicious Communication';
  } else if (compositeThreat >= 35) {
    threatLevel = 'SUSPICIOUS';
    verdictTitle = 'Moderate Ambiguity - Verification Required';
  } else if (compositeThreat >= 15) {
    threatLevel = 'MODERATE';
    verdictTitle = 'Low-to-Moderate Anomaly Found';
  } else {
    threatLevel = 'LOW';
    verdictTitle = 'Legitimate Indicators Prevalent';
  }

  // Highlighted excerpts
  const highlightedExcerpts: HighlightedExcerpt[] = [];
  paymentFlags.forEach((p) => {
    if (p.quote) {
      highlightedExcerpts.push({
        id: `hl-${p.id}`,
        text: p.quote,
        reason: p.flag,
        severity: 'critical'
      });
    }
  });

  const actionPlan: string[] = [];
  if (compositeThreat >= 70) {
    actionPlan.push('DO NOT deposit any checks, wire money, or pay fees under any circumstances.');
    actionPlan.push('Cease all communication with the sender on Telegram/WhatsApp immediately.');
    actionPlan.push('Do not share sensitive credentials (SSN, government ID, bank routing numbers).');
    actionPlan.push('File a formal report with the FBI IC3 (ic3.gov) and FTC (reportfraud.ftc.gov).');
    actionPlan.push('If you already deposited a check, notify your bank fraud division immediately.');
  } else if (compositeThreat >= 35) {
    actionPlan.push('Cross-reference the sender email address against the official corporate careers directory.');
    actionPlan.push('Request a video interview via Microsoft Teams, Google Meet, or Zoom with corporate domain invites.');
    actionPlan.push('Never agree to purchase hardware or pay administrative fees as an employment prerequisite.');
  } else {
    actionPlan.push('Verify the offer through the company’s official applicant tracking portal (e.g. Workday, Greenhouse).');
    actionPlan.push('Ensure background check links originate from trusted third-party providers.');
  }

  const reportTemplate = {
    agency: compositeThreat >= 70 ? 'Federal Trade Commission & FBI IC3' : 'Corporate Security Incident Response',
    title: `[INCIDENT REPORT]: Fraudulent Recruitment / Phishing Solicitation (${domainName || 'Unspecified Domain'})`,
    body: `Incident Summary:
On ${new Date().toLocaleDateString()}, an unsolicited offer was received with a calculated Scam Threat Index of ${compositeThreat}%.
Indicators identified:
- Demands: ${paymentFlags.map((p) => p.flag).join('; ') || 'None'}
- Communication channels: ${processFlags.map((p) => p.flag).join('; ') || 'Standard'}
- Originating Domain: ${domainName || 'None identified'}

Requested Action: Block sender domain and add IOC signatures to enterprise email gateway.`
  };

  // Generate dynamic executive summary based on the specific vectors detected
  let executiveSummary = '';
  if (compositeThreat >= 75) {
    if (paymentFlags.length > 0 && isTyposquatting) {
      executiveSummary = `CRITICAL FRAUD ALERT: Detected active brand impersonation (${domainName}) combined with severe advance-fee or check-cashing extortion. This is a multi-stage phishing trap designed to steal personal funds.`;
    } else if (paymentFlags.length > 0) {
      executiveSummary = `CRITICAL PAYMENT EXTORTION: This document demands financial transactions (e.g. check cashing, equipment fee kickbacks, or advance deposit wire) typical of high-loss employment and rental scams.`;
    } else if (isTyposquatting) {
      executiveSummary = `CRITICAL DOMAIN IMPERSONATION: Hostname "${domainName}" mimics an established enterprise brand on an unauthorized registrar. It is virtually guaranteed to be a credential harvesting or malware staging domain.`;
    } else {
      executiveSummary = `CRITICAL SCAM THREAT: Multiple severe indicators detected, including high-risk unverified channels and coercive urgency. Do not engage with this sender.`;
    }
  } else if (compositeThreat >= 40) {
    if (isSuspiciousTld || isFreeWebmail) {
      executiveSummary = `SUSPICIOUS ROUTING: The communication originates from an unverified or disposable domain (${domainName || 'unknown'}). Official employers recruit exclusively through authenticated corporate domains.`;
    } else {
      executiveSummary = `MODERATE RISK: Communication exhibits irregular procedural anomalies or unusual urgency. Independent identity verification is strongly advised before replying.`;
    }
  } else {
    executiveSummary = `LEGITIMATE INDICATORS: This communication aligns with standard enterprise practices. No fraudulent payment demands, brand spoofing, or irregular interview channels were detected.`;
  }

  // Calculate model interpretability confidence indicator
  let confidenceLevel: 'High' | 'Medium' | 'Low' = 'Medium';
  let confidenceReason = 'Moderate document context provided.';

  const signalCount = paymentFlags.length + processFlags.length + linguisticSignals.length;
  const hasStrongOriginSignal = isTyposquatting || isSuspiciousTld || (domainName !== null && isFreeWebmail);

  if (
    (paymentFlags.length > 0 && (domainName !== null || processFlags.length > 0)) ||
    (signalCount >= 3) ||
    (hasLegitSignals && text.length > 250) ||
    (isTyposquatting && paymentFlags.length > 0) ||
    (text.length > 400 && signalCount >= 2)
  ) {
    confidenceLevel = 'High';
    confidenceReason = 'High confidence: Strong multi-vector correlation across financial demands, origin indicators, and linguistic markers.';
  } else if (text.length < 80 && !hasStrongOriginSignal && paymentFlags.length === 0) {
    confidenceLevel = 'Low';
    confidenceReason = 'Low confidence: Limited input text provided. Assessment is based on preliminary heuristic patterns.';
  } else {
    confidenceLevel = 'Medium';
    confidenceReason = 'Medium confidence: Clear individual indicators found, but with limited cross-channel corroboration.';
  }

  return {
    threatIndex: compositeThreat,
    threatLevel,
    confidenceLevel,
    confidenceReason,
    verdictTitle,
    executiveSummary,
    domainAudit: {
      domainName,
      estimatedAge,
      isSuspiciousTld,
      isTyposquatting,
      isFreeWebmail,
      riskNotes
    },
    paymentDemandFlags: paymentFlags,
    processRedFlags: processFlags,
    linguisticSignals,
    breakdownScores: {
      paymentRisk: normalizedPayment,
      domainRisk: normalizedDomain,
      processRisk: normalizedProcess,
      urgencyRisk: normalizedUrgency
    },
    highlightedExcerpts,
    actionPlan,
    reportTemplate,
    analyzedAt: new Date().toISOString(),
    scanEngine: 'heuristic-defense-engine'
  };
}

const SENTENCE_SPLIT_REGEX = /[.?!]\s+/;

function splitIntoSentences(text: string): string[] {
  if (!text) return [];
  return text.split(SENTENCE_SPLIT_REGEX);
}

const DEFAULT_NEGATION_TERMS = [
  'never ask',
  'never require',
  'will not ask',
  'do not pay',
  'no cost',
  'zero cost',
  'free of charge',
  'at our expense',
  'company provides'
];

export function hasAffirmativeDemand(text: string, keywords: string[], preSplitSentences?: string[]): boolean {
  const sentences = preSplitSentences || splitIntoSentences(text);

  for (let i = 0; i < sentences.length; i++) {
    const sLower = sentences[i].toLowerCase();
    const hasKeyword = keywords.some((k) => sLower.includes(k));
    if (hasKeyword) {
      const isNegated = DEFAULT_NEGATION_TERMS.some((neg) => sLower.includes(neg));
      if (!isNegated) {
        return true;
      }
    }
  }
  return false;
}

export function extractMatchingSentence(text: string, keywords: string[], preSplitSentences?: string[]): string {
  const sentences = preSplitSentences || splitIntoSentences(text);

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sLower = sentence.toLowerCase();
    if (keywords.some((k) => sLower.includes(k))) {
      if (!DEFAULT_NEGATION_TERMS.some((neg) => sLower.includes(neg))) {
        return sentence.trim();
      }
    }
  }
  return '';
}
