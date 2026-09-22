import test, { describe, it, before, after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../src/mocks/server.js';
import { errorHandlers, mockSuccessScanResult } from '../src/mocks/handlers.js';
import { executeScanWithFallback } from '../src/services/scanService.js';
import { ScanRequest } from '../src/types.js';

describe('MSW Integration: /api/scan Error Handling, Latency & Heuristic Fallback', () => {
  // Start Mock Service Worker interception
  before(() => {
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  // Reset handlers after each individual test to guarantee test isolation
  afterEach(() => {
    server.resetHandlers();
  });

  // Cleanly shut down MSW after the test suite finishes
  after(() => {
    server.close();
  });

  const sampleScamPayload: ScanRequest = {
    text: 'Please deposit this cashier check for $4,500 and wire $4,000 via Zelle to our vendor.',
    url: 'https://careers-google-verify.top',
    senderEmail: 'recruiter@careers-google-verify.top'
  };

  describe('1. Standard API Health & Response Validation (HTTP 200)', () => {
    it('should receive and validate mock network response when API is healthy', async () => {
      const response = await executeScanWithFallback(sampleScamPayload, {
        baseUrl: 'http://localhost:3000'
      });

      assert.equal(response.source, 'network');
      assert.equal(response.result.threatIndex, mockSuccessScanResult.threatIndex);
      assert.equal(response.result.threatLevel, 'CRITICAL');
      assert.ok(response.latencyMs >= 0);
      assert.equal(response.error, undefined);
    });
  });

  describe('2. Error Handling: HTTP 500 Internal Server Error', () => {
    it('should catch 500 server error and gracefully fall back to local heuristic analysis', async () => {
      server.use(errorHandlers.internalServerError);

      let fallbackNotice = '';
      let detectedType = '';
      const response = await executeScanWithFallback(sampleScamPayload, {
        baseUrl: 'http://localhost:3000',
        onFallback: (reason, type) => {
          fallbackNotice = reason;
          detectedType = type || '';
        }
      });

      // Verify graceful degradation
      assert.equal(response.source, 'heuristic-fallback');
      assert.equal(response.errorType, 'http');
      assert.equal(detectedType, 'http');
      assert.ok(response.error?.includes('500'), 'Error reason should mention status 500');
      assert.ok(fallbackNotice.includes('500'), 'Fallback callback should have been invoked with 500 reason');

      // Verify local heuristic engine provided high-accuracy scam detection
      assert.ok(
        response.result.threatIndex >= 85,
        `Expected heuristic threatIndex >= 85, got ${response.result.threatIndex}`
      );
      assert.equal(response.result.threatLevel, 'CRITICAL');
      assert.ok(response.result.paymentDemandFlags.some(f => f.category === 'CHECK_REFUND'));
      assert.ok(response.result.domainAudit.isSuspiciousTld || response.result.domainAudit.isTyposquatting);
    });
  });

  describe('3. Error Handling: HTTP 503 Service Unavailable', () => {
    it('should catch 503 upstream rate limit error and fall back without throwing unhandled exceptions', async () => {
      server.use(errorHandlers.serviceUnavailable);

      const response = await executeScanWithFallback(sampleScamPayload, {
        baseUrl: 'http://localhost:3000'
      });

      assert.equal(response.source, 'heuristic-fallback');
      assert.equal(response.errorType, 'http');
      assert.ok(response.error?.includes('503'));
      assert.equal(response.result.threatLevel, 'CRITICAL');
    });
  });

  describe('4. Network Failure & Offline Resilience (HttpResponse.error)', () => {
    it('should intercept complete network drop / connection failure and compute local heuristics', async () => {
      server.use(errorHandlers.networkError);

      let detectedType = '';
      const response = await executeScanWithFallback(sampleScamPayload, {
        baseUrl: 'http://localhost:3000',
        onFallback: (_reason, type) => {
          detectedType = type || '';
        }
      });

      assert.equal(response.source, 'heuristic-fallback');
      assert.equal(response.errorType, 'network');
      assert.equal(detectedType, 'network');
      assert.ok(response.result.threatIndex > 0);
      assert.equal(response.result.scanEngine, 'heuristic-defense-engine');
    });
  });

  describe('5. High Latency & Client Timeout Abort Controller', () => {
    it('should abort when API latency exceeds timeout threshold and fall back in < 500ms', async () => {
      // Handler introduces 3,000ms server delay
      server.use(errorHandlers.highLatency(3000));

      const startTime = Date.now();
      let detectedType = '';
      // Configure client timeout to 300ms
      const response = await executeScanWithFallback(sampleScamPayload, {
        baseUrl: 'http://localhost:3000',
        timeoutMs: 300,
        onFallback: (_reason, type) => {
          detectedType = type || '';
        }
      });
      const elapsed = Date.now() - startTime;

      assert.equal(response.source, 'heuristic-fallback');
      assert.equal(response.errorType, 'timeout');
      assert.equal(detectedType, 'timeout');
      assert.ok(response.error?.includes('timed out') || response.error?.includes('threshold'));
      assert.ok(elapsed < 1000, `Client should abort promptly, took ${elapsed}ms`);
      assert.ok(response.result.threatIndex >= 80);
    });
  });

  describe('6. Response Validation: Malformed Non-JSON Stream', () => {
    it('should catch invalid JSON syntax and safely fall back with errorType parsing', async () => {
      server.use(errorHandlers.malformedJson);

      let detectedType = '';
      const response = await executeScanWithFallback(sampleScamPayload, {
        baseUrl: 'http://localhost:3000',
        onFallback: (_reason, type) => {
          detectedType = type || '';
        }
      });

      assert.equal(response.source, 'heuristic-fallback');
      assert.equal(response.errorType, 'parsing');
      assert.equal(detectedType, 'parsing');
      assert.ok(response.error?.includes('JSON parsing failure'));
      assert.ok(response.result.actionPlan.length > 0);
    });

    it('should catch structural schema violations (missing threatIndex/threatLevel) and trigger heuristic fallback', async () => {
      server.use(errorHandlers.invalidSchema);

      let detectedType = '';
      const response = await executeScanWithFallback(sampleScamPayload, {
        baseUrl: 'http://localhost:3000',
        onFallback: (_reason, type) => {
          detectedType = type || '';
        }
      });

      assert.equal(response.source, 'heuristic-fallback');
      assert.equal(response.errorType, 'parsing');
      assert.equal(detectedType, 'parsing');
      assert.ok(response.error?.includes('Schema validation failure'));
      assert.ok(response.result.threatIndex >= 80);
    });
  });
});
