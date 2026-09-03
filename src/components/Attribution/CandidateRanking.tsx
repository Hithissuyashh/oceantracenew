import { AlertTriangle, Check, ChevronRight } from "lucide-react";
import { useInvestigation, useSelectedCandidate } from "@/state/investigation";
import { EvidenceBar } from "@/components/Common/primitives";
import { cn } from "@/lib/utils";

export function CandidateRanking({
  onOpenVessel,
  compact = false,
}: {
  onOpenVessel?: (id: string) => void;
  compact?: boolean;
}) {
  const { activeCase, selectedVesselId, setSelectedVesselId } = useInvestigation();

  return (
    <ul className="space-y-2">
      {activeCase.candidates.map(({ vessel, attribution }) => {
        const selected = vessel.id === selectedVesselId;
        const pct = Math.round(attribution.overall * 100);
        return (
          <li key={vessel.id}>
            <button
              onClick={() => setSelectedVesselId(vessel.id)}
              className={cn(
                "w-full rounded-md border px-3 py-2.5 text-left transition-all",
                selected
                  ? "border-cyan/50 bg-cyan/8 glow-cyan"
                  : "border-hairline bg-surface/40 hover:border-cyan/25",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "num w-7 shrink-0 text-center text-lg",
                    attribution.rank === 1 ? "text-cyan" : "text-muted-foreground",
                  )}
                >
                  {String(attribution.rank).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-foreground">
                    {vessel.name}
                  </span>
                  <span className="num block text-[10.5px] text-muted-foreground">
                    MMSI {vessel.mmsi} · {vessel.type}
                  </span>
                </span>
                <span className="text-right">
                  <span
                    className={cn(
                      "num block text-lg",
                      pct >= 80 ? "text-cyan" : pct >= 60 ? "text-amber" : "text-muted-foreground",
                    )}
                  >
                    {pct}%
                  </span>
                  <span className="label-xs">Evidence</span>
                </span>
                {onOpenVessel && (
                  <ChevronRight
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenVessel(vessel.id);
                    }}
                    className="h-4 w-4 shrink-0 text-muted-foreground hover:text-cyan"
                  />
                )}
              </div>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-1000",
                    pct >= 80 ? "bg-cyan" : pct >= 60 ? "bg-amber" : "bg-oil",
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {selected && !compact && (
                <div className="mt-3 grid gap-2.5 border-t border-cyan/20 pt-3 sm:grid-cols-2">
                  {attribution.factors.map((f, i) => (
                    <EvidenceBar
                      key={f.key}
                      label={f.label}
                      score={f.score}
                      delay={i * 90}
                    />
                  ))}
                </div>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function EvidenceExplorer() {
  const { vessel, attribution } = useSelectedCandidate();
  return (
    <div className="space-y-4">
      <div>
        <div className="label-xs text-cyan">Why this vessel?</div>
        <div className="font-display mt-1 text-lg tracking-wide">{vessel.name}</div>
      </div>
      <ul className="space-y-1.5">
        {attribution.findings.map((f) => (
          <li
            key={f.text}
            className={cn(
              "flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-[12.5px]",
              f.kind === "match"
                ? "border-ok/25 bg-ok/6 text-foreground/90"
                : "border-amber/30 bg-amber/8 text-amber",
            )}
          >
            {f.kind === "match" ? (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />
            ) : (
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            )}
            {f.text}
          </li>
        ))}
      </ul>

      <div className="rounded-md border border-cyan/35 bg-cyan/8 p-3">
        <div className="label-xs text-cyan">Attribution Assessment</div>
        <div className="font-display mt-1 text-base tracking-wide text-cyan uppercase">
          {attribution.assessment}
        </div>
        <div className="num mt-2 text-[10.5px] leading-relaxed text-muted-foreground">
          This ranking represents forensic correlation and does not establish legal
          responsibility.
        </div>
      </div>
    </div>
  );
}
