/**
 * Ask CreditMate advisor client (Capability 2, LangGraph advisor).
 *
 * Mirrors the backend contract in advisor/api/serializers.py:
 * POST /api/v1/advisor/chat/ and the SSE variant /advisor/chat/stream/.
 * The advisor is flag-gated server-side (ADVISOR_ENABLED); when disabled
 * the API answers 404 and the page shows its fallback state.
 *
 * Suggested actions are PROPOSALS only. Nothing here executes one: the
 * page wires a save-to-shortlist action to the existing shortlist
 * provider, and only on an explicit user click.
 */

import { ENV } from '../config/env';

export interface AdvisorCitation {
  product_type: 'cards' | 'deposits' | 'loans' | 'accounts' | string;
  product_id: number | null;
  slug: string | null;
  label: string;
  url_path: string;
  field: string | null;
}

export interface AdvisorSuggestedAction {
  kind: 'save_to_shortlist' | string;
  label: string;
  product_type: string | null;
  product_id: number | null;
  slug: string | null;
}

export interface AdvisorToolTraceEntry {
  tool: string;
  args_hash: string;
  latency_ms: number;
}

export interface AdvisorResponse {
  session_id: string;
  answer_markdown: string;
  cited_product_ids: number[];
  citations: AdvisorCitation[];
  suggested_actions: AdvisorSuggestedAction[];
  confidence_notes: string[];
  is_fallback: boolean;
  tool_trace: AdvisorToolTraceEntry[];
}

const base = (): string => ENV.API_BASE_URL.replace(/\/$/, '');

export class AdvisorUnavailableError extends Error {
  constructor(message = 'Advisor unavailable') {
    super(message);
    this.name = 'AdvisorUnavailableError';
  }
}

export const askAdvisor = async (
  message: string,
  sessionId?: string,
  signal?: AbortSignal
): Promise<AdvisorResponse> => {
  const response = await fetch(`${base()}/advisor/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId }),
    signal,
  });
  if (!response.ok) {
    throw new AdvisorUnavailableError(`advisor chat failed: ${response.status}`);
  }
  return (await response.json()) as AdvisorResponse;
};

/**
 * Streaming variant: emits `meta` while the advisor works, then one
 * `answer` event with the full payload, then `done`. Falls back to the
 * plain POST on any stream error, so callers have a single code path.
 */
export const askAdvisorStream = async (
  message: string,
  sessionId: string | undefined,
  onWorking: () => void,
  signal?: AbortSignal
): Promise<AdvisorResponse> => {
  try {
    const response = await fetch(`${base()}/advisor/chat/stream/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId }),
      signal,
    });
    if (!response.ok || !response.body) {
      throw new AdvisorUnavailableError(`advisor stream failed: ${response.status}`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let answer: AdvisorResponse | null = null;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() ?? '';
      for (const block of blocks) {
        const eventMatch = /event: (\w+)/.exec(block);
        const dataMatch = /data: (.*)/s.exec(block);
        if (!eventMatch || !dataMatch) continue;
        if (eventMatch[1] === 'meta') onWorking();
        if (eventMatch[1] === 'answer') {
          answer = JSON.parse(dataMatch[1]) as AdvisorResponse;
        }
      }
    }
    if (!answer) throw new AdvisorUnavailableError('advisor stream ended without an answer');
    return answer;
  } catch (error) {
    if (error instanceof AdvisorUnavailableError) {
      return askAdvisor(message, sessionId, signal);
    }
    throw error;
  }
};
