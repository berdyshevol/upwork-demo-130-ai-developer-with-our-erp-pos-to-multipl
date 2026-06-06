"use client";

import { useEffect, useState } from "react";
import {
  PROVIDER_LABELS,
  PROVIDER_MODELS,
  readByok,
  writeByok,
  clearByok,
  type Provider,
} from "@/lib/byok";
import { Card, CardHeader, CardBody, Button } from "@/components/ui";

type UiProvider = Exclude<Provider, "mock">;

export default function SettingsPage() {
  const [provider, setProvider] = useState<UiProvider>("anthropic");
  const [model, setModel] = useState<string>(PROVIDER_MODELS.anthropic[0]);
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const existing = readByok();
    if (existing && existing.provider !== "mock") {
      setProvider(existing.provider);
      setModel(existing.model || PROVIDER_MODELS[existing.provider][0]);
      setApiKey(existing.apiKey);
    }
  }, []);

  function changeProvider(p: UiProvider) {
    setProvider(p);
    setModel(PROVIDER_MODELS[p][0]); // reset to that provider's default model
    setSaved(false);
  }

  function save() {
    writeByok({ provider, apiKey, model });
    setSaved(true);
  }

  function clear() {
    clearByok();
    setApiKey("");
    setProvider("anthropic");
    setModel(PROVIDER_MODELS.anthropic[0]);
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings · Bring your own key</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your key is stored only in this browser&apos;s localStorage and used to call the provider
          directly. It never touches our servers.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader title="AI provider" subtitle="Pick a provider, paste your key, choose a model" />
        <CardBody className="space-y-5">
          <Field label="Provider">
            <select
              data-testid="provider-select"
              value={provider}
              onChange={(e) => changeProvider(e.target.value as UiProvider)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {(Object.keys(PROVIDER_LABELS) as UiProvider[]).map((p) => (
                <option key={p} value={p}>
                  {PROVIDER_LABELS[p]}
                </option>
              ))}
            </select>
          </Field>

          <Field label={<span data-testid="apikey-label">{PROVIDER_LABELS[provider]} API key</span>}>
            <input
              data-testid="apikey-input"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setSaved(false);
              }}
              placeholder={`Paste your ${PROVIDER_LABELS[provider]} API key`}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Model">
            <select
              data-testid="model-select"
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                setSaved(false);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {PROVIDER_MODELS[provider].map((m, i) => (
                <option key={m} value={m}>
                  {m}
                  {i === 0 ? " (default)" : ""}
                </option>
              ))}
            </select>
          </Field>

          <div className="flex items-center gap-3">
            <Button testId="save-byok" onClick={save}>Save</Button>
            <Button testId="clear-byok" variant="outline" onClick={clear}>Clear</Button>
            {saved && <span className="text-sm font-medium text-emerald-600">Saved ✓</span>}
          </div>
        </CardBody>
      </Card>

      <p className="max-w-xl text-xs text-slate-400">
        The dashboard, ABC classification, restock suggestions and the mock ERP endpoint all work
        without a key. A key only upgrades &ldquo;Ask the data&rdquo; from local heuristics to live
        LLM answers.
      </p>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}
