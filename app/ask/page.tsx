"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDataset } from "@/lib/use-dataset";
import { readByok, type Byok } from "@/lib/byok";
import { answerQuestion } from "@/lib/llm";
import { Card, CardHeader, CardBody, Button } from "@/components/ui";

const SAMPLES = [
  "What is the top selling product?",
  "Which SKUs need restocking?",
  "What's the 7-day demand forecast?",
  "Which products are class A?",
];

export default function AskPage() {
  const { analytics, seed } = useDataset();
  const [byok, setByok] = useState<Byok | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setByok(readByok());
  }, []);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed || !analytics) return;
    setPending(true);
    setAnswer(null);
    try {
      const text = await answerQuestion(byok, trimmed, analytics);
      setAnswer(text);
    } finally {
      setPending(false);
    }
  }

  const live = byok && byok.provider !== "mock";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ask the data</h1>
        <p className="mt-1 text-sm text-slate-500">
          Natural-language questions answered against the live dataset (#{seed}).
        </p>
      </div>

      {!byok && (
        <Card testId="byok-hint" className="border-amber-200 bg-amber-50/70">
          <CardBody className="text-sm text-amber-800">
            Choose a provider and paste your API key in{" "}
            <Link href="/settings" className="font-semibold underline">Settings</Link> to enable
            live AI. Until then, answers are computed locally from your data.
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Question"
          subtitle={
            live
              ? `Live AI · ${byok!.provider} / ${byok!.model}`
              : byok
                ? "Mock mode · deterministic local answers"
                : "Offline mode · deterministic local answers"
          }
        />
        <CardBody className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(question);
            }}
            className="flex gap-2"
          >
            <input
              data-testid="ask-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Which products need restocking this week?"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            />
            <Button type="submit" testId="ask-submit" disabled={pending}>
              {pending ? "Thinking…" : "Ask"}
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {SAMPLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuestion(s);
                  ask(s);
                }}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                {s}
              </button>
            ))}
          </div>

          {answer && (
            <div
              data-testid="ask-answer"
              className="rounded-lg border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm leading-relaxed text-slate-800"
            >
              {answer}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
