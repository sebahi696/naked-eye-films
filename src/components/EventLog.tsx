import type { JobEvent } from "@/lib/database.types";
import { STAGE_LABELS } from "@/lib/stages";

export default function EventLog({ events }: { events: JobEvent[] }) {
  if (!events.length) return <p className="text-[#666] text-sm">No activity yet.</p>;

  return (
    <ol className="space-y-3">
      {events.map((e) => (
        <li key={e.id} className="flex gap-3 text-sm">
          <span className="text-[#444] text-xs mt-0.5 shrink-0 w-20">
            {new Date(e.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            <br />
            {new Date(e.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
          </span>
          <div>
            <span className="text-[#aaa]">{e.actor_name}</span>
            <span className="text-[#666]"> moved to </span>
            <span className="text-white">{STAGE_LABELS[e.stage_to]}</span>
            {e.note && <p className="text-[#888] mt-0.5">{e.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
