import { http, HttpResponse, delay } from 'msw';
import { ScanResult, ScanRequest } from '../types';
import { runHeuristicScan } from '../utils/securityScanner';

export const mockSuccessScanResult: ScanResult = {
  threatIndex: 94,
  threatLevel: 'CRITICAL',
  confidenceLevel: 'High',
  confidenceReason: 'High confidence: Mocked multi-vector verification.',
  verdictTitle: 'Simulated Advance-Fee Phishing Syndicate',
  executiveSummary: 'CRITICAL FRAUD ALERT (MSW MOCK): Detected simulated fraudulent recruitment check forwarding scheme.',
  domainAudit: {
    domainName: 'careers-mock-verify.top',
    estimatedAge: '< 15 days (Mock disposable domain)',
    isSuspiciousTld: true,
    isTyposquatting: true,
    isFreeWebmail: false,
    riskNotes: 'Brand Impersonation Detected in Mock Service Worker.'
  },
  paymentDemandFlags: [
    {
      id: 'mock-chk',
      flag: 'Advance Check & Wire Forwarding (Simulated)',
      category: 'CHECK_REFUND',
      riskScore: 95,
      explanation: 'Simulated check-cashing bounce trap for unit test verification.',
      quote: 'Deposit this cashier check and wire the funds.'
    }
  ],
  processRedFlags: [],
  linguisticSignals: [],
  breakdownScores: {
    paymentRisk: 95,
    domainRisk: 80,
    processRisk: 40,
    urgencyRisk: 50
  },
  highlightedExcerpts: [
    {
      id: 'mock-hl-1',
      text: 'Deposit this cashier check and wire the funds.',
      reason: 'Advance Check Bounce Scam',
      severity: 'critical'
    }
  ],
  actionPlan: [
    'Do not deposit the check or wire any funds.',
    'Cease communication immediately.'
  ],
  reportTemplate: {
    agency: 'FBI IC3 & FTC',
    title: '[MSW TEST]: Mock Incident Report',
    body: 'Simulated report body for test validation.'
  },
  analyzedAt: new Date().toISOString(),
  scanEngine: 'gemini-3.8-flash'
};

export const handlers = [
  // Default handler for /api/scan
  http.post('*/api/scan', async ({ request }) => {
    const payload = (await request.json().catch(() => ({}))) as ScanRequest;

    // Validate request structure
    if (!payload.text && !payload.url && !payload.senderEmail) {
      return HttpResponse.json(
        { error: 'Please provide offer text or a URL to scan.' },
        { status: 400 }
      );
    }

    // If the payload matches the standard mock scam test or contains mock flags, return mockSuccessScanResult
    // Otherwise calculate realistic scan result so legitimate offers are not falsely flagged as scams
    if (payload.text?.includes('cashier check') && payload.text?.includes('wire $4,000')) {
      return HttpResponse.json(mockSuccessScanResult, { status: 200 });
    }

    const evaluated = runHeuristicScan(payload);
    return HttpResponse.json(evaluated, { status: 200 });
  }),

  // Health check handler
  http.get('*/api/health', () => {
    return HttpResponse.json({
      status: 'ok',
      service: 'Vouch Security Scanner (MSW Mocked)',
      geminiConfigured: true,
      timestamp: new Date().toISOString()
    });
  })
];

/**
 * Scenario-specific handler overrides for targeted error and latency tests
 */
export const errorHandlers = {
  internalServerError: http.post('*/api/scan', () => {
    return HttpResponse.json(
      { error: 'Internal Server Error: AI Inference Pipeline Crashed' },
      { status: 500 }
    );
  }),

  serviceUnavailable: http.post('*/api/scan', () => {
    return HttpResponse.json(
      { error: 'Service Unavailable: Upstream Gemini Rate Limit Exceeded' },
      { status: 503 }
    );
  }),

  networkError: http.post('*/api/scan', () => {
    return HttpResponse.error();
  }),

  highLatency: (delayMs: number = 3000) =>
    http.post('*/api/scan', async () => {
      await delay(delayMs);
      return HttpResponse.json(mockSuccessScanResult);
    }),

  malformedJson: http.post('*/api/scan', () => {
    return new HttpResponse('<<<NOT_VALID_JSON>>>', {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }),

  invalidSchema: http.post('*/api/scan', () => {
    return HttpResponse.json({
      corruptedField: true,
      notes: 'Missing required threatIndex and threatLevel fields'
    });
  })
};
