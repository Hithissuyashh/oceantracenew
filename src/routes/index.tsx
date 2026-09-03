import { lazy, Suspense, useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import {
  ArrowRight,
  Anchor,
  Github,
  ImageUp,
  Radar,
  Satellite,
  ShieldCheck,
  Waves,
  Menu,
  X,
} from "lucide-react";
import emblem from "@/assets/oceantrace-emblem.asset.json";
import { cn } from "@/lib/utils";

const LiquidChrome = lazy(() => import("@/components/Landing/LiquidChrome"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OceanTrace — Maritime Oil Spill Forensic Intelligence" },
      {
        name: "description",
        content:
          "OceanTrace fuses satellite SAR detection, Lagrangian drift hindcasting and AIS traffic forensics into ranked, explainable vessel attribution for maritime oil spills.",
      },
      { property: "og:title", content: "OceanTrace — Spill Forensics from Orbit to Offender" },
      {
        property: "og:description",
        content:
          "From a slick on the sea surface to a named vessel: detection, drift reconstruction and explainable attribution in one console.",
      },
    ],
  }),
  component: Landing,
});

const NAV = [
  { label: "Capabilities", href: "#capabilities" },
  { label: "Pipeline", href: "#pipeline" },
  { label: "Evidence", href: "#evidence" },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4">
      <nav
        className={cn(
          "silk flex w-full max-w-5xl items-center justify-between rounded-full px-3 py-2 transition-all duration-500",
          scrolled ? "shadow-[var(--neu-raised)] backdrop-blur-xl" : "shadow-none",
        )}
      >
        <Link to="/" className="flex items-center gap-2.5 pl-1">
          <span className="neu flex h-9 w-9 items-center justify-center rounded-full p-1">
            <img src={emblem.url} alt="OceanTrace emblem" className="h-full w-full object-contain" />
          </span>
          <span className="font-display text-[13px] tracking-[0.28em] text-foreground">
            OCEANTRACE
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="num rounded-full px-3.5 py-2 text-[10px] tracking-[0.18em] text-muted-foreground uppercase transition-all hover:text-foreground hover:shadow-[var(--neu-raised)]"
            >
              {n.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/overview"
            className="neu num hidden rounded-full px-4 py-2.5 text-[10px] tracking-[0.18em] text-cyan uppercase transition-all hover:text-foreground active:shadow-[var(--neu-pressed)] sm:block"
          >
            Launch console
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle navigation"
            className="neu rounded-full p-2.5 text-muted-foreground md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="silk absolute top-20 right-4 left-4 rounded-3xl p-3 shadow-[var(--neu-raised)] md:hidden">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="num block rounded-xl px-4 py-3 text-[11px] tracking-[0.18em] text-muted-foreground uppercase"
            >
              {n.label}
            </a>
          ))}
          <Link
            to="/overview"
            className="num neu-press mt-1 block rounded-xl px-4 py-3 text-[11px] tracking-[0.18em] text-cyan uppercase"
          >
            Launch console
          </Link>
        </div>
      )}
    </header>
  );
}

const CAPABILITIES = [
  {
    icon: Satellite,
    title: "SAR slick detection",
    body: "Sentinel-1 C-band backscatter is segmented into dark-formation polygons, scored against look-alikes and ranked by detection confidence.",
    metric: "94% detection confidence",
  },
  {
    icon: Waves,
    title: "Lagrangian drift hindcast",
    body: "Thousands of virtual particles are reversed through wind, current and Stokes drift fields to reconstruct a probable release window and origin.",
    metric: "18–24 h release window",
  },
  {
    icon: Radar,
    title: "AIS traffic forensics",
    body: "Every transponder track intersecting the origin envelope is replayed, gap-analysed and filtered through a multi-stage funnel.",
    metric: "247 → 5 vessels",
  },
  {
    icon: Anchor,
    title: "Explainable attribution",
    body: "Five weighted evidence factors produce a transparent score per vessel — no black box, every point traceable to a source.",
    metric: "0.89 top evidence score",
  },
  {
    icon: ImageUp,
    title: "Imagery ingestion",
    body: "Drop any sea-surface frame into the pipeline and get a verdict, severity band, look-alike risk and recommended analyst actions.",
    metric: "Model-assisted triage",
  },
  {
    icon: ShieldCheck,
    title: "Court-ready dossiers",
    body: "Each case compiles into a chain-of-custody record: observation metadata, model provenance, and per-factor justification.",
    metric: "Audit-traceable",
  },
];

const PIPELINE = [
  { step: "01", title: "Observe", body: "Satellite pass ingested, geo-referenced and denoised." },
  { step: "02", title: "Detect", body: "Slick polygon extracted with confidence and area estimate." },
  { step: "03", title: "Reconstruct", body: "Reverse drift resolves the probable origin envelope." },
  { step: "04", title: "Correlate", body: "AIS tracks intersected with the space-time origin window." },
  { step: "05", title: "Attribute", body: "Weighted evidence factors rank the suspect vessels." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <ClientOnly fallback={<div className="h-full w-full bg-background" />}>
            <Suspense fallback={<div className="h-full w-full bg-background" />}>
              <LiquidChrome
                baseColor={[0.1, 0.1, 0.1]}
                speed={0.21}
                amplitude={0.43}
                interactive={false}
              />
            </Suspense>
          </ClientOnly>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,transparent,var(--background)_88%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-[linear-gradient(to_top,var(--background),transparent)]" />
        </div>

        <div className="mx-auto w-full max-w-5xl px-6 pt-32 pb-24 text-center">
          <span className="silk num inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] tracking-[0.22em] text-muted-foreground uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan anim-blink" />
            Arabian Sea watch · live
          </span>

          <h1 className="mt-7 font-display text-5xl leading-[0.95] font-semibold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            From a slick on the sea
            <br />
            <span className="font-serif italic text-cyan">to the vessel that left it.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl font-body text-[15px] leading-relaxed text-muted-foreground">
            OceanTrace is a maritime oil spill forensic intelligence platform. It fuses satellite SAR
            detection, reverse drift modelling and AIS traffic analysis into a ranked, explainable
            attribution — evidence an investigator can actually defend.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/overview"
              className="neu group num flex items-center gap-2 rounded-full px-6 py-3.5 text-[11px] tracking-[0.2em] text-cyan uppercase transition-all hover:text-foreground active:shadow-[var(--neu-pressed)]"
            >
              Enter command console
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/ingest"
              className="num rounded-full px-6 py-3.5 text-[11px] tracking-[0.2em] text-muted-foreground uppercase transition-all hover:text-foreground hover:shadow-[var(--neu-raised)]"
            >
              Analyse an image
            </Link>
          </div>

          <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["12.4", "km² slick"],
              ["247", "vessels swept"],
              ["5", "candidates"],
              ["0.89", "top score"],
            ].map(([v, k]) => (
              <div key={k} className="silk rounded-2xl px-4 py-4">
                <dt className="num text-2xl text-foreground">{v}</dt>
                <dd className="label-xs mt-1">{k}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section id="capabilities" className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <div className="label-xs">Capabilities</div>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Six instruments, one chain of reasoning
          </h2>
          <p className="mt-4 font-body text-[15px] text-muted-foreground">
            Every module hands its output — with uncertainty attached — to the next. Nothing in the
            final verdict appears without a traceable upstream source.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map(({ icon: Icon, title, body, metric }) => (
            <article
              key={title}
              className="silk group rounded-3xl p-6 transition-all duration-300 hover:shadow-[var(--neu-raised-lg)]"
            >
              <span className="neu inline-flex rounded-2xl p-3 text-cyan">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-5 font-display text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 font-body text-[13.5px] leading-relaxed text-muted-foreground">
                {body}
              </p>
              <div className="num mt-5 text-[10px] tracking-[0.18em] text-cyan uppercase">
                {metric}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* PIPELINE */}
      <section id="pipeline" className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="label-xs">Forensic pipeline</div>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Observation to attribution in five stages
        </h2>

        <ol className="mt-12 grid gap-4 lg:grid-cols-5">
          {PIPELINE.map((p, i) => (
            <li key={p.step} className="relative">
              <div className="silk h-full rounded-3xl p-5">
                <div className="num text-[11px] tracking-[0.2em] text-cyan">{p.step}</div>
                <div className="mt-3 font-display text-base font-semibold text-foreground">
                  {p.title}
                </div>
                <p className="mt-2 font-body text-[13px] leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
              {i < PIPELINE.length - 1 && (
                <span className="pointer-events-none absolute top-1/2 -right-2 hidden h-px w-4 bg-hairline lg:block" />
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* EVIDENCE */}
      <section id="evidence" className="mx-auto max-w-6xl px-6 py-24">
        <div className="silk grid gap-10 rounded-[2.5rem] p-8 sm:p-12 lg:grid-cols-2">
          <div>
            <div className="label-xs">Explainable evidence</div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">
              Every point of the score, justified
            </h2>
            <p className="mt-4 font-body text-[14.5px] leading-relaxed text-muted-foreground">
              Attribution is not a probability pulled from a model's hidden layer. Each candidate
              vessel accumulates weight across five inspectable factors, and analysts can override
              any of them with a recorded rationale.
            </p>
            <Link
              to="/attribution"
              className="neu num mt-8 inline-flex items-center gap-2 rounded-full px-5 py-3 text-[10px] tracking-[0.2em] text-cyan uppercase"
            >
              See a live dossier <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {[
              ["Spatial proximity", 0.92],
              ["Temporal overlap", 0.87],
              ["AIS gap behaviour", 0.81],
              ["Vessel type & cargo", 0.74],
              ["Historical record", 0.63],
            ].map(([label, v]) => (
              <div key={label as string}>
                <div className="flex items-baseline justify-between">
                  <span className="label-xs">{label}</span>
                  <span className="num text-[12px] text-foreground/90">
                    {(v as number).toFixed(2)}
                  </span>
                </div>
                <div className="neu-in mt-2 h-2 w-full rounded-full">
                  <div
                    className="h-full rounded-full bg-cyan/70"
                    style={{ width: `${(v as number) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-24 text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          The ocean keeps the record. We read it.
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-body text-[15px] text-muted-foreground">
          Open the console and walk an active Arabian Sea investigation end to end.
        </p>
        <Link
          to="/overview"
          className="neu num mt-8 inline-flex items-center gap-2 rounded-full px-7 py-4 text-[11px] tracking-[0.2em] text-cyan uppercase active:shadow-[var(--neu-pressed)]"
        >
          Launch OceanTrace <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="relative mt-10 overflow-hidden rounded-t-[2.5rem] border-t border-white/10 bg-white/[0.045] backdrop-blur-2xl backdrop-saturate-150 shadow-[0_-24px_60px_-30px_var(--neu-shadow)]">
      {/* glass highlights */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[70%] -translate-x-1/2 rounded-full bg-cyan/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-0 h-56 w-72 rounded-full bg-amber/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-10">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="neu flex h-9 w-9 items-center justify-center rounded-full p-1">
                <img src={emblem.url} alt="" className="h-full w-full object-contain" />
              </span>
              <span className="font-display text-[13px] tracking-[0.28em] text-foreground">
                OCEANTRACE
              </span>
            </div>
            <p className="mt-4 max-w-xs font-body text-[13px] leading-relaxed text-muted-foreground">
              Maritime oil spill forensic intelligence. Synthetic demonstration data — not for
              operational navigation or enforcement use.
            </p>
          </div>

          {[
            {
              title: "Platform",
              links: [
                ["Command overview", "/overview"],
                ["Imagery ingestion", "/ingest"],
                ["Drift intelligence", "/drift"],
              ] as const,
            },
            {
              title: "Forensics",
              links: [
                ["Satellite detection", "/detection"],
                ["AIS intelligence", "/ais"],
                ["Vessel attribution", "/attribution"],
              ] as const,
            },
            {
              title: "System",
              links: [
                ["Data sources", "/sources"],
                ["Model performance", "/model"],
                ["Settings", "/settings"],
              ] as const,
            },
          ].map((col) => (
            <div key={col.title}>
              <div className="label-xs">{col.title}</div>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, to]) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="font-body text-[13px] text-muted-foreground transition-colors hover:text-cyan"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-hairline/60 pt-6 sm:flex-row">
          <span className="num text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
            © {new Date().getFullYear()} OceanTrace · All telemetry synthetic
          </span>
          <div className="flex items-center gap-3">
            <span className="num text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
              Status: operational
            </span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub"
              className="neu rounded-full p-2.5 text-muted-foreground transition-colors hover:text-cyan"
            >
              <Github className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none font-display text-6xl leading-[0.8] font-bold tracking-tighter text-foreground/[0.035] sm:text-8xl lg:text-9xl"
      >
        OCEANTRACE
      </div>
    </footer>
  );
}
