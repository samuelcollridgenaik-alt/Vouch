import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { runHeuristicScan } from './src/utils/securityScanner.js';
import { ScanRequest, ScanResult } from './src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '25mb' }));

  // API Health Check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'PhishGuard Security Scanner',
      geminiConfigured: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString()
    });
  });

  // Main Scan API
  app.post('/api/scan', async (req: Request, res: Response) => {
    try {
      const scanReq: ScanRequest = req.body;
      if (!scanReq || (!scanReq.text && !scanReq.url)) {
        return res.status(400).json({ error: 'Please provide offer text or a URL to scan.' });
      }

      // Always calculate baseline heuristics
      const baseline = runHeuristicScan(scanReq);

      // If Gemini API Key is available, augment with deep reasoning
      if (process.env.GEMINI_API_KEY) {
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
          
          const prompt = `You are a certified cybercrime investigator and corporate email fraud specialist.
Perform a thorough forensic analysis on this job offer letter or rental agreement text.

CRITICAL INSTRUCTIONS ON FALSE POSITIVES VS REAL SCAMS:
- Legitimate corporate job offers from genuine employers (mentioning standard benefits like 401(k), RSUs, healthcare, verified background checks like Checkr/Workday, equipment shipped by corporate IT at zero cost to the candidate, and explicit disclaimers that the company will NEVER ask for money or gift cards) are SAFE and LEGITIMATE.
- For legitimate offers with no advance payment demands, no wire/check requests, and no suspicious chat interviews, assign Threat Level: LOW and Scam Threat Index: 0 to 15. Do NOT flag standard corporate hiring clauses as scam indicators.
- Genuine scams involve: demands for money, advance check deposits & wire transfer, gift cards, off-platform chat interviews (Telegram/WhatsApp), pay-for-training, or brand spoofing.

Identify:
1. Threat Level (CRITICAL, HIGH, SUSPICIOUS, MODERATE, LOW)
2. Scam Threat Index (integer 0 to 100)
3. Specific Payment Demand Red Flags (e.g. check cashing, pay-for-equipment, crypto, wire transfer, training fees)
4. Domain or sender impersonation concerns
5. Process red flags (e.g. Telegram interviews, unrealistic salary, isolation tactics)
6. Exact suspicious excerpt quotes from the text with explanations (leave empty if legitimate)
7. Recommended immediate action steps for the candidate

Input URL: ${scanReq.url || 'None provided'}
Sender Email: ${scanReq.senderEmail || 'None provided'}
Document Content:
"""
${scanReq.text || 'No text provided, examine URL only.'}
"""

Synthesize this into a structured JSON response matching the schema.`;

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Gemini API request timed out')), 4000)
          );

          const generatePromise = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  threatIndex: { type: Type.INTEGER, description: 'Threat score from 0 (safe) to 100 (lethal scam)' },
                  threatLevel: { type: Type.STRING, enum: ['CRITICAL', 'HIGH', 'SUSPICIOUS', 'MODERATE', 'LOW'] },
                  confidenceLevel: { type: Type.STRING, enum: ['High', 'Medium', 'Low'], description: 'Assessment reliability confidence based on corroborated signals' },
                  confidenceReason: { type: Type.STRING, description: 'Reason for the confidence rating' },
                  verdictTitle: { type: Type.STRING },
                  executiveSummary: { type: Type.STRING },
                  breakdownScores: {
                    type: Type.OBJECT,
                    properties: {
                      paymentRisk: { type: Type.INTEGER },
                      domainRisk: { type: Type.INTEGER },
                      processRisk: { type: Type.INTEGER },
                      urgencyRisk: { type: Type.INTEGER }
                    },
                    required: ['paymentRisk', 'domainRisk', 'processRisk', 'urgencyRisk']
                  },
                  paymentDemandFlags: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        flag: { type: Type.STRING },
                        category: { type: Type.STRING },
                        riskScore: { type: Type.INTEGER },
                        explanation: { type: Type.STRING },
                        quote: { type: Type.STRING }
                      },
                      required: ['id', 'flag', 'riskScore', 'explanation']
                    }
                  },
                  processRedFlags: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        flag: { type: Type.STRING },
                        severity: { type: Type.STRING, enum: ['critical', 'high', 'medium', 'low'] },
                        detail: { type: Type.STRING }
                      },
                      required: ['id', 'flag', 'severity', 'detail']
                    }
                  },
                  linguisticSignals: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        signal: { type: Type.STRING },
                        detail: { type: Type.STRING }
                      },
                      required: ['id', 'signal', 'detail']
                    }
                  },
                  highlightedExcerpts: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING },
                        reason: { type: Type.STRING },
                        severity: { type: Type.STRING, enum: ['critical', 'warning'] }
                      },
                      required: ['id', 'text', 'reason', 'severity']
                    }
                  },
                  actionPlan: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ['threatIndex', 'threatLevel', 'verdictTitle', 'executiveSummary', 'breakdownScores', 'actionPlan']
              }
            }
          });

          const response: any = await Promise.race([generatePromise, timeoutPromise]);

          const parsed = JSON.parse(response.text || '{}');

          // Check if baseline deterministic analysis firmly identified this as a legitimate offer with zero flags
          const isSafeBaseline =
            baseline.threatIndex <= 15 &&
            baseline.paymentDemandFlags.length === 0 &&
            baseline.processRedFlags.length === 0 &&
            !baseline.domainAudit.isTyposquatting &&
            !baseline.domainAudit.isSuspiciousTld;

          // Merge AI results with baseline heuristics:
          // If baseline verified genuine employment/tenancy, cap threat index and honor safe classification
          // Otherwise, protect user safety by combining threat signals
          const finalThreatIndex = isSafeBaseline
            ? Math.min(baseline.threatIndex, parsed.threatIndex !== undefined ? parsed.threatIndex : baseline.threatIndex)
            : Math.max(baseline.threatIndex, parsed.threatIndex ?? baseline.threatIndex);

          const finalThreatLevel = isSafeBaseline && finalThreatIndex <= 15
            ? 'LOW'
            : (parsed.threatLevel || baseline.threatLevel);

          const merged: ScanResult = {
            threatIndex: finalThreatIndex,
            threatLevel: finalThreatLevel,
            confidenceLevel: parsed.confidenceLevel || baseline.confidenceLevel,
            confidenceReason: parsed.confidenceReason || baseline.confidenceReason,
            verdictTitle: isSafeBaseline && finalThreatIndex <= 15 ? baseline.verdictTitle : (parsed.verdictTitle || baseline.verdictTitle),
            executiveSummary: isSafeBaseline && finalThreatIndex <= 15 ? baseline.executiveSummary : (parsed.executiveSummary || baseline.executiveSummary),
            domainAudit: baseline.domainAudit,
            paymentDemandFlags: isSafeBaseline ? [] : (parsed.paymentDemandFlags?.length ? parsed.paymentDemandFlags : baseline.paymentDemandFlags),
            processRedFlags: isSafeBaseline ? [] : (parsed.processRedFlags?.length ? parsed.processRedFlags : baseline.processRedFlags),
            linguisticSignals: isSafeBaseline ? [] : (parsed.linguisticSignals?.length ? parsed.linguisticSignals : baseline.linguisticSignals),
            breakdownScores: parsed.breakdownScores || baseline.breakdownScores,
            highlightedExcerpts: isSafeBaseline ? [] : (parsed.highlightedExcerpts?.length ? parsed.highlightedExcerpts : baseline.highlightedExcerpts),
            actionPlan: parsed.actionPlan?.length ? parsed.actionPlan : baseline.actionPlan,
            reportTemplate: baseline.reportTemplate,
            analyzedAt: new Date().toISOString(),
            scanEngine: 'gemini-3.8-flash'
          };

          return res.json(merged);
        } catch (geminiErr) {
          console.warn('Gemini API call failed or rate limited, falling back to deterministic heuristic engine:', geminiErr);
          // Fall back seamlessly to heuristic engine
          return res.json(baseline);
        }
      }

      // If no API key, return heuristic analysis
      return res.json(baseline);
    } catch (err: any) {
      console.error('Scan error:', err);
      res.status(500).json({ error: 'Scan analysis encountered an error.', details: err?.message });
    }
  });

  // Multimodal OCR: Extract printed letter text, URLs, and emails from image
  app.post('/api/extract-letter', async (req: Request, res: Response) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Please provide an image of the printed letter.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ error: 'Gemini API is not configured on the server.' });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      // Strip any data url prefix if present
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

      let response;
      const ocrPrompt = `Perform rapid high-accuracy OCR extraction on this photographed or printed job offer / contract document.
Extract verbatim text and key metadata.
Output strict JSON:
{
  "fullText": "Full text of the document with key clauses, salary, and requirements",
  "extractedUrl": "Website link or verification domain found in document (or null)",
  "extractedEmail": "Contact, HR, or sender email found (or null)",
  "companyName": "Company name claimed in document (or null)",
  "jobTitle": "Job title or position (or null)",
  "summary": "1-sentence summary of the document"
}`;

      const runGemini = () =>
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanBase64,
              },
            },
            {
              text: ocrPrompt,
            },
          ],
          config: {
            responseMimeType: 'application/json',
            maxOutputTokens: 1000,
          },
        });

      try {
        response = await runGemini();
      } catch (firstErr: any) {
        console.warn('Initial OCR attempt encountered spike, retrying once...', firstErr?.message);
        await new Promise((resolve) => setTimeout(resolve, 600));
        response = await runGemini();
      }

      const rawText = response.text?.trim() || '{}';
      let parsed;
      try {
        parsed = JSON.parse(rawText);
      } catch (parseErr) {
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      return res.json({
        success: true,
        text: parsed.fullText || '',
        url: parsed.extractedUrl || '',
        senderEmail: parsed.extractedEmail || '',
        companyName: parsed.companyName || '',
        jobTitle: parsed.jobTitle || '',
        summary: parsed.summary || ''
      });
    } catch (err: any) {
      console.error('Error extracting printed letter image:', err);
      return res.status(500).json({
        error: 'Failed to transcribe and extract printed letter.',
        details: err?.message
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PhishGuard server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
