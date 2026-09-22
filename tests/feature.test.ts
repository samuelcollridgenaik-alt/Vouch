import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { runHeuristicScan } from '../src/utils/securityScanner.js';
import { ScanRequest } from '../src/types.js';

describe('Feature Tests: Hackathon Problem Benchmark Scenarios', () => {
  describe('Benchmark 1: Remote Tech Equipment Check Phishing Scheme', () => {
    const samplePayload: ScanRequest = {
      text: `Dear Selected Applicant,
Congratulations! Following your screening via Telegram, you have been appointed Senior Remote Data Analyst ($145,000/yr).
We have enclosed an advance cashier check for $4,500.00. Per company procurement directive, you must deposit this check into your personal checking account today.
Once funds appear available, immediately wire $3,950.00 via Zelle or Bitcoin ATM to our authorized hardware vendor for your encrypted MacBook Pro.
Failure to submit proof of transfer within 24 hours will result in immediate termination.`,
      url: 'https://careers-google-verify.top/onboarding',
      senderEmail: 'hr-director@careers-google-verify.top'
    };

    it('should classify sample as CRITICAL with threatIndex >= 85', () => {
      const result = runHeuristicScan(samplePayload);
      assert.ok(result.threatIndex >= 85, `Expected threat >= 85, got ${result.threatIndex}`);
      assert.equal(result.threatLevel, 'CRITICAL');
    });

    it('should isolate both check bounce and wire/crypto payment traps', () => {
      const result = runHeuristicScan(samplePayload);
      const categories = result.paymentDemandFlags.map(f => f.category);
      assert.ok(categories.includes('CHECK_REFUND'), 'Should include CHECK_REFUND flag');
      assert.ok(categories.includes('WIRE_TRANSFER'), 'Should include WIRE_TRANSFER flag');
      assert.ok(categories.includes('EQUIPMENT_PURCHASE'), 'Should include EQUIPMENT_PURCHASE flag');
    });

    it('should detect Telegram off-platform interview process red flag', () => {
      const result = runHeuristicScan(samplePayload);
      assert.ok(result.processRedFlags.some(f => f.id === 'proc-chat'));
    });

    it('should corroborate high confidence due to multi-vector convergence', () => {
      const result = runHeuristicScan(samplePayload);
      assert.equal(result.confidenceLevel, 'High');
    });
  });

  describe('Benchmark 2: Sight-Unseen Rental Security Deposit Wire Trap', () => {
    const rentalPayload: ScanRequest = {
      text: `Luxury 2-Bedroom Downtown Penthouse available for $1,200/month (all utilities included).
Due to our emergency missionary assignment in Europe, in-person viewings are strictly suspended.
To reserve the unit and lock in this rate, you must send a refundable security deposit of $1,800 immediately via Western Union or Apple Cash.
Once the wire confirmation is received, keys and original lease documents will be overnighted via FedEx Express to your current address.`,
      url: 'https://craigslist-exclusive-rentals.online/penthouse',
      senderEmail: 'reverend.landlord.rentals@gmail.com'
    };

    it('should flag sight-unseen rental trap with threatIndex >= 80', () => {
      const result = runHeuristicScan(rentalPayload);
      assert.ok(result.threatIndex >= 80, `Expected threat >= 80, got ${result.threatIndex}`);
      assert.ok(result.paymentDemandFlags.some(f => f.id === 'rental-trap'));
      assert.ok(result.domainAudit.isSuspiciousTld || result.domainAudit.isFreeWebmail);
    });
  });

  describe('Benchmark 3: Guaranteed Job Upfront Placement & Training Fee', () => {
    const trainingFeePayload: ScanRequest = {
      text: `Welcome to the Global Executive Placement Program.
We guarantee 100% placement with Fortune 500 tech firms at salaries starting at $120,000.
To finalize your candidate placement contract, all applicants are required to purchase the mandatory certification module ($850) and submit an administration fee before interview scheduling.`,
      url: 'https://guaranteed-jobs-hub.biz',
      senderEmail: 'careers@guaranteed-jobs-hub.biz'
    };

    it('should identify upfront training fee violation with threatIndex >= 70', () => {
      const result = runHeuristicScan(trainingFeePayload);
      assert.ok(result.threatIndex >= 70, `Expected threat >= 70, got ${result.threatIndex}`);
      assert.ok(result.paymentDemandFlags.some(f => f.category === 'TRAINING_FEE'));
    });
  });

  describe('Benchmark 4: Verified Legitimate Enterprise Job Offer (Safe Baseline)', () => {
    const safePayload: ScanRequest = {
      text: `Dear Alex Morgan,
On behalf of Google LLC, we are delighted to extend an offer for the position of Senior Frontend Engineer based in Mountain View, CA.
Your base compensation will be $185,000 annually, accompanied by standard equity participation and healthcare coverage.
All enterprise equipment, secure laptop, and security peripherals will be provisioned directly by our IT department and shipped to your home address at zero cost.
We will never ask you to pay any fees, deposit checks, or purchase hardware.
Please review the official offer on our internal career portal.`,
      url: 'https://careers.google.com/applications/status/1049281',
      senderEmail: 'talent-acquisition@google.com'
    };

    it('should evaluate safe enterprise offer with threatIndex <= 15', () => {
      const result = runHeuristicScan(safePayload);
      assert.ok(result.threatIndex <= 15, `Expected safe threat <= 15, got ${result.threatIndex}`);
      assert.equal(result.threatLevel, 'LOW');
      assert.equal(result.paymentDemandFlags.length, 0);
      assert.equal(result.domainAudit.isSuspiciousTld, false);
      assert.equal(result.domainAudit.isTyposquatting, false);
    });

    it('should evaluate Stripe legitimate sample case with threatIndex <= 10 and zero flags', () => {
      const stripePayload: ScanRequest = {
        text: `Subject: Formal Offer of Employment: Software Engineer - Stripe, Inc.
Dear Alex,
On behalf of Stripe, Inc., we are thrilled to offer you the full-time position of Software Engineer on our Core Infrastructure team.
Starting Annual Base Salary: $165,000 USD.
Restricted Stock Units (RSUs): Valued at $120,000 USD over 4 years.
401(k) retirement plan with employer matching.
All necessary computer hardware will be pre-configured by Stripe IT and shipped at zero cost to you. Stripe will never ask you to pay for equipment, purchase gift cards, or wire money.
Contingent upon background check by Checkr, Inc.
Review letter via Workday portal link.`,
        url: 'https://careers.stripe.com',
        senderEmail: 'recruiting-team@stripe.com'
      };
      const result = runHeuristicScan(stripePayload);
      assert.ok(result.threatIndex <= 10, `Expected Stripe safe threat <= 10, got ${result.threatIndex}`);
      assert.equal(result.threatLevel, 'LOW');
      assert.equal(result.paymentDemandFlags.length, 0);
      assert.equal(result.processRedFlags.length, 0);
      assert.equal(result.linguisticSignals.length, 0);
      assert.equal(result.domainAudit.isSuspiciousTld, false);
      assert.equal(result.domainAudit.isTyposquatting, false);
    });
  });

  describe('Forensic Report Formatting & IC3 Complaint Output', () => {
    it('should format clean incident report with all requisite law enforcement fields', () => {
      const payload: ScanRequest = {
        text: 'Deposit $3,000 check and send Zelle to vendor.',
        url: 'https://careers-verify.top',
        senderEmail: 'recruiter@careers-verify.top'
      };
      const result = runHeuristicScan(payload);
      assert.ok(result.reportTemplate.title.includes('careers-verify.top'));
      assert.ok(result.reportTemplate.body.includes('Incident Summary'));
      assert.ok(result.reportTemplate.agency.includes('FBI IC3'));
    });
  });
});
