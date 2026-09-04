"use client";

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

const PRESETS = [
  { label: "Today", value: () => addDays(0) },
  { label: "Tomorrow", value: () => addDays(1) },
  { label: "+3 days", value: () => addDays(3) },
  { label: "+1 week", value: () => addDays(7) },
];

export default function QuickDate({
  value,
  onChange,
  label = "Due",
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <div>
      <label className="block text-xs text-[#888] uppercase tracking-wide mb-1.5">{label}</label>
      <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
        {PRESETS.map((p) => {
          const v = p.value();
          const active = value === v;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => onChange(v)}
              className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium border ${
                active
                  ? "bg-[#e8c84a] text-black border-[#e8c84a]"
                  : "bg-[#141414] text-[#aaa] border-[#2a2a2a]"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#e8c84a]"
      />
    </div>
  );
}
