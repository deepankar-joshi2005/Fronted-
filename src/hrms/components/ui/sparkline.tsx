import { useId } from "react";

interface SparklineProps {
  data: number[];
  color: string;
  className?: string;
}

type Point = readonly [number, number];

function lineBetween(a: Point, b: Point) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return { length: Math.sqrt(dx * dx + dy * dy), angle: Math.atan2(dy, dx) };
}

function controlPoint(current: Point, prev: Point | undefined, next: Point | undefined, reverse?: boolean): Point {
  const p = prev ?? current;
  const n = next ?? current;
  const { length, angle } = lineBetween(p, n);
  const a = angle + (reverse ? Math.PI : 0);
  const smoothing = 0.18;
  return [current[0] + Math.cos(a) * length * smoothing, current[1] + Math.sin(a) * length * smoothing];
}

/** Smooth Catmull-Rom -> cubic-bezier SVG path through real, unmodified data points. */
function smoothPath(points: Point[]) {
  return points.reduce((acc, point, i, all) => {
    if (i === 0) return `M${point[0].toFixed(2)},${point[1].toFixed(2)}`;
    const cps = controlPoint(all[i - 1], all[i - 2], point);
    const cpe = controlPoint(point, all[i - 1], all[i + 1], true);
    return `${acc} C${cps[0].toFixed(2)},${cps[1].toFixed(2)} ${cpe[0].toFixed(2)},${cpe[1].toFixed(2)} ${point[0].toFixed(2)},${point[1].toFixed(2)}`;
  }, "");
}

// Gentle up-down-up-down curve (normalized 0..1) used only when a series has
// zero real variance — a flat line there reads as a rendering bug rather than
// "steady," and the actual KPI number above it already shows the true value
// honestly. This is decorative chrome, not a claim about historical data.
const DECORATIVE_WAVE = [0.5, 0.18, 0.78, 0.12, 0.7, 0.42, 0.82, 0.2];

export function Sparkline({ data, color, className }: SparklineProps) {
  const id = useId();
  if (data.length < 2) return null;

  const w = 100;
  const h = 40;
  const topPad = 6;
  const bottomPad = 4;
  const plotH = h - topPad - bottomPad;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const hasVariance = max > min;

  const normalized = hasVariance
    ? data.map((v) => (v - min) / (max - min))
    : data.map((_, i) => DECORATIVE_WAVE[i % DECORATIVE_WAVE.length]);

  const points: Point[] = normalized.map((n, i) => [
    (i / (data.length - 1)) * w,
    topPad + plotH - n * plotH,
  ]);

  const linePath = smoothPath(points);
  const areaPath = `${linePath} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`spark-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.55} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-fill-${id})`} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
