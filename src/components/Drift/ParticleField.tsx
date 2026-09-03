import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Canvas Lagrangian-style particle field.
 * direction: -1 = hindcast (backward in time), +1 = forecast.
 */
export function ParticleField({
  direction,
  className,
  intensity = 240,
}: {
  direction: -1 | 1;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const origin = () =>
      direction === 1
        ? { x: w * 0.22, y: h * 0.62 }
        : { x: w * 0.78, y: h * 0.38 };

    type P = { x: number; y: number; vx: number; vy: number; life: number; max: number };
    const spawn = (): P => {
      const o = origin();
      const max = 120 + Math.random() * 140;
      return {
        x: o.x + (Math.random() - 0.5) * w * 0.1,
        y: o.y + (Math.random() - 0.5) * h * 0.12,
        vx: direction * (0.55 + Math.random() * 0.6),
        vy: -direction * (0.16 + Math.random() * 0.3),
        life: Math.random() * max,
        max,
      };
    };
    const parts: P[] = Array.from({ length: intensity }, spawn);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const color = direction === 1 ? "130, 220, 245" : "245, 195, 105";
      for (const p of parts) {
        const px = p.x;
        const py = p.y;
        const t = p.life / p.max;
        p.x += p.vx + Math.sin((p.y + p.life) * 0.014) * 0.35;
        p.y += p.vy + Math.cos((p.x + p.life) * 0.01) * 0.3;
        p.life += 1;
        if (p.life > p.max || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
          Object.assign(p, spawn(), { life: 0 });
          continue;
        }
        const a = Math.sin(t * Math.PI) * 0.7;
        ctx.strokeStyle = `rgba(${color}, ${a})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [direction, intensity]);

  return <canvas ref={ref} className={cn("h-full w-full", className)} />;
}

export function VectorField({ bearing, label }: { bearing: number; label: string }) {
  const cells = Array.from({ length: 60 });
  return (
    <div className="relative overflow-hidden rounded-md border border-hairline bg-ocean-deep p-3">
      <div className="grid grid-cols-10 gap-2">
        {cells.map((_, i) => (
          <span
            key={i}
            className="flex h-5 items-center justify-center text-cyan/60"
            style={{
              transform: `rotate(${bearing + Math.sin(i * 0.7) * 12}deg)`,
              opacity: 0.35 + ((i * 13) % 40) / 100,
            }}
          >
            <svg viewBox="0 0 12 20" className="h-4 w-3">
              <path d="M6 20 V4 M6 0 L11 8 H1 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </span>
        ))}
      </div>
      <div className="num mt-2 text-[10px] tracking-widest text-muted-foreground uppercase">
        {label}
      </div>
    </div>
  );
}
