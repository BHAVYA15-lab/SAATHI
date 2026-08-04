import React from "react";
import { Check, Navigation2 } from "lucide-react";

interface RouteRailProps {
  railStep: number;
  emergency: boolean;
}

const RAIL_STEPS = ["Account", "Symptom", "Advice", "Hospital", "Booking", "Done"];

export const RouteRail: React.FC<RouteRailProps> = ({ railStep, emergency }) => {
  const total = RAIL_STEPS.length;
  
  return (
    <div className="hidden md:flex flex-col items-center w-16 shrink-0 relative pt-8 h-[480px]">
      <svg width="24" height="440" viewBox="0 0 24 440" className="absolute top-8">
        <path
          d="M12 0 C 24 60, 0 100, 12 160 S 24 260, 12 320 S 0 400, 12 440"
          fill="none"
          stroke="#D9DEE2"
          strokeWidth="3"
        />
      </svg>
      {RAIL_STEPS.map((s, i) => {
        const y = 8 + i * (400 / (total - 1));
        const active = i === railStep;
        const done = i < railStep;
        
        return (
          <div key={s} className="absolute flex items-center" style={{ top: y }}>
            <div
              className="rounded-full flex items-center justify-center st-fade transition-all duration-300"
              style={{
                width: active ? 30 : 16,
                height: active ? 30 : 16,
                background: done
                  ? "var(--teal)"
                  : active
                  ? emergency
                    ? "var(--coral)"
                    : "var(--saffron)"
                  : "#fff",
                border: `2px solid ${
                  done
                    ? "var(--teal)"
                    : active
                    ? emergency
                      ? "var(--coral)"
                      : "var(--saffron)"
                    : "#C9D0D6"
                }`,
                marginLeft: -1,
              }}
              title={s}
            >
              {done && <Check size={10} color="#fff" strokeWidth={3} />}
              {active && <Navigation2 size={14} color="#fff" strokeWidth={2.5} />}
            </div>
          </div>
        );
      })}
    </div>
  );
};
