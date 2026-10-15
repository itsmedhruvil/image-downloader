"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SITE } from "@/lib/site";

export function FeatureRequestForm() {
  const [title, setTitle] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [fallback, setFallback] = React.useState<string | null>(null);

  const mailtoHref = React.useMemo(() => {
    const subject = encodeURIComponent(`[Feature request] ${title || "New idea"}`);
    const body = encodeURIComponent(`${details}\n\n— from ${email || "an anonymous visitor"}`);
    return `mailto:${SITE.email}?subject=${subject}&body=${body}`;
  }, [details, email, title]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setFallback(null);

    try {
      const response = await fetch("/api/feature-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, email, details }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; fallbackEmail?: string }
        | null;

      if (!response.ok || !data?.ok) {
        if (data?.fallbackEmail) {
          setFallback(data.fallbackEmail);
          toast.error("Server submission is unavailable here — use the email link instead.");
        } else {
          toast.error(data?.error ?? "Could not send that request.");
        }
        return;
      }

      setDone(true);
      toast.success("Thanks — your idea is recorded.");
      setTitle("");
      setEmail("");
      setDetails("");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-lg border border-border p-8 text-center">
        <CheckCircle2 className="mx-auto size-6" />
        <p className="mt-4 text-sm font-semibold">Request received</p>
        <p className="mx-auto mt-2 max-w-sm text-sm opacity-70">
          Thank you. Feature requests are reviewed in batches and shipped in the changelog.
        </p>
        <Button className="mt-6" variant="outline" onClick={() => setDone(false)}>
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-lg border border-border p-6">
      <div className="space-y-2">
        <Label htmlFor="fr-title">Idea title *</Label>
        <Input
          id="fr-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. Extract only images larger than 1000px wide"
          required
          minLength={3}
          maxLength={140}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fr-email">Email (optional)</Label>
        <Input
          id="fr-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
        <p className="text-xs opacity-60">Only used to follow up on this request.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fr-details">Details</Label>
        <Textarea
          id="fr-details"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="What problem would this solve? Any example URLs?"
          maxLength={4000}
          className="min-h-32"
        />
      </div>

      {fallback ? (
        <p className="rounded-md border border-border p-3 text-xs">
          Server submission is not configured on this deployment. Please{" "}
          <a className="underline underline-offset-4" href={mailtoHref}>
            email {fallback}
          </a>{" "}
          instead.
        </p>
      ) : null}

      <Button type="submit" disabled={busy || title.trim().length < 3}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Send request
      </Button>
    </form>
  );
}
