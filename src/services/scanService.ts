import { ScanRequest, ScanResult } from '../types';
import { runHeuristicScan } from '../utils/securityScanner';

export type ScanErrorType = 'network' | 'timeout' | 'http' | 'parsing';

export interface ScanServiceResponse {
  result: ScanResult;
  source: 'network' | 'heuristic-fallback';
  error?: string;
  errorType?: ScanErrorType;
  latencyMs: number;
}

export interface ScanServiceOptions {
  timeoutMs?: number;
  baseUrl?: string;
  onFallback?: (reason: string, errorType?: ScanErrorType) => void;
}

/**
 * Executes a forensic scan request against the /api/scan endpoint with
 * automatic timeout protection and seamless client-side heuristic fallback.
 *
 * Granular Error Handling:
 * 1. Network / Transport Layer: Catches network disconnects, DNS errors, and client-side timeouts.
 * 2. HTTP Protocol Layer: Detects non-2xx status codes (500, 503, 400).
 * 3. Response Parsing & Schema Validation Layer: Catches corrupted JSON or invalid data structures.
 *
 * All failures gracefully fall back to local deterministic heuristic analysis
 * (runHeuristicScan) so candidate threat inspection is never interrupted.
 */
export async function executeScanWithFallback(
  payload: ScanRequest,
  options: ScanServiceOptions = {}
): Promise<ScanServiceResponse> {
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs ?? 4500;
  const baseUrl = options.baseUrl ?? '';
  const url = `${baseUrl}/api/scan`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;

  // --- Step 1: Network Transport Layer ---
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (networkErr: any) {
    clearTimeout(timer);
    const latencyMs = Date.now() - startTime;
    const isTimeout =
      networkErr?.name === 'AbortError' || networkErr?.message?.includes('aborted');

    const errorType: ScanErrorType = isTimeout ? 'timeout' : 'network';
    const reason = isTimeout
      ? `Network request timed out: exceeded latency threshold (${timeoutMs}ms)`
      : `Network transport failure: ${networkErr?.message || 'Remote scan API unreachable'}`;

    options.onFallback?.(reason, errorType);
    const fallbackResult = runHeuristicScan(payload);

    return {
      result: fallbackResult,
      source: 'heuristic-fallback',
      error: reason,
      errorType,
      latencyMs,
    };
  }

  clearTimeout(timer);

  // --- Step 2: HTTP Protocol & Status Code Layer ---
  if (!response.ok) {
    const latencyMs = Date.now() - startTime;
    const errText = await response.text().catch(() => '');
    const reason = `HTTP error response: Server returned status ${response.status} (${errText || response.statusText})`;
    const errorType: ScanErrorType = 'http';

    options.onFallback?.(reason, errorType);
    const fallbackResult = runHeuristicScan(payload);

    return {
      result: fallbackResult,
      source: 'heuristic-fallback',
      error: reason,
      errorType,
      latencyMs,
    };
  }

  // --- Step 3: API Response Parsing & Schema Validation Layer ---
  let rawBody = '';
  try {
    rawBody = await response.text();
    let data: ScanResult;

    try {
      data = JSON.parse(rawBody);
    } catch (parseErr: any) {
      throw new Error(`JSON parsing failure: ${parseErr?.message || 'Invalid JSON syntax in API response'}`);
    }

    // Schema and structural invariant validation
    if (typeof data !== 'object' || data === null) {
      throw new Error('Schema validation failure: Response payload is not an object');
    }
    if (typeof data.threatIndex !== 'number' || isNaN(data.threatIndex)) {
      throw new Error('Schema validation failure: Missing or invalid numeric threatIndex');
    }
    if (!data.threatLevel || typeof data.threatLevel !== 'string') {
      throw new Error('Schema validation failure: Missing or invalid threatLevel string');
    }

    const latencyMs = Date.now() - startTime;
    return {
      result: data,
      source: 'network',
      latencyMs,
    };
  } catch (parsingErr: any) {
    const latencyMs = Date.now() - startTime;
    const reason = `API response parsing error: ${parsingErr?.message || 'Failed to parse response body'}`;
    const errorType: ScanErrorType = 'parsing';

    options.onFallback?.(reason, errorType);
    const fallbackResult = runHeuristicScan(payload);

    return {
      result: fallbackResult,
      source: 'heuristic-fallback',
      error: reason,
      errorType,
      latencyMs,
    };
  }
}
