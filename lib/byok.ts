export type Provider = "anthropic" | "openai" | "google" | "mock";

export interface Byok {
  provider: Provider;
  apiKey: string;
  model: string;
}

export const PROVIDER_LABELS: Record<Exclude<Provider, "mock">, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

// First entry of each list is the default model for that provider.
export const PROVIDER_MODELS: Record<Exclude<Provider, "mock">, string[]> = {
  anthropic: ["claude-haiku-4-5", "claude-sonnet-4-6", "claude-opus-4-7"],
  openai: ["gpt-4o-mini", "gpt-4o", "o1-mini"],
  google: ["gemini-2.0-flash", "gemini-2.5-pro"],
};

export const BYOK_KEY = "byok";

export function readByok(): Byok | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(BYOK_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as Partial<Byok>;
    if (!v || !v.provider || !v.apiKey) return null;
    return { provider: v.provider, apiKey: v.apiKey, model: v.model ?? "" };
  } catch {
    return null;
  }
}

export function writeByok(b: Byok): void {
  window.localStorage.setItem(BYOK_KEY, JSON.stringify(b));
}

export function clearByok(): void {
  window.localStorage.removeItem(BYOK_KEY);
}
