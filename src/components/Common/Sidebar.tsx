import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Anchor,
  Braces,
  Compass,
  Database,
  Gauge,
  History,
  ImageUp,
  LayoutGrid,
  PanelLeftClose,
  PanelLeftOpen,
  Radar,
  Satellite,
  Settings,
  Ship,
  Waves,
} from "lucide-react";
import { cn } from "@/lib/utils";


const NAV: {
  group: string;
  items: { to: string; label: string; icon: typeof Radar }[];
}[] = [
  {
    group: "Overview",
    items: [
      { to: "/", label: "Landing Page", icon: Compass },
      { to: "/overview", label: "Command Overview", icon: LayoutGrid },
    ],
  },
  {
    group: "Investigations",
    items: [
      { to: "/cases", label: "Active Cases", icon: Activity },
      { to: "/history", label: "Case History", icon: History },
    ],
  },
  {
    group: "Analysis",
    items: [
      { to: "/ingest", label: "Imagery Ingestion", icon: ImageUp },
      { to: "/detection", label: "Satellite Detection", icon: Satellite },
      { to: "/characterization", label: "Spill Characterization", icon: Braces },
      { to: "/drift", label: "Drift Intelligence", icon: Waves },
      { to: "/ais", label: "AIS Intelligence", icon: Radar },
      { to: "/attribution", label: "Vessel Attribution", icon: Anchor },
    ],
  },
  {
    group: "Intelligence",
    items: [
      { to: "/environment", label: "Environmental Data", icon: Compass },
      { to: "/vessels", label: "Vessel Database", icon: Ship },
    ],
  },
  {
    group: "System",
    items: [
      { to: "/sources", label: "Data Sources", icon: Database },
      { to: "/model", label: "Model Performance", icon: Gauge },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className={cn(
        "z-20 flex h-full shrink-0 flex-col bg-[var(--sidebar)] shadow-[8px_0_20px_var(--neu-shadow)] transition-[width] duration-300",
        collapsed ? "w-[64px]" : "w-[232px]",
      )}
    >
      <div className="flex items-center gap-2.5 px-4 py-4">
        <span className="neu relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white p-1">
          <img
            src="/hackappeal-mark.png"
            alt="HackAppeal"
            className="h-full w-full object-contain"
          />
        </span>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-display text-[15px] leading-none tracking-[0.22em] text-foreground">
              OCEANTRACE
            </div>
            <div className="num mt-1 text-[9px] tracking-[0.14em] text-muted-foreground uppercase">
              Forensic Intelligence
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV.map((g) => (
          <div key={g.group} className="mb-3">
            {!collapsed && (
              <div className="label-xs px-2 pb-1.5 text-muted-foreground/70">
                {g.group}
              </div>
            )}
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active =
                  it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
                const Icon = it.icon;
                return (
                  <li key={it.to}>
                    <Link
                      to={it.to}
                      title={it.label}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[12.5px] transition-all duration-200",
                        active
                          ? "neu-press text-cyan"
                          : "text-muted-foreground hover:shadow-[var(--neu-raised)] hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate">{it.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="m-3 flex items-center gap-2 rounded-xl px-3 py-2.5 text-muted-foreground shadow-[var(--neu-raised)] transition-all hover:text-cyan active:shadow-[var(--neu-pressed)]"
      >
        {collapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
        {!collapsed && (
          <span className="num text-[10px] tracking-widest uppercase">Collapse</span>
        )}
      </button>
    </aside>
  );
}
