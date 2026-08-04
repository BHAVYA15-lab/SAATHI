import { useState } from "react";
import { HeartPulse, Stethoscope, ShieldCheck } from "lucide-react";
import { AuthProvider } from "./context/AuthContext";
import { PatientApp } from "./views/PatientApp";
import { DoctorDashboard } from "./views/DoctorDashboard";
import { HospitalCommand } from "./views/HospitalCommand";
import { SaarthiLogo } from "./components/SmallUi";

export default function App() {
  const [mode, setMode] = useState<"patient" | "doctor" | "hospital">("patient");

  const tabs = [
    { id: "patient" as const, label: "Patient Portal", icon: HeartPulse },
    { id: "doctor" as const, label: "Doctor Console", icon: Stethoscope },
    { id: "hospital" as const, label: "Admin BI Command", icon: ShieldCheck },
  ];

  return (
    <AuthProvider>
      <div className="st-root min-h-screen w-full flex flex-col bg-cloud text-ink selection:bg-teal selection:text-cloud">
        {/* Modern Glassmorphic SaaS Header Navbar */}
        <header className="sticky top-0 z-40 w-full bg-cloud/80 backdrop-blur-md border-b border-mist px-6 py-3.5 flex items-center justify-between flex-wrap gap-y-3">
          <div className="flex items-center gap-3">
            <SaarthiLogo size={32} />
            <div className="flex flex-col">
              <span className="st-display text-xl font-extrabold text-ink tracking-tight leading-none">Saathi</span>
              <span className="text-[9px] text-grey font-semibold mt-0.5">AI Health Platform</span>
            </div>
            <span className="hidden sm:inline-block st-mono text-[9px] font-bold text-teal bg-teal-light/10 border border-teal/20 px-2 py-0.5 rounded-md ml-2">
              HEALTH AI OS v1.0
            </span>
          </div>

          {/* Mode Switcher Tabs in Navbar */}
          <nav className="flex p-1 bg-slate-100 border border-slate-200 rounded-xl shadow-inner gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = mode === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setMode(t.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                    active 
                      ? "bg-white text-blue-600 shadow-sm border border-slate-200" 
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                  }`}
                >
                  <Icon size={13} className={active ? "text-blue-600" : "text-slate-400"} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>
        </header>

        {/* Main Workspace Portal Container */}
        <main className="flex-1 w-full flex flex-col">
          {mode === "patient" && <PatientApp />}
          {mode === "doctor" && <DoctorDashboard />}
          {mode === "hospital" && <HospitalCommand />}
        </main>
      </div>
    </AuthProvider>
  );
}
