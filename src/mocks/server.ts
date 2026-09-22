import { setupServer } from 'msw/node';
import { handlers, errorHandlers } from './handlers';

export const server = setupServer(...handlers);

export type MockSimulationMode =
  | 'normal'
  | 'http-500'
  | 'http-503'
  | 'network-drop'
  | 'high-latency'
  | 'malformed-json'
  | 'invalid-schema';

/**
 * Dynamically switches simulation modes for Node test runs
 */
export function setServerSimulationMode(mode: MockSimulationMode, latencyMs: number = 3000) {
  switch (mode) {
    case 'http-500':
      server.use(errorHandlers.internalServerError);
      break;
    case 'http-503':
      server.use(errorHandlers.serviceUnavailable);
      break;
    case 'network-drop':
      server.use(errorHandlers.networkError);
      break;
    case 'high-latency':
      server.use(errorHandlers.highLatency(latencyMs));
      break;
    case 'malformed-json':
      server.use(errorHandlers.malformedJson);
      break;
    case 'invalid-schema':
      server.use(errorHandlers.invalidSchema);
      break;
    case 'normal':
    default:
      server.resetHandlers();
      break;
  }
}

