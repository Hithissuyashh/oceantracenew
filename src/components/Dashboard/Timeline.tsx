import { useInvestigation } from "@/state/investigation";
import { cn } from "@/lib/utils";

export function InvestigationTimeline({
  orientation = "vertical",
}: {
  orientation?: "vertical" | "horizontal";
}) {
  const { activeCase, activeEventId, setActiveEventId, setSelectedVesselId } =
    useInvestigation();

  return (
    <ol
      className={cn(
        orientation === "vertical"
          ? "space-y-0"
          : "flex gap-4 overflow-x-auto pb-1",
      )}
    >
      {activeCase.timeline.map((e, i) => {
        const active = e.id === activeEventId;
        return (
          <li
            key={e.id}
            className={cn(
              orientation === "vertical" ? "relative pb-4 pl-6" : "min-w-[190px] flex-1",
            )}
          >
            {orientation === "vertical" && i < activeCase.timeline.length - 1 && (
              <span className="absolute top-4 bottom-0 left-[5.5px] w-px bg-hairline" />
            )}
            <button
              onClick={() => {
                setActiveEventId(active ? null : e.id);
                if (e.vesselId) setSelectedVesselId(e.vesselId);
              }}
              className="w-full text-left"
            >
              {orientation === "vertical" ? (
                <span
                  className={cn(
                    "absolute top-1 left-0 h-3 w-3 rounded-full border-2 transition-all",
                    active
                      ? "border-cyan bg-cyan shadow-[0_0_12px_var(--cyan)]"
                      : "border-hairline bg-background",
                  )}
                />
              ) : (
                <span
                  className={cn(
                    "mb-2 block h-[3px] w-full rounded-full transition-colors",
                    active ? "bg-cyan" : "bg-hairline",
                  )}
                />
              )}
              <div
                className={cn(
                  "num text-[11px] tracking-widest",
                  active ? "text-cyan" : "text-muted-foreground",
                )}
              >
                {e.time}
              </div>
              <div
                className={cn(
                  "mt-0.5 text-[12.5px] leading-snug transition-colors",
                  active ? "text-foreground" : "text-foreground/70",
                )}
              >
                {e.label}
              </div>
              <div
                className={cn(
                  "overflow-hidden text-[11px] leading-snug text-muted-foreground transition-all",
                  active ? "mt-1 max-h-16 opacity-100" : "max-h-0 opacity-0",
                )}
              >
                {e.detail}
              </div>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
