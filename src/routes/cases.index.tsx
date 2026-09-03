import { createFileRoute, Link } from "@tanstack/react-router";
import { ACTIVE_CASES } from "@/data/mock";
import { Panel, SectionTitle, StatusBadge } from "@/components/Common/primitives";
import { RunAnalysisButton } from "@/components/Dashboard/AnalysisRunner";

export const Route = createFileRoute("/cases/")({
  head: () => ({
    meta: [
      { title: "Active Cases — OceanTrace Investigations" },
      {
        name: "description",
        content:
          "All open marine oil spill investigations with slick area, priority and top forensic evidence score.",
      },
      { property: "og:title", content: "Active Cases — OceanTrace" },
      {
        property: "og:description",
        content: "Open oil spill investigations tracked across Indian Ocean sectors.",
      },
    ],
  }),
  component: ActiveCases,
});

function ActiveCases() {
  return (
    <div className="space-y-5">
      <SectionTitle
        kicker="Investigations"
        title="Active Cases"
        description="Open investigations currently under forensic correlation."
        right={<RunAnalysisButton />}
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {ACTIVE_CASES.map((c) => (
          <Link
            key={c.id}
            to="/cases/$caseId"
            params={{ caseId: c.id }}
            className="panel group p-4 transition-colors hover:border-cyan/40"
          >
            <div className="flex items-center justify-between">
              <span className="num text-[12px] text-cyan">{c.id}</span>
              <StatusBadge status={c.priority} />
            </div>
            <div className="font-display mt-2 text-lg tracking-wide uppercase">
              {c.region}
            </div>
            <div className="num mt-1 text-[10.5px] text-muted-foreground">
              Observed {new Date(c.observedAt).toUTCString().slice(5, 22)} UTC
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-hairline pt-3">
              <div>
                <div className="label-xs">Slick Area</div>
                <div className="num text-base text-oil">{c.areaKm2} km²</div>
              </div>
              <div>
                <div className="label-xs">Top Score</div>
                <div className="num text-base text-cyan">
                  {Math.round(c.topScore * 100)}%
                </div>
              </div>
            </div>
            <div className="mt-3 text-[11.5px] text-muted-foreground">
              {c.candidates} candidates · lead {c.topVessel}
            </div>
          </Link>
        ))}
      </div>

      <Panel title="Queue Notes">
        <p className="text-[12.5px] text-muted-foreground">
          Cases escalate to HIGH priority when slick area exceeds 8 km² or the top
          evidence score exceeds 0.80. Attribution outputs are advisory correlations and
          require corroboration before any enforcement action.
        </p>
      </Panel>
    </div>
  );
}
