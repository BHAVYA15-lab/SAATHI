import React from "react";
import { ChevronLeft } from "lucide-react";

interface ScoreBarProps {
  label: string;
  value: number;
  color: string;
}

export const ScoreBar: React.FC<ScoreBarProps> = ({ label, value, color }) => {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-[11px] mb-1 text-grey font-medium">
        <span>{label}</span>
        <span className="st-mono">{value}</span>
      </div>
      <div className="st-bar">
        <div style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
};

interface PillProps {
  children: React.ReactNode;
  tone?: "indigo" | "saffron" | "teal" | "coral";
}

export const Pill: React.FC<PillProps> = ({ children, tone = "indigo" }) => {
  const map = {
    indigo: { bg: "var(--indigo)", fg: "#fff" },
    saffron: { bg: "var(--saffron-l)", fg: "#8a5417" },
    teal: { bg: "var(--teal-l)", fg: "#125e58" },
    coral: { bg: "var(--coral-l)", fg: "#8f291d" },
  };
  const s = map[tone] || map.indigo;
  return (
    <span
      className="st-mono text-[11px] px-2 py-0.5 rounded-full font-semibold inline-block"
      style={{ background: s.bg, color: s.fg }}
    >
      {children}
    </span>
  );
};

interface ScreenHeaderProps {
  eyebrow?: string;
  title: string;
  sub?: string;
  onBack?: () => void;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  eyebrow,
  title,
  sub,
  onBack,
}) => {
  return (
    <div className="mb-4">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-0.5 text-xs mb-3 text-grey hover:text-indigo transition-colors"
        >
          <ChevronLeft size={14} /> Back
        </button>
      )}
      {eyebrow && (
        <div className="st-mono text-[11px] mb-1 text-saffron font-bold">
          {eyebrow}
        </div>
      )}
      <h2 className="st-display text-xl font-bold mb-1 leading-tight text-ink">{title}</h2>
      {sub && <p className="text-xs text-grey mt-1 leading-relaxed">{sub}</p>}
    </div>
  );
};

export const SaarthiLogo: React.FC<{ size?: number }> = ({ size = 28 }) => {
  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Mother silhouette (Blue) */}
        <path
          d="M44 26c3.3 0 6-2.7 6-6s-2.7-6-6-6-6 2.7-6 6 2.7 6 6 6z"
          fill="#2563EB"
        />
        <path
          d="M26 50c0-12 10-22 22-22 4 0 8 1 11.5 3 1.5.8 2 2.5 1 4s-2.5 2-4 1c-2.5-1.5-5.5-2-8.5-2-12 0-22 10-22 22 0 5 1.5 10 4.5 14 .8 1 .8 2.5 0 3.5s-2.5.8-3.5 0c-4.5-5-7.5-11.5-7.5-17.5z"
          fill="#2563EB"
        />
        {/* Baby silhouette (Pink/Rose) */}
        <path
          d="M58 48c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z"
          fill="#EC4899"
        />
        <path
          d="M48 64c-1.5 0-3-.5-4.5-1.5-1.5-.8-2-2.5-1.2-4 .8-1.5 2.5-2 4-1.2 1 .5 2.2.7 3.7.7 5.5 0 10-4.5 10-10 0-1.5-.2-2.7-.7-3.7-.8-1.5-.3-3.2 1.2-4s3.2-.3 4 1.2c1 2 1.5 4.5 1.5 6.5 0 10-8 18-18 18z"
          fill="#EC4899"
        />
        {/* Embracing arms forming outer heart contour */}
        <path
          d="M50 86C28 68 18 50 18 32c0-11 9-20 20-20 7 0 11.5 4 12 5.5.5-1.5 5-5.5 12-5.5 11 0 20 9 20 20 0 18-10 36-32 54z"
          stroke="#2563EB"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="4 3"
          opacity="0.15"
        />
      </svg>
    </div>
  );
};

