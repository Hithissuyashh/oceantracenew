import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  imageDataUrl: z.string().startsWith("data:image/"),
  notes: z.string().max(500).optional(),
});

export interface SpillPrediction {
  isOilSpill: boolean;
  verdict: string;
  confidence: number; // 0..1
  severity: "LOW" | "MODERATE" | "SEVERE" | "UNKNOWN";
  estimatedAreaKm2: number | null;
  slickType: string;
  lookAlikeRisk: string;
  observations: string[];
  recommendedActions: string[];
  summary: string;
}

const SYSTEM = `You are OCEANTRACE's marine oil-spill detection model. You analyse SAR scenes,
aerial photos and satellite optical imagery of the sea surface. Judge whether an oil slick is
present, how severe it is, and which look-alikes (low-wind zones, biogenic films, algal blooms,
cloud shadow, ship wakes) could explain the signature.
Reply ONLY with JSON matching:
{"isOilSpill":boolean,"verdict":string,"confidence":number(0-1),"severity":"LOW"|"MODERATE"|"SEVERE"|"UNKNOWN",
"estimatedAreaKm2":number|null,"slickType":string,"lookAlikeRisk":string,
"observations":string[],"recommendedActions":string[],"summary":string}`;

export const predictSpill = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<SpillPrediction> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured for this project.");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyse this maritime scene for hydrocarbon pollution.${
                  data.notes ? ` Analyst notes: ${data.notes}` : ""
                }`,
              },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (res.status === 429)
        throw new Error("Rate limit reached — wait a moment and re-run the analysis.");
      if (res.status === 402)
        throw new Error("AI credits exhausted. Add credits in Lovable to keep analysing scenes.");
      throw new Error(`Model request failed (${res.status}). ${body.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = json.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    let parsed: Partial<SpillPrediction>;
    try {
      parsed = JSON.parse(cleaned) as Partial<SpillPrediction>;
    } catch {
      throw new Error("The model returned an unreadable response. Try again.");
    }

    return {
      isOilSpill: Boolean(parsed.isOilSpill),
      verdict: parsed.verdict ?? (parsed.isOilSpill ? "Oil slick detected" : "No slick detected"),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? 0))),
      severity: (parsed.severity ?? "UNKNOWN") as SpillPrediction["severity"],
      estimatedAreaKm2:
        typeof parsed.estimatedAreaKm2 === "number" ? parsed.estimatedAreaKm2 : null,
      slickType: parsed.slickType ?? "Indeterminate",
      lookAlikeRisk: parsed.lookAlikeRisk ?? "Not assessed",
      observations: Array.isArray(parsed.observations) ? parsed.observations : [],
      recommendedActions: Array.isArray(parsed.recommendedActions)
        ? parsed.recommendedActions
        : [],
      summary: parsed.summary ?? "",
    };
  });
