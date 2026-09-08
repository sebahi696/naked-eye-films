"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import NavBar from "@/components/NavBar";

/**
 * Designer/editor already talk in WhatsApp groups with the client.
 * This screen is only for blockers that need Hussein's answer —
 * not a second chat, not CRM data entry.
 */
export default function AskPage() {
  const router = useRouter();
  const [brand, setBrand] = useState("");
  const [message, setMessage] = useState("");
  const [kind, setKind] = useState<"question" | "need_script" | "reminder">("question");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError("Write the question in one line");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await api("/api/pings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          brand: brand.trim() || null,
          message: message.trim(),
        }),
      });
      setDone(true);
      setMessage("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not send");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 md:pb-8 pt-6">
      <button type="button" onClick={() => router.back()} className="text-[#666] text-sm mb-4">
        ← Back
      </button>

      <h1 className="text-xl font-semibold mb-1">Ask Hussein</h1>
      <p className="text-[#666] text-sm mb-6">
        Keep client chat in WhatsApp. Use this only when you&apos;re blocked and need his answer —
        it lands in his Inbox so he can reply in one tap.
      </p>

      {done ? (
        <div className="bg-[#1a2e1a] border border-[#2a4a2a] rounded-xl p-5 text-center">
          <p className="text-[#5bbf6b] font-medium mb-1">Sent to his Inbox</p>
          <p className="text-[#666] text-sm mb-4">He&apos;ll see it when he opens the app. No chasing.</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDone(false)}
              className="flex-1 border border-[#2a2a2a] text-[#aaa] py-3 rounded-xl text-sm"
            >
              Ask another
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="flex-1 bg-[#e8c84a] text-black font-semibold py-3 rounded-xl text-sm"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: "question" as const, label: "Question" },
                { id: "need_script" as const, label: "Need script" },
                { id: "reminder" as const, label: "Nudge" },
              ]
            ).map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                className={`py-3 rounded-xl text-xs font-semibold border ${
                  kind === k.id
                    ? "bg-[#e8c84a] text-black border-[#e8c84a]"
                    : "bg-[#141414] text-[#aaa] border-[#2a2a2a]"
                }`}
              >
                {k.label}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">
              Brand (optional)
            </label>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="If helpful — e.g. Pepsi"
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3.5 text-white text-base focus:outline-none focus:border-[#e8c84a]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">
              What do you need?
            </label>
            <textarea
              required
              autoFocus
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="One clear question. Example: Which logo version for the end card?"
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-base resize-none focus:outline-none focus:border-[#e8c84a]"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#e8c84a] text-black font-semibold py-4 rounded-xl text-base disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send to Inbox"}
          </button>
        </form>
      )}

      <NavBar />
    </div>
  );
}
