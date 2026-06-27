"use client";

import { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SeatStatus, MembershipPlan } from "@/lib/demo-data";
import { SeatDetailPanel } from "./SeatDetailPanel";

// ─── constants ────────────────────────────────────────────────────────────────
const S  = 3.2;   // seat size
const GAP = 4.8;  // seat stride (size + gap)

// ─── color helpers ────────────────────────────────────────────────────────────
function seatColor(seat: SeatStatus) {
  // Empty / no member — gray
  if (seat.occupancy_status === "available")
    return { fill: "#B4B2A9", glow: "rgba(180,178,169,0.3)" };
  // Overdue / expired — red
  if (seat.occupancy_status === "expired")
    return { fill: "#C0392B", glow: "rgba(192,57,43,0.55)" };
  // Membership expiring within 3 days — yellow
  if (seat.days_until_expiry !== null && seat.days_until_expiry <= 3)
    return { fill: "#D4A857", glow: "rgba(212,168,87,0.55)" };
  // Actively occupied, valid — green
  return { fill: "#27AE60", glow: "rgba(39,174,96,0.4)" };
}

function seatLabel(seat: SeatStatus) {
  if (seat.occupancy_status === "available") return "Available";
  if (seat.occupancy_status === "expired")   return "Overdue";
  if (seat.days_until_expiry !== null && seat.days_until_expiry <= 3)
    return `Renew in ${seat.days_until_expiry}d`;
  return "Occupied";
}

// ─── seat position generators ─────────────────────────────────────────────────
/**
 * Reading Hall — L-shape:
 *   Top bar  : 10 cols × 6 rows = 60 seats  (x: 5→53, y: 7→37)
 *   Right bar:  5 cols × 8 rows = 40 seats  (x: 67→87, y: 44→83)
 *   Total = 100
 */
function generateReadingHallPositions() {
  const positions: { col: number; row: number; x: number; y: number }[] = [];

  // Top bar: 10 cols × 4 rows = 40 seats (col-major so seats fill vertically)
  const topStartX = 5;
  const topStartY = 7;
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 4; row++) {
      positions.push({
        col,
        row,
        x: topStartX + col * GAP,
        y: topStartY + row * GAP,
      });
    }
  }

  // Right bar: 20 cols × 3 rows = 60 seats (row-major: 3 horizontal rows stacked vertically)
 const rightStartX = 68;
  const rightStartY = 7;
  for (let row = 0; row < 15; row++) {
    for (let col = 0; col < 4; col++) {
      positions.push({
        col: 10 + col,
        row: 4 + row,
        x: rightStartX + col * GAP,
        y: rightStartY + row * GAP,
      });
    }
  }
 
  return positions.reverse();
}

/**
 * Premium Lounge — 4 cols × 5 rows = 20 seats (x: 6→22, y: 52→70)
 */
function generateLoungePositions() {
  const positions: { col: number; row: number; x: number; y: number }[] = [];
  const startX = 3;
  const startY = 42;
  for (let col = 0; col < 10; col++) {
    for (let row = 0; row < 2; row++) {
      positions.push({
        col,
        row,
        x: startX + col * GAP,
        y: startY + row * GAP,
      });
    }
  }
  return positions.reverse();
}

const READING_POSITIONS = generateReadingHallPositions();
const LOUNGE_POSITIONS  = generateLoungePositions();

// ─── tooltip state ─────────────────────────────────────────────────────────────
interface TooltipState {
  seat: SeatStatus;
  svgX: number;
  svgY: number;
}

// ─── main component ────────────────────────────────────────────────────────────
export function FloorPlan({
  seats,
  plans,
}: {
  seats: SeatStatus[];
  plans: MembershipPlan[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tooltip, setTooltip]       = useState<TooltipState | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const selectedSeat = useMemo(
    () => seats.find((s) => s.seat_id === selectedId) ?? null,
    [seats, selectedId],
  );

  // Assign positions to seats by zone order
  const readingSeats = seats.filter((s) => s.zone === "library");
  const loungeSeats  = seats.filter((s) => s.zone === "lounge");

  const seatsWithPos = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    readingSeats.forEach((s, i) => {
      const p = READING_POSITIONS[i];
      if (p) map.set(s.seat_id, { x: p.x, y: p.y });
    });
    loungeSeats.forEach((s, i) => {
      const p = LOUNGE_POSITIONS[i];
      if (p) map.set(s.seat_id, { x: p.x, y: p.y });
    });
    return map;
  }, [readingSeats, loungeSeats]);

  function handleHover(seat: SeatStatus | null, svgX = 0, svgY = 0) {
    setTooltip(seat ? { seat, svgX, svgY } : null);
  }

  return (
    <div className="relative select-none">
      <div className="rounded-2xl border border-ink-line/10 bg-white/50 p-2 sm:p-6">
        <Legend />
        <svg
          ref={svgRef}
          viewBox="0 0 100 96"
          className="w-full"
          style={{ minHeight: 500 }}
        >
          {/* ── Reading Hall top bar ─────────────────────────── */}
          <ZoneRect x={1} y={2} w={62} h={28} label="READING HALL " labelPos="inside-top" />
        
          {/* ── Reading Hall right bar ───────────────────────── */}
          <ZoneRect x={63} y={2} w={35} h={80} label="READING HALL" labelPos="inside-top" />
          {/* <Bookshelf x={64}  y={3}  w={33} h={2} />
          <Bookshelf x={93}  y={3}  w={2}  h={90} vertical /> */}
          {/* vertical label */}
          <text
            x={96} y={50}
            fontSize="1.8" fill="#8C96AC"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
            letterSpacing="0.12em"
            transform="rotate(90 96 50)"
          >
            READING HALL
          </text>

          {/* ── Premium Lounge ───────────────────────────────── */}
          <ZoneRect x={1} y={31} w={61} h={28} label="PREMIUM LOUNGE" labelPos="inside-top" accent />
          {/* decorative arches */}
          <ArchesRow x={54} y={32} w={58} count={3} archSize={9} />

          {/* ── Café Seating ─────────────────────────────────── */}
          <ZoneRect x={1} y={60} w={61} h={15} label="CAFÉ SEATING" labelPos="center" />
   

          {/* ── Washroom ─────────────────────────────────────── */}
          <ZoneRect x={1} y={76} w={14} h={6} label="WASHROOM" labelPos="center" />

          {/* ── Café Kitchen ─────────────────────────────────── */}
          <ZoneRect x={16} y={76} w={24} h={6} label="CAFÉ KITCHEN" labelPos="center" />

          {/* ── Reception ────────────────────────────────────── */}
          <ZoneRect x={41} y={76} w={21} h={6} label="RECEPTION" labelPos="center" />
          {/* reception desk */}


          {/* ── Seats ────────────────────────────────────────── */}
          {[...readingSeats, ...loungeSeats].map((seat) => {
            const pos = seatsWithPos.get(seat.seat_id);
            if (!pos) return null;
            return (
              <SeatMarker
                key={seat.seat_id}
                seat={seat}
                x={pos.x}
                y={pos.y}
                isSelected={seat.seat_id === selectedId}
                onSelect={() =>
                  setSelectedId((prev) =>
                    prev === seat.seat_id ? null : seat.seat_id,
                  )
                }
                onHover={handleHover}
              />
            );
          })}
        </svg>
      </div>

      {/* ── Tooltip ──────────────────────────────────────────── */}
      <AnimatePresence>
        {tooltip && (
          <SeatTooltip
            seat={tooltip.seat}
            svgX={tooltip.svgX}
            svgY={tooltip.svgY}
            svgRef={svgRef}
          />
        )}
      </AnimatePresence>

      {/* ── Detail panel ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedSeat && (
          <SeatDetailPanel
            seat={selectedSeat}
            plans={plans}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── SeatMarker ───────────────────────────────────────────────────────────────
function SeatMarker({
  seat,
  x,
  y,
  isSelected,
  onSelect,
  onHover,
}: {
  seat: SeatStatus;
  x: number;
  y: number;
  isSelected: boolean;
  onSelect: () => void;
  onHover: (seat: SeatStatus | null, svgX?: number, svgY?: number) => void;
}) {
  const { fill, glow } = seatColor(seat);
  const pulse =
    seat.occupancy_status === "expired" ||
    (seat.days_until_expiry !== null &&
      seat.days_until_expiry <= 3 &&
      seat.days_until_expiry >= 0);

  return (
    <motion.g
      onClick={onSelect}
      onMouseEnter={() => onHover(seat, x, y)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: "pointer", transformBox: "fill-box", transformOrigin: "center" }}
      whileHover={{ scale: 1.25 }}
      animate={
        pulse
          ? {
              filter: [
                `drop-shadow(0 0 0px ${glow})`,
                `drop-shadow(0 0 2.5px ${glow})`,
                `drop-shadow(0 0 0px ${glow})`,
              ],
            }
          : {}
      }
      transition={
        pulse
          ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.12 }
      }
    >
      <rect
        x={x}
        y={y}
        width={S}
        height={S}
        rx={0.7}
        fill={fill}
        stroke={isSelected ? "#10192B" : "transparent"}
        strokeWidth={isSelected ? 0.5 : 0}
      />
      {/* selection ring */}
      {isSelected && (
        <rect
          x={x - 0.8}
          y={y - 0.8}
          width={S + 1.6}
          height={S + 1.6}
          rx={1.2}
          fill="none"
          stroke="#10192B"
          strokeWidth={0.3}
          strokeDasharray="1 0.8"
        />
      )}
    </motion.g>
  );
}

// ─── SeatTooltip ──────────────────────────────────────────────────────────────
function SeatTooltip({
  seat,
  svgX,
  svgY,
  svgRef,
}: {
  seat: SeatStatus;
  svgX: number;
  svgY: number;
  svgRef: React.RefObject<SVGSVGElement | null>;
}) {
  const { fill } = seatColor(seat);
  const label = seatLabel(seat);

  // Convert SVG coords → % so tooltip stays relative to the SVG container.
  // Tooltip always renders ABOVE the seat; caret points down.
  const viewBoxW = 100;
  const viewBoxH = 96;
  const leftPct = ((svgX + S / 2) / viewBoxW) * 100;
  // Position at the top edge of the seat, then pull the tooltip up via transform
  const topPct  = (svgY / viewBoxH) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.14, ease: "easeOut" }}
      className="pointer-events-none absolute z-50"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        // Always sit above: shift left by 50% of own width, shift up by full height + caret (8px)
        transform: "translate(-50%, calc(-100% - 8px))",
      }}
    >

      <div
        style={{
          background: "#10192B",
          borderRadius: 8,
          padding: "8px 12px",
          minWidth: 136,
          boxShadow: "0 8px 24px rgba(0,0,0,0.28), 0 1px 4px rgba(0,0,0,0.14)",
        }}
      >
        {/* seat code + status dot */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: fill,
              flexShrink: 0,
              boxShadow: `0 0 5px ${fill}`,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              color: "#F4F1E8",
              letterSpacing: "0.08em",
            }}
          >
            {seat.seat_code}
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              color: fill,
              fontWeight: 500,
              letterSpacing: "0.04em",
            }}
          >
            {label}
          </span>
        </div>

        {/* divider */}
        <div style={{ height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 6 }} />

        {/* member name or empty */}
        <div style={{ fontSize: 11, color: "rgba(244,241,232,0.65)", lineHeight: 1.5 }}>
          {seat.full_name ? (
            <>
              <div style={{ color: "#F4F1E8", fontWeight: 500 }}>{seat.full_name}</div>
              {seat.days_until_expiry !== null && (
                <div style={{ marginTop: 2 }}>
                  {seat.days_until_expiry > 0
                    ? `Expires in ${seat.days_until_expiry} day${seat.days_until_expiry !== 1 ? "s" : ""}`
                    : "Expired"}
                </div>
              )}
              <div style={{ marginTop: 2, opacity: 0.5, fontSize: 10 }}>
                {seat.zone === "lounge" ? "Premium lounge" : "Reading hall"}
              </div>
            </>
          ) : (
            <span style={{ opacity: 0.5 }}>No member assigned</span>
          )}
        </div>
      </div>

      {/* caret — always points down toward the seat */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: "6px solid transparent",
          borderRight: "6px solid transparent",
          borderTop: "6px solid #10192B",
          margin: "0 auto",
          marginTop: -1,
        }}
      />
    </motion.div>
  );
}

// ─── ZoneRect ─────────────────────────────────────────────────────────────────
function ZoneRect({
  x, y, w, h,
  label,
  labelPos = "center",
  accent = false,
}: {
  x: number; y: number; w: number; h: number;
  label: string;
  labelPos?: "center" | "inside-top";
  accent?: boolean;
}) {
  const baseColor  = accent ? "#D4A857" : "#283A5C";
  const fillOp     = accent ? 0.055 : 0.045;
  const strokeOp   = accent ? 0.3   : 0.2;

  return (
    <g>
      <rect
        x={x} y={y} width={w} height={h} rx={1}
        fill={baseColor}       fillOpacity={fillOp}
        stroke={baseColor}     strokeOpacity={strokeOp}
        strokeWidth={0.28}
      />
      <text
        x={labelPos === "inside-top" ? x + 2 : x + w / 2}
        y={labelPos === "inside-top" ? y + 3.5 : y + h / 2 + 0.7}
        fontSize="1.9"
        fontFamily="var(--font-mono)"
        letterSpacing="0.12em"
        fill="#8C96AC"
        textAnchor={labelPos === "inside-top" ? "start" : "middle"}
      >
        {label}
      </text>
    </g>
  );
}

// ─── Bookshelf ────────────────────────────────────────────────────────────────
function Bookshelf({
  x, y, w, h,
  vertical = false,
}: {
  x: number; y: number; w: number; h: number; vertical?: boolean;
}) {
  const count = vertical ? Math.floor(h / 3) : Math.floor(w / 3);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="#283A5C" opacity={0.07} />
      {Array.from({ length: count }).map((_, i) =>
        vertical ? (
          <line key={i}
            x1={x} x2={x + w} y1={y + i * 3} y2={y + i * 3}
            stroke="#283A5C" strokeOpacity={0.14} strokeWidth={0.14} />
        ) : (
          <line key={i}
            x1={x + i * 3} x2={x + i * 3} y1={y} y2={y + h}
            stroke="#283A5C" strokeOpacity={0.14} strokeWidth={0.14} />
        ),
      )}
    </g>
  );
}

// ─── ArchesRow ────────────────────────────────────────────────────────────────
function ArchesRow({
  x, y, w, count = 5, archSize = 6,
}: {
  x: number; y: number; w: number; count?: number; archSize?: number;
}) {
  return (
    <g opacity={0.32}>
      {Array.from({ length: count }).map((_, i) => {
        const ay = y + i * archSize + 1.2;
        const r  = archSize / 2 - 1.2;
        return (
          <path
            key={i}
            d={`M ${x} ${ay} H ${x + 2.5} A ${r} ${r} 0 0 1 ${x + 2.5} ${ay + r * 2} H ${x}`}
            stroke="#D4A857"
            strokeWidth={0.3}
            fill="none"
          />
        );
      })}
    </g>
  );
}

// ─── CafeTables ───────────────────────────────────────────────────────────────
function CafeTables({ x, y }: { x: number; y: number }) {
  const cols = 3, rows = 2;
  return (
    <g>
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((_, c) => (
          <g key={`${r}-${c}`}>
            <rect
              x={x + c * 9}
              y={y + r * 6}
              width={6}
              height={4}
              rx={0.8}
              fill="#283A5C"
              fillOpacity={0.1}
              stroke="#283A5C"
              strokeOpacity={0.15}
              strokeWidth={0.2}
            />
          </g>
        )),
      )}
    </g>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend() {
  const items = [
    { color: "#B4B2A9", label: "Empty" },
    { color: "#27AE60", label: "Occupied" },
    { color: "#D4A857", label: "Expiring ≤ 3 days" },
    { color: "#C0392B", label: "Overdue" },
  ];
  return (
    <div className="mb-3 flex justify-end">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl bg-ink/5 px-4 py-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-text/50">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}