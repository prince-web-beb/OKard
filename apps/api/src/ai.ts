/**
 * Server-only OpenRouter primary / Gemini fallback wiring.
 * No public generation route until auth, consent, quotas, audit and abuse controls exist.
 */
import { createAIGateway, loadAIGatewayConfig } from '@okard/ai-gateway';
export const serverAI = createAIGateway(loadAIGatewayConfig(process.env));
export function getServerAIStatus() {
  return serverAI.status();
}
