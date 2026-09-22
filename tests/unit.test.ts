import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runHeuristicScan, hasAffirmativeDemand, extractMatchingSentence } from '../src/utils/securityScanner.js';
import { ScanRequest } from '../src/types.js';

describe('Unit Tests: Heuristic & Forensic Defense Engine', () => {
  describe('Semantic Demand & Negation Parsing', () => {
    it('should detect affirmative payment demand when no negation is present', () => {
      const text = 'Please deposit this cashier check for $4,500 and wire the remainder.';
      assert.equal(hasAffirmativeDemand(text, ["cashier check", "cashier's check", "deposit"]), true);
    });

    it('should NOT trigger affirmative payment demand when explicitly negated (safe corporate disclaimer)', () => {
      const text = 'We will never ask you to pay any money or deposit checks for equipment.';
      assert.equal(hasAffirmativeDemand(text, ["pay", "deposit"]), false);
    });

    it('should correctly extract the culprit sentence containing the suspicious demand', () => {
      const text = 'Welcome to the team! Please send $500 via Zelle for your laptop. We look forward to working with you.';
      const sentence = extractMatchingSentence(text, ['zelle', 'bitcoin']);
      assert.match(sentence, /zelle/i);
      assert.match(sentence, /\$500/);
    });
  });

  describe('Threat Index Mathematical Bound & Output Schema', () => {
    it('should guarantee threatIndex is strictly bounded between 0 and 100', () => {
      const extremeScam: ScanRequest = {
        text: 'Deposit check, wire Zelle $5,000, buy equipment, interview on Telegram, pay training fee, urgent 24 hours!',
        url: 'https://careers-google-verify.top',
        senderEmail: 'scam-recruiter@gmail.com'
      };
      const result = runHeuristicScan(extremeScam);
      assert.ok(result.threatIndex >= 0 && result.threatIndex <= 100, `Threat index ${result.threatIndex} is out of bounds`);
      assert.equal(result.threatLevel, 'CRITICAL');
      assert.ok(result.paymentDemandFlags.length >= 2, 'Should flag multiple payment demands');
    });

    it('should score a legitimate, zero-risk job offer with a low baseline threat (< 25)', () => {
      const safeOffer: ScanRequest = {
        text: 'We are pleased to offer you the position of Software Engineer. Annual compensation is $130,000. All hardware and equipment will be provisioned by IT at zero cost to you.',
        url: 'https://careers.google.com',
        senderEmail: 'recruiting@google.com'
      };
      const result = runHeuristicScan(safeOffer);
      assert.ok(result.threatIndex < 25, `Expected safe threat index < 25, got ${result.threatIndex}`);
      assert.equal(result.threatLevel, 'LOW');
      assert.equal(result.paymentDemandFlags.length, 0);
      assert.equal(result.domainAudit.isSuspiciousTld, false);
      assert.equal(result.domainAudit.isTyposquatting, false);
    });
  });

  describe('Domain & Origin Heuristic Audit', () => {
    it('should detect suspicious disposable TLDs (.top, .xyz, .buzz)', () => {
      const req: ScanRequest = {
        text: 'Job interview details',
        url: 'https://portal-recruitment-verify.top'
      };
      const result = runHeuristicScan(req);
      assert.equal(result.domainAudit.isSuspiciousTld, true);
      assert.match(result.domainAudit.estimatedAge, /< (15|30) days/);
    });

    it('should detect brand typosquatting targeting enterprise names', () => {
      const req: ScanRequest = {
        text: 'Google hiring team',
        url: 'https://careers-google-jobs.xyz'
      };
      const result = runHeuristicScan(req);
      assert.equal(result.domainAudit.isTyposquatting, true);
      assert.match(result.domainAudit.riskNotes, /Brand Impersonation/i);
    });

    it('should detect corporate recruitment using free webmail (gmail/yahoo)', () => {
      const req: ScanRequest = {
        text: 'Microsoft recruitment team selection letter',
        senderEmail: 'microsoft.hr.dept.online@gmail.com'
      };
      const result = runHeuristicScan(req);
      assert.equal(result.domainAudit.isFreeWebmail, true);
      assert.match(result.domainAudit.riskNotes, /Free Webmail/i);
    });
  });

  describe('Incident Response & Action Plan Generation', () => {
    it('should populate actionable emergency instructions when critical flags exist', () => {
      const req: ScanRequest = {
        text: 'Deposit this check and send money back via Zelle.',
        senderEmail: 'hr@bogus-company.top'
      };
      const result = runHeuristicScan(req);
      assert.ok(result.actionPlan.length >= 3, 'Expected at least 3 actionable victim steps');
      assert.ok(result.actionPlan.some(step => step.toLowerCase().includes('check') || step.toLowerCase().includes('wire')));
      assert.ok(result.reportTemplate.title.length > 10, 'Report template title should be populated');
      assert.ok(result.reportTemplate.body.includes('Threat Index'), 'Report template body should include threat metrics');
    });
  });
});
