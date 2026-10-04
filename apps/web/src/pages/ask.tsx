import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAsk } from "@/hooks/use-reconciliations";
import { DEMO_MODE } from '@/lib/demo';

export function AskPage() {
  return DEMO_MODE ? <DemoAskPage /> : <LiveAskPage />;
}

function DemoAskPage() {
  return <div className="space-y-6">
    <h2 className="text-2xl font-bold">Ask AI</h2>
    <Card><CardHeader><CardTitle>Available in the full app</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-muted-foreground">
        <p>This demo runs entirely in your browser with fictional sample records. It does not send questions to an AI service.</p>
        <p>The full LedgerMatch app uses a FastAPI backend, PostgreSQL and an Anthropic API key to answer questions about reconciliation data.</p>
        <p>Explore the Dashboard, Transactions and Reconciliations pages to try the sample-data workspace.</p>
        <a className="text-primary underline" href="https://github.com/tusharpanthri/ledger-match#setup-and-configuration">View full-app setup instructions</a>
      </CardContent>
    </Card>
  </div>;
}

function LiveAskPage() {
  const [question, setQuestion] = useState("");
  const { mutate, data, isPending, error } = useAsk();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      mutate(question.trim());
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Ask AI</h2>
      <p className="text-muted-foreground">
        Ask questions about your payment reconciliation data in natural language.
        You can ask in English or Spanish.
      </p>

      {/* Question Form */}
      <Card>
        <CardHeader>
          <CardTitle>Your Question</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="e.g., How many transactions didn't match yesterday? / ¿Cuántas transacciones no coinciden?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
            />
            <Button type="submit" disabled={isPending || !question.trim()}>
              {isPending ? "Thinking..." : "Ask"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Questions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[
              "What is the match rate?",
              "How many transactions are unmatched?",
              "What is the total discrepancy amount?",
              "Show me the top 5 largest mismatches",
              "¿Cuántas transacciones hay por proveedor?",
              "Dame un resumen general de las reconciliaciones",
            ].map((q) => (
              <button
                key={q}
                onClick={() => {
                  setQuestion(q);
                  mutate(q);
                }}
                disabled={isPending}
                className="rounded-md border px-3 py-1 text-sm hover:bg-muted disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-destructive">
            Error: {error.message}
          </CardContent>
        </Card>
      )}

      {/* Answer */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Answer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.error ? (
              <p className="text-destructive">{data.error}</p>
            ) : (
              <>
                <div className="whitespace-pre-wrap">{data.answer}</div>
                {data.sql && (
                  <>
                    <Separator />
                    <div>
                      <p className="mb-2 text-sm font-medium text-muted-foreground">
                        SQL Query Used:
                      </p>
                      <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                        {data.sql}
                      </pre>
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
