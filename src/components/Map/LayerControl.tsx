import { Layers as LayersIcon } from "lucide-react";
import { LAYER_DEFS, useInvestigation } from "@/state/investigation";
import { cn } from "@/lib/utils";

export function LayerControl({ compact = false }: { compact?: boolean }) {
  const { layers, toggleLayer, setAllLayers } = useInvestigation();
  return (
    <div
      className={cn(
        "panel w-56 p-3",
        compact && "w-52",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <LayersIcon className="h-3.5 w-3.5 text-cyan" />
          <span className="label-xs text-foreground/80">Layers</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setAllLayers(true)}
            className="num text-[10px] tracking-wider text-muted-foreground uppercase hover:text-cyan"
          >
            All
          </button>
          <span className="text-[10px] text-hairline">/</span>
          <button
            onClick={() => setAllLayers(false)}
            className="num text-[10px] tracking-wider text-muted-foreground uppercase hover:text-cyan"
          >
            None
          </button>
        </div>
      </div>
      <ul className="mt-2.5 space-y-0.5">
        {LAYER_DEFS.map((l) => {
          const on = layers[l.key];
          return (
            <li key={l.key}>
              <button
                onClick={() => toggleLayer(l.key)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-1.5 py-1 text-left text-[11px] transition-colors",
                  on
                    ? "text-foreground/90 hover:bg-cyan/8"
                    : "text-muted-foreground/60 hover:bg-muted/50",
                )}
              >
                <span
                  className={cn(
                    "flex h-3 w-3 shrink-0 items-center justify-center rounded-[2px] border text-[8px]",
                    on
                      ? "border-cyan bg-cyan/25 text-cyan"
                      : "border-hairline text-transparent",
                  )}
                >
                  ✓
                </span>
                {l.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
