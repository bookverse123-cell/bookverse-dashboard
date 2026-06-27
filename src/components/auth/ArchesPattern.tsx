"use client";

import { motion } from "framer-motion";

const ARCH_COUNT = 5;

export function ArchesPattern() {
  return (
    <svg
      viewBox="0 0 480 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-md"
      aria-hidden
    >
      {/* baseline */}
      <motion.line
        x1="0"
        y1="170"
        x2="480"
        y2="170"
        stroke="#D4A857"
        strokeOpacity="0.25"
        strokeWidth="1"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {Array.from({ length: ARCH_COUNT }).map((_, i) => {
        const w = 80;
        const x = i * w + 20;
        return (
          <motion.g
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.2 + i * 0.12,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* arch: two vertical posts + semicircle top */}
            <path
              d={`M ${x} 170 V ${170 - 60} A ${w / 2 - 8} ${w / 2 - 8} 0 0 1 ${x + (w - 16)} ${170 - 60} V 170`}
              stroke={i === 2 ? "#D4A857" : "#F7F2E7"}
              strokeOpacity={i === 2 ? 0.9 : 0.18}
              strokeWidth={i === 2 ? 2 : 1.2}
            />
            {/* keystone glow on the centre arch */}
            {i === 2 && (
              <motion.circle
                cx={x + (w - 16) / 2}
                cy={170 - 60 - (w / 2 - 8)}
                r="3"
                fill="#D4A857"
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [1, 1.4, 1],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </motion.g>
        );
      })}
    </svg>
  );
}
