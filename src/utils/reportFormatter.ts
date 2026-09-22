import { ScanResult } from '../types';

/**
 * Formats a clean, professional, shareable plain-text forensic security audit report
 * suitable for clipboard copying, logging, or reporting to HR / IT / Law Enforcement.
 */
export function formatSecurityReport(result: ScanResult): string {
  const divider = '======================================================================';
  const subDivider = '----------------------------------------------------------------------';

  const dateStr = result.analyzedAt ? new Date(result.analyzedAt).toLocaleString() : new Date().toLocaleString();

  const paymentFlagsSummary =
    result.paymentDemandFlags && result.paymentDemandFlags.length > 0
      ? result.paymentDemandFlags
          .map((f, i) => {
            let item = `  ${i + 1}. [${f.category}] ${f.flag} (Risk: ${f.riskScore}%)\n     Explanation: ${f.explanation}`;
            if (f.quote) {
              item += `\n     Detected Quote: "${f.quote}"`;
            }
            return item;
          })
          .join('\n\n')
      : '  None detected. No fraudulent payment demands found.';

  const processFlagsSummary =
    result.processRedFlags && result.processRedFlags.length > 0
      ? result.processRedFlags
          .map((f, i) => `  ${i + 1}. [${f.severity.toUpperCase()}] ${f.flag}: ${f.detail}`)
          .join('\n')
      : '  No atypical hiring or communication anomalies flagged.';

  const linguisticSignalsSummary =
    result.linguisticSignals && result.linguisticSignals.length > 0
      ? result.linguisticSignals
          .map((s, i) => `  ${i + 1}. ${s.signal}: ${s.detail}`)
          .join('\n')
      : '  Standard professional phrasing observed.';

  const actionPlanSummary =
    result.actionPlan && result.actionPlan.length > 0
      ? result.actionPlan.map((step, i) => `  Step ${i + 1}: ${step}`).join('\n')
      : '  Standard verification advised.';

  return `${divider}
🛡️ VOUCH CYBERSECURITY AUDIT REPORT
Document & Offer Security Scanner
${divider}
Generated: ${dateStr}
Analysis Engine: ${result.scanEngine}
Audit Verdict: ${result.verdictTitle}

OVERALL THREAT ASSESSMENT:
* Scam Threat Index: ${result.threatIndex}% [${result.threatLevel} RISK]
* Confidence Rating: ${result.confidenceLevel || 'High'} Confidence
${result.confidenceReason ? `* Confidence Reason: ${result.confidenceReason}\n` : ''}
EXECUTIVE SECURITY ASSESSMENT:
${result.executiveSummary}

${subDivider}
RISK VECTOR BREAKDOWN:
- Payment Demands Risk: ${result.breakdownScores?.paymentRisk ?? 'N/A'}%
- Process Anomalies Risk: ${result.breakdownScores?.processRisk ?? 'N/A'}%
- Domain & Origin Risk: ${result.breakdownScores?.domainRisk ?? 'N/A'}%
- Psychological Urgency: ${result.breakdownScores?.urgencyRisk ?? 'N/A'}%

${subDivider}
DOMAIN & SENDER ORIGIN AUDIT:
- Target Domain: ${result.domainAudit.domainName || 'None provided'}
- Estimated Domain Age: ${result.domainAudit.estimatedAge}
- Typosquatting / Lookalike: ${result.domainAudit.isTyposquatting ? 'YES (FLAGGED)' : 'No'}
- Suspicious TLD: ${result.domainAudit.isSuspiciousTld ? 'YES (FLAGGED)' : 'No'}
- Free Webmail Used for Corporate Hiring: ${result.domainAudit.isFreeWebmail ? 'YES (FLAGGED)' : 'No'}
- Audit Notes: ${result.domainAudit.riskNotes}

${subDivider}
PAYMENT DEMAND RED FLAGS:
${paymentFlagsSummary}

${subDivider}
PROCESS & LINGUISTIC FINDINGS:
Process Anomalies:
${processFlagsSummary}

Linguistic Signals:
${linguisticSignalsSummary}

${subDivider}
RECOMMENDED INCIDENT ACTION PLAN:
${actionPlanSummary}

${divider}
CONFIDENTIAL & PRIVILEGED CYBERSECURITY ASSESSMENT
For logging, security escalation, and incident reporting.
${divider}
`;
}
