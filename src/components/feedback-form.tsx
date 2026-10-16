"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Internal feedback / bug report form. Submissions are stored as JSON objects in
 * the configured bucket; when storage is unavailable the form says so plainly
 * instead of silently dropping the message.
 */
export function FeedbackForm() {
  const [title, setTitle] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [details, setDetails] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [storageUnavailable, setStorageUnavailable] = React.useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setStorageUnavailable(false);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, email, details }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;

      if (!response.ok || !data?.ok) {
        if (response.status === 503) setStorageUnavailable(true);
        toast.error(data?.error ?? "Could not submit that.");
        return;
      }

      setDone(true);
      toast.success("Logged.");
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
      <div className="rounded-lg border border-border p-6">
        <CheckCircle2 className="size-5" />
        <p className="mt-3 text-sm font-semibold">Logged</p>
        <p className="mt-1 text-sm opacity-70">
          Stored for the team to review. Nothing else happens automatically.
        </p>
        <Button className="mt-5" variant="outline" onClick={() => setDone(false)}>
          Submit another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-lg border border-border p-6">
      <div className="space-y-2">
        <Label htmlFor="fb-title">Summary *</Label>
        <Input
          id="fb-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. ZIP download fails for Shopify product pages"
          required
          minLength={3}
          maxLength={140}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fb-email">Your name or email (optional)</Label>
        <Input
          id="fb-email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="so we can follow up"
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fb-details">Details</Label>
        <Textarea
          id="fb-details"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="What did you do, what happened, and what did you expect? Include the URL if relevant."
          maxLength={4000}
          className="min-h-32"
        />
      </div>

      {storageUnavailable ? (
        <p className="rounded-md border border-border p-3 text-xs opacity-80">
          Feedback storage is not configured on this deployment (no R2 bucket). Raise it in the team
          channel instead.
        </p>
      ) : null}

      <Button type="submit" disabled={busy || title.trim().length < 3}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Submit
      </Button>
    </form>
  );
}
