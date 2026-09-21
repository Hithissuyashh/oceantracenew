import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, ImageUp, Loader2, RotateCcw } from "lucide-react";
import { Panel, SectionTitle, StatusBadge } from "@/components/Common/primitives";
import { predictSpill, type SpillPrediction } from "@/lib/ingest.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ingest")({
  head: () => ({
    meta: [
      { title: "Imagery Ingestion — OceanTrace Spill Prediction" },
      {
        name: "description",
        content:
          "Upload a SAR, satellite or aerial image of a suspected marine oil spill and run the OceanTrace detection model for a severity and confidence assessment.",
      },
      { property: "og:title", content: "Imagery Ingestion — OceanTrace" },
      {
        property: "og:description",
        content: "Upload sea-surface imagery and let the OceanTrace model predict oil slick presence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Ingest,
});

const STAGES = [
  "Decoding scene & normalising backscatter",
  "Speckle filtering / land masking",
  "Running segmentation inference",
  "Look-alike discrimination",
  "Scoring severity & confidence",
];

function Ingest() {
  const run = useServerFn(predictSpill);
  const [image, setImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpillPrediction | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!busy) return;
    const id = setInterval(
      () => setStage((s) => Math.min(s + 1, STAGES.length - 1)),
      1400,
    );
    return () => clearInterval(id);
  }, [busy]);

  function readFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("That file is not an image. Upload a JPG, PNG or WebP scene.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Scene is larger than 8 MB. Downsample it before ingesting.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError(null);
      setResult(null);
      setFileName(file.name);
      setImage(String(reader.result));
    };
    reader.readAsDataURL(file);
  }

  async function analyse() {
    if (!image) return;
    setBusy(true);
    setStage(0);
    setError(null);
    setResult(null);
    try {
      const r = await run({ data: { imageDataUrl: image, notes: notes || undefined } });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setImage(null);
    setFileName("");
    setNotes("");
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        kicker="Ingestion"
        title="Imagery Ingestion Pipeline"
        description="Upload a sea-surface scene — SAR, optical satellite or aerial — and the detection model returns a slick verdict, severity band and confidence."
        right={
          <StatusBadge
            status={busy ? "PENDING" : result ? "COMPLETE" : "OPERATIONAL"}
          />
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Panel title="Scene Upload" subtitle={fileName || "No scene ingested"}>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) readFile(f);
            }}
            className="neu-in flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-2xl p-4"
          >
            {image ? (
              <img
                src={image}
                alt="Uploaded sea-surface scene under analysis"
                className="max-h-[420px] w-full rounded-xl object-contain"
              />
            ) : (
              <>
                <span className="neu flex h-14 w-14 items-center justify-center rounded-full">
                  <ImageUp className="h-5 w-5 text-cyan" />
                </span>
                <p className="text-sm text-foreground/80">
                  Drop a scene here, or browse your files
                </p>
                <p className="num text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  JPG · PNG · WebP · max 8 MB
                </p>
              </>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readFile(f);
              }}
            />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="neu rounded-full px-4 py-2 num text-[10px] tracking-[0.16em] uppercase text-foreground/85"
              >
                {image ? "Replace scene" : "Select scene"}
              </button>
              {image && (
                <button
                  type="button"
                  onClick={reset}
                  className="neu inline-flex items-center gap-1.5 rounded-full px-4 py-2 num text-[10px] tracking-[0.16em] uppercase text-muted-foreground"
                >
                  <RotateCcw className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
          </div>

          <label className="mt-4 block">
            <span className="label-xs">Analyst notes (optional)</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Sentinel-1 IW scene, Gulf of Oman, 18 km/h wind"
              className="neu-in mt-2 w-full rounded-full bg-transparent px-4 py-2.5 text-[13px] outline-none placeholder:text-muted-foreground/60"
            />
          </label>

          <button
            type="button"
            disabled={!image || busy}
            onClick={analyse}
            className={cn(
              "neu mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full py-3 num text-[11px] tracking-[0.18em] uppercase transition-all",
              !image || busy ? "text-muted-foreground/60" : "text-cyan",
            )}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            {busy ? "Running inference" : "Run detection model"}
          </button>

          {error && (
            <p className="mt-3 flex items-start gap-2 text-[12.5px] text-oil">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {error}
            </p>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Pipeline">
            <ul className="space-y-2">
              {STAGES.map((s, i) => {
                const done = result ? true : busy && i < stage;
                const active = busy && i === stage;
                return (
                  <li
                    key={s}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-[12.5px] transition-all",
                      done
                        ? "text-foreground/85 neu-in"
                        : active
                          ? "text-cyan neu-in"
                          : "text-muted-foreground/50",
                    )}
                  >
                    <span className="num w-8 text-[10px]">
                      {done ? "[✓]" : active ? "[•••]" : "[  ]"}
                    </span>
                    <span className="min-w-0 flex-1">{s}</span>
                    {done && <CheckCircle2 className="h-3.5 w-3.5 text-ok" />}
                  </li>
                );
              })}
            </ul>
          </Panel>

          <Panel title="Model Prediction">
            {!result ? (
              <p className="text-[12.5px] text-muted-foreground">
                Ingest a scene to generate a prediction. Results include slick
                verdict, severity band, confidence and look-alike risk.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="neu-in rounded-2xl p-4">
                  <div className="label-xs">Verdict</div>
                  <div
                    className={cn(
                      "font-display mt-1 text-lg tracking-wide",
                      result.isOilSpill ? "text-oil" : "text-ok",
                    )}
                  >
                    {result.verdict}
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <div className="label-xs">Severity</div>
                      <div className="num text-sm">{result.severity}</div>
                    </div>
                    <div className="text-right">
                      <div className="label-xs">Confidence</div>
                      <div className="num text-3xl text-cyan">
                        {Math.round(result.confidence * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                <dl className="space-y-2 text-[12.5px]">
                  {[
                    ["Slick type", result.slickType],
                    [
                      "Est. area",
                      result.estimatedAreaKm2 != null
                        ? `${result.estimatedAreaKm2} km²`
                        : "—",
                    ],
                    ["Look-alike risk", result.lookAlikeRisk],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="label-xs">{k}</dt>
                      <dd className="num max-w-[60%] text-right">{v}</dd>
                    </div>
                  ))}
                </dl>

                {result.observations.length > 0 && (
                  <div>
                    <div className="label-xs">Observations</div>
                    <ul className="mt-1.5 space-y-1 text-[12.5px] text-muted-foreground">
                      {result.observations.map((o) => (
                        <li key={o}>· {o}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.recommendedActions.length > 0 && (
                  <div>
                    <div className="label-xs">Recommended actions</div>
                    <ul className="mt-1.5 space-y-1 text-[12.5px] text-muted-foreground">
                      {result.recommendedActions.map((o) => (
                        <li key={o}>→ {o}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.summary && (
                  <p className="text-[12.5px] text-foreground/80">{result.summary}</p>
                )}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
