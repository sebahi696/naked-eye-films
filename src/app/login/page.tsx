"use client";
export const dynamic = "force-dynamic";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendOTP() {
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
    const formatted = phone.startsWith("+") ? phone : `+${phone}`;
    const { error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-1">Naked Eye Films</h1>
        <p className="text-[#666] text-sm mb-8">Production Pipeline</p>

        {step === "phone" ? (
          <div className="space-y-4">
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
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              onClick={sendOTP}
              disabled={loading || !phone}
              className="w-full bg-[#e8c84a] text-black font-semibold py-3 rounded-lg text-sm disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-[#aaa]">Enter the code sent to {phone}</p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="6-digit code"
              maxLength={6}
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
            <button onClick={() => setStep("phone")} className="w-full text-[#666] text-sm">
              Change number
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

