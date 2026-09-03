"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendEmailOTP() {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
    setStep("otp");
  }

  async function sendPhoneOTP() {
    setLoading(true);
    setError("");
    const formatted = phone.startsWith("+") ? phone : `+${phone}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setStep("otp");
  }

  async function verifyOTP() {
    setLoading(true);
    setError("");
    if (mode === "email") {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: otp,
        type: "email",
      });
      setLoading(false);
      if (error) { setError(error.message); return; }
    } else {
      const formatted = phone.startsWith("+") ? phone : `+${phone}`;
      const { error } = await supabase.auth.verifyOtp({
        phone: formatted,
        token: otp,
        type: "sms",
      });
      setLoading(false);
      if (error) { setError(error.message); return; }
    }
    router.push("/setup");
    router.refresh();
  }

  const contact = mode === "email" ? email : phone;

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-1">Naked Eye Films</h1>
        <p className="text-[#666] text-sm mb-8">Production Pipeline</p>

        {step === "input" ? (
          <div className="space-y-4">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setMode("email")}
                className={`flex-1 py-2 text-xs rounded-lg border ${mode === "email" ? "border-[#e8c84a] text-[#e8c84a]" : "border-[#2a2a2a] text-[#666]"}`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setMode("phone")}
                className={`flex-1 py-2 text-xs rounded-lg border ${mode === "phone" ? "border-[#e8c84a] text-[#e8c84a]" : "border-[#2a2a2a] text-[#666]"}`}
              >
                Phone
              </button>
            </div>

            {mode === "email" ? (
              <div>
                <label className="text-xs text-[#666] uppercase tracking-wide block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e8c84a]"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs text-[#666] uppercase tracking-wide block mb-1">Phone number</label>
                <input
                  type="tel"
                  placeholder="+964 7xx xxx xxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e8c84a]"
                />
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={mode === "email" ? sendEmailOTP : sendPhoneOTP}
              disabled={loading || (mode === "email" ? !email : !phone)}
              className="w-full bg-[#e8c84a] text-black font-semibold py-3 rounded-lg text-sm disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send login code"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[#aaa]">
              Enter the code sent to {contact}
              {sent && mode === "email" && " — check your inbox (and spam)"}
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              maxLength={8}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-sm text-center tracking-widest focus:outline-none focus:border-[#e8c84a]"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={verifyOTP}
              disabled={loading || otp.length < 6}
              className="w-full bg-[#e8c84a] text-black font-semibold py-3 rounded-lg text-sm disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Verify"}
            </button>
            <button
              onClick={() => { setStep("input"); setOtp(""); setError(""); }}
              className="w-full text-[#666] text-sm"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
