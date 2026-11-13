"use client";

import { useEffect, useRef, useState } from "react";
import { addMonths, format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import reference from "@/lib/data/who-growth.json";
import { dateKey, growthSeries, kidsDate } from "@/lib/kids";
import type { GrowthRecord, KidProfile } from "@/types";

type Metric = "height_cm" | "weight_kg" | "head_circumference_cm";
const metrics: { value: Metric; label: string; unit: string }[] = [
  { value: "height_cm", label: "Panjang / tinggi", unit: "cm" },
  { value: "weight_kg", label: "Berat", unit: "kg" },
  { value: "head_circumference_cm", label: "Lingkar kepala", unit: "cm" },
];
const dayValue = (date: string) => parseISO(dateKey(date)).getTime();
export function GrowthChart({
  kid,
  records,
}: {
  kid: KidProfile;
  records: GrowthRecord[];
}) {
  const [metric, setMetric] = useState<Metric>("weight_kg");
  const meta = metrics.find((m) => m.value === metric)!;
  const series = growthSeries(records, metric).filter((r) =>
    Number.isFinite(dayValue(r.date)),
  );
  const available = series.filter((r) => r.value !== null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(560);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(260, Math.round(entry.contentRect.width))));
    observer.observe(svg);
    return () => observer.disconnect();
  }, [available.length]);
  const [selected, setSelected] = useState("");
  const refs: {
    x: number;
    low: number;
    median: number;
    high: number;
    segment: string;
  }[] = [];
  let lo = available.length ? dayValue(available[0].date) : 0;
  let hi = available.length
    ? dayValue(available[available.length - 1].date)
    : 1;
  if (lo === hi) {
    lo -= 15 * 86400000;
    hi += 15 * 86400000;
  }
  if (
    kid.gender &&
    metric !== "head_circumference_cm" &&
    Number.isFinite(dayValue(kid.birth_date))
  ) {
    const sex = kid.gender === "male" ? "boys" : "girls";
    const keys =
      metric === "weight_kg"
        ? [`${sex}_wfa_0-to-5-years`]
        : [`${sex}_lhfa_0-to-2-years`, `${sex}_lhfa_2-to-5-years`];
    for (const key of keys)
      for (const [month, low, median, high] of (
        reference as Record<string, number[][]>
      )[key] ?? []) {
        const x = addMonths(parseISO(dateKey(kid.birth_date)), month).getTime();
        if (x >= lo && x <= hi)
          refs.push({ x, low, median, high, segment: key });
      }
  }
  const all = [
    ...available.map((r) => r.value!),
    ...refs.flatMap((r) => [r.low, r.high]),
  ];
  const min = all.length
    ? Math.max(0, Math.floor(Math.min(...all) * 0.95 * 10) / 10)
    : 0;
  const max = all.length
    ? Math.max(min + 1, Math.ceil(Math.max(...all) * 1.05 * 10) / 10)
    : 1;
  const W = width,
    H = 220,
    L = 48,
    R = 18,
    T = 18,
    B = 45;
  const px = (x: number) => L + ((x - lo) / (hi - lo)) * (W - L - R);
  const py = (value: number) => T + ((max - value) / (max - min)) * (H - T - B);
  const segments: string[][] = [[]];
  for (const r of series) {
    if (r.value === null) {
      if (segments[segments.length - 1].length) segments.push([]);
      continue;
    }
    segments[segments.length - 1].push(
      `${px(dayValue(r.date))},${py(r.value)}`,
    );
  }
  return (
    <section className="kids-chart" aria-label="Grafik pertumbuhan">
      <div className="kids-chart-header">
        <h3>Tren pertumbuhan</h3>
        <label className="sr-only" htmlFor="growth-metric">
          Ukuran grafik
        </label>
        <select
          id="growth-metric"
          value={metric}
          onChange={(e) => {
            setMetric(e.target.value as Metric);
            setSelected("");
          }}
        >
          {metrics.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label} ({m.unit})
            </option>
          ))}
        </select>
      </div>
      {!available.length ? (
        <p className="kids-empty">
          Belum ada catatan {meta.label.toLowerCase()}.
        </p>
      ) : (
        <>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            role="group"
            aria-label={`${meta.label} dalam ${meta.unit}, ${available.length} catatan. Nilai lengkap tersedia di riwayat.`}
            className="kids-chart-svg"
          >
            {[0, 1, 2, 3, 4].map((i) => {
              const v = min + ((max - min) * i) / 4,
                y = py(v);
              return (
                <g key={i}>
                  <line
                    x1={L}
                    x2={W - R}
                    y1={y}
                    y2={y}
                    className="kids-chart-grid"
                  />
                  <text
                    x={L - 8}
                    y={y + 4}
                    textAnchor="end"
                    className="kids-chart-label"
                  >
                    {Number(v.toFixed(1))}
                  </text>
                </g>
              );
            })}
            <text x={L} y={12} className="kids-chart-label">
              {meta.unit}
            </text>
            {[0, 0.5, 1].map((i) => (
              <text
                key={i}
                x={px(lo + (hi - lo) * i)}
                y={H - 16}
                textAnchor={i === 0 ? "start" : i === 1 ? "end" : "middle"}
                className="kids-chart-label"
              >
                {format(new Date(lo + (hi - lo) * i), "d MMM yy", {
                  locale: id,
                })}
              </text>
            ))}
            {Array.from(new Set(refs.map((r) => r.segment))).map((segment) => {
              const points = refs.filter((r) => r.segment === segment);
              return ["low", "median", "high"].map((field) => (
                <polyline
                  key={segment + field}
                  points={points
                    .map(
                      (r) =>
                        `${px(r.x)},${py(r[field as "low" | "median" | "high"])}`,
                    )
                    .join(" ")}
                  fill="none"
                  className={`kids-who-line ${field === "median" ? "is-median" : ""}`}
                  strokeDasharray={field === "median" ? undefined : "4 4"}
                />
              ));
            })}
            {segments.map((pts, i) => (
              <polyline
                key={i}
                points={pts.join(" ")}
                fill="none"
                className="kids-measured-line"
              />
            ))}
            {available.map((r) => (
              <circle
                key={r.id}
                cx={px(dayValue(r.date))}
                cy={py(r.value!)}
                r={4}
                className="kids-measured-dot"
                tabIndex={0}
                role="button"
                aria-label={`${kidsDate(r.date)}: ${r.value} ${meta.unit}`}
                onClick={() => setSelected(r.id)}
                onFocus={() => setSelected(r.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(r.id);
                  }
                }}
              >
                <title>
                  {kidsDate(r.date)}: {r.value} {meta.unit}
                </title>
              </circle>
            ))}
          </svg>
          <p className="kids-chart-value" aria-live="polite">
            {selected && available.some((r) => r.id === selected)
              ? (() => {
                  const r = available.find((r) => r.id === selected)!;
                  return `${kidsDate(r.date)} · ${r.value} ${meta.unit}`;
                })()
              : "Pilih titik untuk melihat tanggal dan nilai."}
          </p>
          <div className="kids-chart-legend">
            <span>
              <i className="is-measured" />
              Catatan {kid.name}
            </span>
            {refs.length > 0 && (
              <span>
                <i />
                WHO: −2 SD, median, +2 SD
              </span>
            )}
          </div>
          <p className="kids-chart-note">
            {refs.length > 0 ? (
              <>
                Referensi WHO 0–60 bulan sesuai jenis kelamin; panjang telentang
                sebelum 24 bulan, tinggi berdiri mulai 24 bulan.{" "}
                <a
                  href={
                    metric === "weight_kg"
                      ? "https://www.who.int/tools/child-growth-standards/standards/weight-for-age"
                      : "https://www.who.int/tools/child-growth-standards/standards/length-height-for-age"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sumber WHO
                </a>
                .
              </>
            ) : (
              "Grafik menampilkan catatan yang tersedia. Referensi panjang/tinggi dan berat WHO tersedia pada rentang usia 0–60 bulan dengan jenis kelamin terisi."
            )}
          </p>
        </>
      )}
    </section>
  );
}
