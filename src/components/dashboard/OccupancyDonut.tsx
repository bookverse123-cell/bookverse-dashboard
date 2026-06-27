"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

export function OccupancyDonut({
  label,
  occupied,
  total,
  delay = 0,
}: {
  label: string;
  occupied: number;
  total: number;
  delay?: number;
}) {
  const available = Math.max(total - occupied, 0);
  const data = [
    { name: "Occupied", value: occupied },
    { name: "Available", value: available },
  ];
  const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="rounded-2xl border border-ink-line/10 bg-white/60 p-5"
    >
      <p className="font-display text-lg text-ink-text">{label}</p>
      <div className="relative mt-2 h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius="68%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="none"
              animationDuration={900}
            >
              <Cell fill="#C56B52" />
              <Cell fill="#E9E2D2" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl text-ink-text">{pct}%</span>
          <span className="text-xs text-ink-text/50">occupied</span>
        </div>
      </div>
      <p className="mt-2 text-center text-sm text-ink-text/50">
        {occupied} of {total} seats filled
      </p>
    </motion.div>
  );
}
