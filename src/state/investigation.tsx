import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PRIMARY_CASE } from "@/data/mock";
import type { Case, LayerKey } from "@/data/types";

export const LAYER_DEFS: { key: LayerKey; label: string }[] = [
  { key: "satellite", label: "Satellite Observation" },
  { key: "detection", label: "Oil Spill Detection" },
  { key: "geometry", label: "Spill Geometry" },
  { key: "hindcast", label: "Hindcast Paths" },
  { key: "origin", label: "Origin Probability" },
  { key: "forecast", label: "Forecast Region" },
  { key: "ais", label: "AIS Traffic" },
  { key: "candidates", label: "Candidate Vessels" },
];

type Layers = Record<LayerKey, boolean>;

const DEFAULT_LAYERS: Layers = {
  satellite: true,
  detection: true,
  geometry: true,
  hindcast: true,
  origin: true,
  forecast: true,
  ais: true,
  candidates: true,
};

interface Ctx {
  activeCase: Case;
  caseId: string;
  setCaseId: (id: string) => void;
  layers: Layers;
  toggleLayer: (k: LayerKey) => void;
  setAllLayers: (v: boolean) => void;
  selectedVesselId: string;
  setSelectedVesselId: (id: string) => void;
  activeEventId: string | null;
  setActiveEventId: (id: string | null) => void;
  driftHour: number; // -24 .. +24
  setDriftHour: (h: number) => void;
  timeRange: "24H" | "7D" | "30D" | "CUSTOM";
  setTimeRange: (r: Ctx["timeRange"]) => void;
  analysisComplete: boolean;
  setAnalysisComplete: (v: boolean) => void;
}

const InvestigationContext = createContext<Ctx | null>(null);

export function InvestigationProvider({ children }: { children: ReactNode }) {
  const [caseId, setCaseId] = useState(PRIMARY_CASE.id);
  const [layers, setLayers] = useState<Layers>(DEFAULT_LAYERS);
  const [selectedVesselId, setSelectedVesselId] = useState("v1");
  const [activeEventId, setActiveEventId] = useState<string | null>("t4");
  const [driftHour, setDriftHour] = useState(0);
  const [timeRange, setTimeRange] = useState<Ctx["timeRange"]>("24H");
  const [analysisComplete, setAnalysisComplete] = useState(false);

  const toggleLayer = useCallback((k: LayerKey) => {
    setLayers((p) => ({ ...p, [k]: !p[k] }));
  }, []);

  const setAllLayers = useCallback((v: boolean) => {
    setLayers(
      LAYER_DEFS.reduce((acc, l) => ({ ...acc, [l.key]: v }), {} as Layers),
    );
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      // Swap PRIMARY_CASE for an API-loaded case keyed by caseId later.
      activeCase: PRIMARY_CASE,
      caseId,
      setCaseId,
      layers,
      toggleLayer,
      setAllLayers,
      selectedVesselId,
      setSelectedVesselId,
      activeEventId,
      setActiveEventId,
      driftHour,
      setDriftHour,
      timeRange,
      setTimeRange,
      analysisComplete,
      setAnalysisComplete,
    }),
    [
      caseId,
      layers,
      toggleLayer,
      setAllLayers,
      selectedVesselId,
      activeEventId,
      driftHour,
      timeRange,
      analysisComplete,
    ],
  );

  return (
    <InvestigationContext.Provider value={value}>
      {children}
    </InvestigationContext.Provider>
  );
}

export function useInvestigation() {
  const ctx = useContext(InvestigationContext);
  if (!ctx)
    throw new Error("useInvestigation must be used inside InvestigationProvider");
  return ctx;
}

export function useSelectedCandidate() {
  const { activeCase, selectedVesselId } = useInvestigation();
  return (
    activeCase.candidates.find((c) => c.vessel.id === selectedVesselId) ??
    activeCase.candidates[0]!
  );
}
