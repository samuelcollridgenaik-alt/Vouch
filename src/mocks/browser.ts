import { setupWorker } from 'msw/browser';
import { handlers, errorHandlers } from './handlers';

/**
 * Mock Service Worker browser instance.
 * Intercepts frontend API calls to /api/scan directly inside the browser / preview environment.
 */
export const worker = setupWorker(...handlers);

let isWorkerRunning = false;

export async function startBrowserWorker(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (isWorkerRunning) return true;

  try {
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
      },
    });
    isWorkerRunning = true;
    console.log('[MSW] Mock Service Worker interceptor active in browser.');
    return true;
  } catch (err) {
    console.warn('[MSW] Browser service worker registration skipped or restricted by sandbox:', err);
    return false;
  }
}

export function stopBrowserWorker() {
  if (isWorkerRunning) {
    worker.stop();
    isWorkerRunning = false;
    console.log('[MSW] Mock Service Worker interceptor stopped.');
  }
}

export type MockSimulationMode =
  | 'normal'
  | 'http-500'
  | 'http-503'
  | 'network-drop'
  | 'high-latency'
  | 'malformed-json'
  | 'invalid-schema';

/**
 * Convenience helper to set active simulation modes in runtime / testing:
 * Allows frontend UI or tests to switch between failure scenarios dynamically.
 */
export function setSimulationMode(mode: MockSimulationMode, latencyMs: number = 3000) {
  switch (mode) {
    case 'http-500':
      worker.use(errorHandlers.internalServerError);
      break;
    case 'http-503':
      worker.use(errorHandlers.serviceUnavailable);
      break;
    case 'network-drop':
      worker.use(errorHandlers.networkError);
      break;
    case 'high-latency':
      worker.use(errorHandlers.highLatency(latencyMs));
      break;
    case 'malformed-json':
      worker.use(errorHandlers.malformedJson);
      break;
    case 'invalid-schema':
      worker.use(errorHandlers.invalidSchema);
      break;
    case 'normal':
    default:
      worker.resetHandlers();
      break;
  }
}
