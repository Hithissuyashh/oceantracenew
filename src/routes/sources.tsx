import { createFileRoute } from "@tanstack/react-router";
import { DATA_SOURCES } from "@/data/mock";
import { Panel, SectionTitle, StatusBadge } from "@/components/Common/primitives";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Data Sources — OceanTrace System" },
      {
        name: "description",
        content:
          "Ingest status for SAR imagery, terrestrial and satellite AIS, ocean current models, wind reanalysis and vessel registry mirrors.",
      },
      { property: "og:title", content: "Data Sources — OceanTrace" },
      {
        property: "og:description",
        content: "Feed health and latency for every OceanTrace ingest pipeline.",
      },
    ],
  }),
  component: Sources,
});

function Sources() {
  return (
    <div className="space-y-5">
      <SectionTitle
        kicker="System"
        title="Data Sources"
        description="Ingest pipelines feeding the forensic engine. Mock adapters today, swappable for live API clients."
        right={<StatusBadge status="5 of 6 Online" tone="ok" />}
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {DATA_SOURCES.map((s) => (
          <Panel key={s.name} title={s.name} subtitle={s.provider} right={<StatusBadge status={s.status} />}>
            <dl className="space-y-2 text-[12.5px]">
              {[
                ["Latency", s.latency],
                ["Volume", s.records],
                ["Cadence", s.cadence],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-hairline/60 pb-1.5">
                  <dt className="label-xs">{k}</dt>
                  <dd className="num">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        ))}
      </div>
    </div>
  );
}
