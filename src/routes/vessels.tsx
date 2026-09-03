import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { VESSELS } from "@/data/mock";
import { VesselDetail } from "@/components/Attribution/VesselDetail";
import { Panel, SectionTitle, StatusBadge } from "@/components/Common/primitives";
import { useInvestigation } from "@/state/investigation";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/vessels")({
  head: () => ({
    meta: [
      { title: "Vessel Database — OceanTrace Registry" },
      {
        name: "description",
        content:
          "Registry of vessels observed in the incident region with MMSI, IMO, type, flag and last known AIS position.",
      },
      { property: "og:title", content: "Vessel Database — OceanTrace" },
      {
        property: "og:description",
        content: "Searchable registry of vessels tracked during oil spill investigations.",
      },
    ],
  }),
  component: Vessels,
});

function Vessels() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const { setSelectedVesselId } = useInvestigation();

  const rows = VESSELS.filter((v) =>
    `${v.name} ${v.mmsi} ${v.type} ${v.flag}`.toLowerCase().includes(q.toLowerCase()),
  );
  const vessel = VESSELS.find((v) => v.id === open);

  return (
    <div className="space-y-5">
      <SectionTitle
        kicker="Intelligence"
        title="Vessel Database"
        description="Registry-linked records for every vessel observed within the incident search envelope."
        right={
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by name, MMSI, flag…"
            className="w-60 rounded-md border border-hairline bg-surface/60 px-3 py-1.5 text-xs outline-none placeholder:text-muted-foreground/70 focus:border-cyan/50"
          />
        }
      />

      <Panel bodyClassName="p-0">
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-hairline">
              {["Vessel", "MMSI / IMO", "Type", "Flag", "Length", "Speed", "Last Position", ""].map(
                (h) => (
                  <th key={h} className="label-xs px-4 py-2.5 font-normal">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr
                key={v.id}
                className={cn(
                  "cursor-pointer border-b border-hairline/50 transition-colors hover:bg-cyan/6",
                )}
                onClick={() => {
                  setSelectedVesselId(v.id);
                  setOpen(v.id);
                }}
              >
                <td className="px-4 py-3 text-foreground">{v.name}</td>
                <td className="num px-4 py-3 text-muted-foreground">
                  {v.mmsi}
                  <br />
                  {v.imo}
                </td>
                <td className="px-4 py-3">
                  {v.type.includes("Tanker") ? (
                    <StatusBadge status={v.type} tone="amber" />
                  ) : (
                    <span className="text-muted-foreground">{v.type}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{v.flag}</td>
                <td className="num px-4 py-3">{v.lengthM} m</td>
                <td className="num px-4 py-3 text-cyan">{v.speedKn} kn</td>
                <td className="num px-4 py-3 text-muted-foreground">
                  {v.lastPosition.lat.toFixed(3)}° N {v.lastPosition.lon.toFixed(3)}° E
                </td>
                <td className="num px-4 py-3 text-[10px] tracking-widest text-cyan uppercase">
                  Open →
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      {vessel && <VesselDetail vessel={vessel} onClose={() => setOpen(null)} />}
    </div>
  );
}
