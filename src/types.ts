export type ThreatLevel = 'CRITICAL' | 'HIGH' | 'SUSPICIOUS' | 'MODERATE' | 'LOW';

export interface DomainAudit {
  domainName: string | null;
  estimatedAge: string;
  isSuspiciousTld: boolean;
  isTyposquatting: boolean;
  isFreeWebmail: boolean;
  riskNotes: string;
}

export interface PaymentDemandFlag {
  id: string;
  flag: string;
  category: 'CHECK_REFUND' | 'EQUIPMENT_PURCHASE' | 'WIRE_TRANSFER' | 'CRYPTO_DEPOSIT' | 'TRAINING_FEE' | 'BACKGROUND_CHECK_FEE';
  riskScore: number; // 0-100
  explanation: string;
  quote?: string;
}

export interface ProcessRedFlag {
  id: string;
  flag: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detail: string;
}

export interface LinguisticSignal {
  id: string;
  signal: string;
  detail: string;
}

export interface BreakdownScores {
  paymentRisk: number; // 0 - 100
  domainRisk: number; // 0 - 100
  processRisk: number; // 0 - 100
  urgencyRisk: number; // 0 - 100
}

export interface HighlightedExcerpt {
  id: string;
  text: string;
  reason: string;
  severity: 'critical' | 'warning';
}

export interface ReportTemplate {
  agency: string;
  title: string;
  body: string;
}

export interface ScanResult {
  threatIndex: number; // 0-100
  threatLevel: ThreatLevel;
  confidenceLevel: 'High' | 'Medium' | 'Low';
  confidenceReason?: string;
  verdictTitle: string;
  executiveSummary: string;
  domainAudit: DomainAudit;
  paymentDemandFlags: PaymentDemandFlag[];
  processRedFlags: ProcessRedFlag[];
  linguisticSignals: LinguisticSignal[];
  breakdownScores: BreakdownScores;
  highlightedExcerpts: HighlightedExcerpt[];
  actionPlan: string[];
  reportTemplate: ReportTemplate;
  analyzedAt: string;
  scanEngine: 'gemini-3.8-flash' | 'heuristic-defense-engine';
}

export interface ScanRequest {
  text: string;
  url?: string;
  senderEmail?: string;
  documentType?: 'JOB_OFFER' | 'RENTAL_AGREEMENT' | 'INTERVIEW_INVITE' | 'GENERAL';
}
