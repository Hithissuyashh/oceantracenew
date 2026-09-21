import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Play, X } from "lucide-react";
import { PIPELINE_STEPS } from "@/data/mock";
import { useInvestigation } from "@/state/investigation";
import { cn } from "@/lib/utils";

export function RunAnalysisButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "group inline-flex items-center gap-2 rounded-md border border-cyan/45 bg-cyan/12 px-3.5 py-2 num text-[11px] tracking-[0.16em] text-cyan uppercase transition-all hover:bg-cyan/20 glow-cyan",
          className,
        )}
      >
        <Play className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        Run Forensic Analysis
      </button>
      {open && <AnalysisOverlay onClose={() => setOpen(false)} />}
    </>
  );
}

function AnalysisOverlay({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const { activeCase, setAnalysisComplete } = useInvestigation();
  const navigate = useNavigate();
  const done = step >= PIPELINE_STEPS.length;
  const top = activeCase.candidates[0]!;

  useEffect(() => {
    if (done) {
      setAnalysisComplete(true);
      return;
    }
    const id = setTimeout(() => setStep((s) => s + 1), step < 4 ? 620 : 1050);
    return () => clearTimeout(id);
  }, [step, done, setAnalysisComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm">
      <div className="panel grid-bg w-full max-w-xl p-6 anim-fade-up">
        <div className="flex items-start justify-between">
          <div>
            <div className="label-xs text-cyan">Forensic Pipeline</div>
            <h2 className="font-display text-xl tracking-wide uppercase">
              {done ? "Analysis Complete" : "Running Investigation"}
            </h2>
            <p className="num mt-1 text-[11px] text-muted-foreground">
              CASE {activeCase.id} · {activeCase.region}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-5 space-y-2">
          {PIPELINE_STEPS.map((s, i) => {
            const complete = i < step;
            const running = i === step;
            return (
              <li
                key={s}
                className={cn(
                  "flex items-center gap-3 rounded-md border px-3 py-2 text-[12.5px] transition-all",
                  complete
                    ? "border-ok/25 bg-ok/6 text-foreground/90"
                    : running
                      ? "border-cyan/40 bg-cyan/8 text-cyan"
                      : "border-hairline text-muted-foreground/50",
                )}
              >
                <span className="num w-8 text-[11px]">
                  {complete ? "[✓]" : running ? "[•••]" : "[  ]"}
                </span>
                {s}
                {running && (
                  <span className="ml-auto h-1 w-16 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full w-1/2 bg-cyan anim-sweep" />
                  </span>
                )}
                {complete && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-ok" />}
              </li>
            );
          })}
        </ul>

        {done && (
          <div className="mt-5 rounded-md border border-cyan/35 bg-cyan/8 p-4 anim-fade-up">
            <div className="label-xs text-cyan">Analysis Complete</div>
            <p className="mt-1 text-sm text-foreground/85">
              5 candidate vessels identified from{" "}
              <span className="num">12,847</span> AIS records.
            </p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-3 border-t border-cyan/20 pt-3">
              <div>
                <div className="label-xs">Top Candidate</div>
                <div className="font-display text-lg tracking-wide">
                  {top.vessel.name}
                </div>
                <div className="num text-[11px] text-muted-foreground">
                  MMSI {top.vessel.mmsi}
                </div>
              </div>
              <div className="text-right">
                <div className="label-xs">Evidence Score</div>
                <div className="num text-3xl text-cyan">
                  {Math.round(top.attribution.overall * 100)}%
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                navigate({ to: "/attribution" });
              }}
              className="mt-4 w-full rounded-md border border-cyan/45 bg-cyan/15 py-2 num text-[11px] tracking-[0.16em] text-cyan uppercase hover:bg-cyan/25"
            >
              View Investigation Results →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
