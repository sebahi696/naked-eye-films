import { STAGE_LABELS } from "@/lib/stages";
import type { Stage } from "@/lib/database.types";

export default function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span className={`stage-${stage} text-xs font-medium px-2.5 py-1 rounded-full`}>
      {STAGE_LABELS[stage]}
    </span>
  );
}
