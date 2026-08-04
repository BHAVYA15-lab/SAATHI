import React, { useState, useEffect, useMemo } from "react";
import {
  AlertTriangle, MapPin, Clock, Star, Stethoscope, ChevronRight, Check,
  CalendarDays, Phone, Sparkles, HeartPulse, Award, Building2, Pill as PillIcon,
  Package, Mic, FileText, History, User, Activity, Search,
  Bell, Settings, LogOut, Send, Bot,
  LayoutDashboard, Menu, TrendingUp, Heart, Moon, MessageSquare
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, Legend
} from "recharts";
import { useAuth } from "../context/AuthContext";
import type { PatientProfile } from "../context/AuthContext";
import { api } from "../api";
import { Pill, ScoreBar, ScreenHeader, SaarthiLogo } from "../components/SmallUi";

/* ---------------------------------- data configurations ---------------------------------- */

const SYMPTOM_CHIPS = [
  { id: "chest", label: "Chest pain", flags: [] },
  { id: "chest_sob", label: "Chest pain + can't catch breath", flags: ["emergency"] },
  { id: "joint", label: "Joint pain, mornings worse", flags: [] },
  { id: "cough", label: "Cough, 2+ weeks", flags: [] },
  { id: "fever", label: "Fever, 3 days", flags: [] },
  { id: "headache", label: "Severe headache", flags: [] },
  { id: "stroke", label: "Face drooping + slurred speech", flags: ["emergency"] },
];

const SEVERITY_OPTIONS = [
  { id: "Mild", label: "Mild discomfort", desc: "Hardly notice it unless thinking about it" },
  { id: "Moderate", label: "Moderate pain", desc: "Can perform daily duties but pain is present" },
  { id: "Severe", label: "Severe pain", desc: "Disrupts basic routines, hard to concentrate" },
];

const DURATION_OPTIONS = [
  { id: "Hours", label: "A few hours" },
  { id: "Days", label: "A few days" },
  { id: "Weeks", label: "More than 2 weeks" },
];



/* ---------------------------------- helper modules ---------------------------------- */

function next7Days() {
  const list = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const next = new Date(today);
    next.setDate(today.getDate() + i);
    const dayName = days[next.getDay()];
    const dateNum = next.getDate();
    list.push({
      key: i,
      label: i === 0 ? "Today" : `${dayName} ${dateNum}`,
      rawDate: next,
    });
  }
  return list;
}

function crowdForecast(baseWait: number) {
  const slots = [
    { key: 0, label: "TODAY", pct: 100 },
    { key: 1, label: "THU", pct: 75 },
    { key: 2, label: "FRI", pct: 85 },
    { key: 3, label: "SAT", pct: 40 },
    { key: 4, label: "SUN", pct: 20 },
    { key: 5, label: "MON", pct: 90 },
    { key: 6, label: "TUE", pct: 80 },
  ];
  return slots.map((s) => ({
    ...s,
    wait: Math.round(baseWait * (s.pct / 100)),
  }));
}

/* ---------------------------------- components ---------------------------------- */

// 1. Auth split screen
interface AuthProps {
  onSuccess: () => void;
}

const AuthScreen: React.FC<AuthProps> = ({ onSuccess }) => {
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("aditi@email.com");
  const [password, setPassword] = useState("password");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [pincode, setPincode] = useState("400050");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup({ email, password, full_name: fullName, phone, city, pincode });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Authentication failed. Check your entries.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-800 overflow-hidden">
      {/* Left side panel - Clinical HUD branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 p-12 flex-col justify-between relative border-r border-slate-200">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)]" />
        
        <div className="flex items-center gap-3 z-10">
          <SaarthiLogo size={36} />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white leading-none">Saathi</h1>
            <span className="text-[10px] font-bold text-blue-100 tracking-widest uppercase">AI Health Operating System</span>
          </div>
        </div>

        <div className="z-10 max-w-md text-white">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-white mb-4">
            <Activity size={12} className="animate-pulse" /> Active Triage Neural Engine
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight leading-tight mb-4">
            Democratizing clinical intelligence for patients and providers.
          </h2>
          <p className="text-sm text-blue-100 leading-relaxed mb-6">
            Compare outpatient wait times, forecast ICU occupancy limits, check symptoms dynamically, and secure cashless insurance authorizations.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 border border-white/15 p-3.5 rounded-xl">
              <span className="text-blue-200 text-[10px] font-bold uppercase tracking-wider block">Triaging Model</span>
              <span className="text-sm font-semibold text-white">Saathi-Clin-v1.4</span>
            </div>
            <div className="bg-white/10 border border-white/15 p-3.5 rounded-xl">
              <span className="text-blue-200 text-[10px] font-bold uppercase tracking-wider block">Decision Accuracy</span>
              <span className="text-sm font-semibold text-emerald-300 font-mono">98.4% Verified</span>
            </div>
          </div>
        </div>

        <div className="z-10 text-[11px] text-blue-200">
          © {new Date().getFullYear()} Saathi Systems Inc. All clinical datasets are simulated for recruitment evaluation.
        </div>
      </div>

      {/* Right side form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.05),transparent)]" />
        
        <div className="w-full max-w-md z-10">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <SaarthiLogo size={32} />
            <span className="text-xl font-bold tracking-tight text-slate-800">Saathi</span>
          </div>

          <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-xl">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                {isLogin ? "Sign In to Portal" : "Create Patient Profile"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isLogin ? "Enter your credentials to manage records & check symptoms." : "Sign up below for real-time diagnostic routing."}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-medium flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {!isLogin && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                    <input required className="st-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Aditi Rao" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phone Number</label>
                    <input required className="st-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9876543210" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">City</label>
                      <input required className="st-input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pincode</label>
                      <input required className="st-input" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="400050" />
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
                <input required type="email" className="st-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@email.com" />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                  {isLogin && <button type="button" className="text-[10px] font-semibold text-blue-600 hover:underline">Forgot password?</button>}
                </div>
                <input required type="password" className="st-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>

              <button type="submit" disabled={loading} className="st-btn-primary w-full rounded-xl py-3 text-sm font-bold mt-2 flex items-center justify-center gap-2">
                {loading ? "Authenticating..." : isLogin ? "Sign In" : "Register Profile"} <ChevronRight size={16} />
              </button>
            </form>

            <div className="border-t border-slate-200 my-6 pt-4 text-center">
              <span className="text-xs text-slate-500">
                {isLogin ? "First time using Saathi?" : "Already have a profile?"}
              </span>
              <button onClick={() => setIsLogin(!isLogin)} className="text-xs font-bold text-blue-600 hover:underline ml-1.5">
                {isLogin ? "Register here" : "Sign in instead"}
              </button>
            </div>

            {isLogin && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                  💡 <strong>Demo Credentials pre-seeded:</strong><br />
                  Email: <span className="st-mono text-blue-600">aditi@email.com</span> / Password: <span className="st-mono text-blue-600">password</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Who is this for Selector Screen
interface WhoForProps {
  onNext: (data: { name: string; age: string; address: string; city: string; state: string; pincode: string }) => void;
  onBack: () => void;
}

const WhoForScreen: React.FC<WhoForProps> = ({ onNext, onBack }) => {
  const [mode, setMode] = useState<"self" | "other">("self");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [address, setAddress] = useState("");
  const [city] = useState("Mumbai");
  const [state] = useState("Maharashtra");
  const [pincode, setPincode] = useState("400050");
  
  const { patientProfile } = useAuth();
  
  const proceed = () => {
    if (mode === "self" && patientProfile) {
      onNext({
        name: patientProfile.full_name,
        age: "34",
        address: "Horizon Heights, Worli",
        city: patientProfile.city || "Mumbai",
        state: "Maharashtra",
        pincode: patientProfile.pincode || "400050",
      });
    } else {
      onNext({ name, age, address, city, state, pincode });
    }
  };

  const valid = mode === "self" || (name.trim() && age.trim() && address.trim() && pincode.trim());

  return (
    <div className="p-8 st-fade flex flex-col justify-between h-full bg-white max-w-2xl mx-auto rounded-2xl border border-slate-200 shadow-lg">
      <div className="flex flex-col gap-5">
        <ScreenHeader onBack={onBack} eyebrow="STEP 1 OF 5" title="Who is this assessment for?" sub="We personalize the medical routing based on patient background details." />

        <div className="grid grid-cols-2 gap-4 my-2">
          <button onClick={() => setMode("self")} className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${mode === "self" ? "bg-blue-50/50 border-blue-500" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}>
            <User size={20} className={mode === "self" ? "text-blue-600" : "text-slate-500"} />
            <div>
              <div className="text-xs font-bold text-slate-800">For Myself</div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Use my profile details ({patientProfile?.full_name})</div>
            </div>
          </button>

          <button onClick={() => setMode("other")} className={`p-4 rounded-xl border text-left flex flex-col gap-2 transition-all cursor-pointer ${mode === "other" ? "bg-blue-50/50 border-blue-500" : "bg-slate-50 border-slate-200 hover:border-slate-300"}`}>
            <Package size={20} className={mode === "other" ? "text-blue-600" : "text-slate-500"} />
            <div>
              <div className="text-xs font-bold text-slate-800">Someone else</div>
              <div className="text-[10px] text-slate-500 mt-0.5 font-medium">Book slots or triage for family members</div>
            </div>
          </button>
        </div>

        {mode === "other" && (
          <div className="flex flex-col gap-4 st-fade bg-slate-50/55 p-4 rounded-xl border border-slate-200">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Patient Full Name</label>
                <input className="st-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rajesh Rao" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Age (Yrs)</label>
                <input type="number" className="st-input" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 64" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Pincode</label>
                <input className="st-input" value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="400050" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">City</label>
                <input className="st-input animate-pulse" value={city} disabled placeholder="Mumbai" />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Street Address</label>
              <input className="st-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. Flat 402, Sea Green Apartments" />
            </div>
          </div>
        )}
      </div>

      <button disabled={!valid} onClick={proceed} className="st-btn-primary w-full rounded-xl py-3 text-sm font-bold mt-8 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer">
        Continue <ChevronRight size={16} />
      </button>
    </div>
  );
};

// 3. Symptom Screen & Emergency Routing
interface SymptomScreenProps {
  onSubmit: (symptomResult: any) => void;
}

const SymptomScreen: React.FC<SymptomScreenProps> = ({ onSubmit }) => {
  const { patientProfile } = useAuth();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSymptomSubmit = async (symptomText: string) => {
    setLoading(true);
    try {
      const result = await api.post("/appointments/symptom-check", { text: symptomText });
      onSubmit(result);
    } catch (err) {
      console.error("Symptom check failed", err);
      // Fallback in case of server failure
      const isEmergency = REDFLAG_WORDS_LOCAL.some(w => symptomText.toLowerCase().includes(w));
      onSubmit({
        symptom_id: "custom",
        label: symptomText,
        is_emergency: isEmergency,
        routed_departments: [
          { name: "General Medicine", conf: "Likely", why: "A general physician is the right starting point to sort this out." }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const REDFLAG_WORDS_LOCAL = ["can't breathe", "cant breathe", "slurred speech", "face drooping",
  "one side numb", "severe bleeding", "unconscious", "seizure", "chest pain and sweating"];

  const handleChipClick = (label: string) => {
    setText(label);
    handleSymptomSubmit(label);
  };

  const name = patientProfile?.full_name ? patientProfile.full_name.split(" ")[0] : "there";

  return (
    <div className="p-8 st-fade flex flex-col justify-between h-full bg-white max-w-2xl mx-auto rounded-2xl border border-slate-200 shadow-lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-2">
          <SaarthiLogo size={24} />
          <span className="st-mono text-[11px] font-bold text-slate-500">SAATHI INF-CORE</span>
        </div>
        <h2 className="st-display text-2xl font-extrabold text-slate-800">Hi {name}, what symptoms are you experiencing?</h2>
        <p className="text-xs text-slate-500 -mt-2">Enter details in your own words, or choose a pre-configured chip below.</p>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 border border-slate-200 rounded-2xl bg-slate-50/50 st-fade my-4">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 w-full h-full rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin" />
              <Activity size={24} className="text-blue-500 animate-pulse" />
            </div>
            <div className="st-mono text-[11px] text-blue-600 font-extrabold animate-pulse uppercase tracking-widest mt-2">
              Executing Clinical Routing Inference...
            </div>
          </div>
        ) : (
          <>
            <div className="relative mt-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g., severe chest pain radiating to left arm with mild breathlessness..."
                rows={4}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 pr-10 text-sm font-mono placeholder:text-slate-400 text-slate-800 outline-none focus:border-blue-500 transition-all shadow-inner"
              />
              <Mic size={16} className="absolute right-4 top-4 text-slate-400 animate-pulse cursor-pointer" />
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {SYMPTOM_CHIPS.map((c) => (
                <button key={c.id} onClick={() => handleChipClick(c.label)} className="st-chip text-xs px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:border-slate-350 font-bold text-slate-700 cursor-pointer">
                  {c.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="mt-8">
        <button disabled={!text.trim() || loading} onClick={() => handleSymptomSubmit(text)} className="st-btn-primary w-full rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer shadow-md">
          {loading ? "Processing..." : "Analyze symptoms & continue"} <ChevronRight size={16} />
        </button>
        <p className="text-[10px] text-center text-slate-500 mt-3 font-semibold">Saathi AI Core performs clinical triaging only; it does not replace physician diagnoses.</p>
      </div>
    </div>
  );
};

// 4. Emergency Screening
interface EmergencyProps {
  onBack: () => void;
}

const EmergencyScreen: React.FC<EmergencyProps> = ({ onBack }) => {
  return (
    <div className="p-8 st-fade flex flex-col justify-center items-center text-center max-w-lg mx-auto bg-white rounded-2xl border border-red-200 shadow-xl min-h-[450px]">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 animate-pulse">
        <AlertTriangle size={36} className="text-red-500" />
      </div>
      
      <h2 className="st-display text-2xl font-black text-red-650 tracking-tight mb-2">Red Flag Symptom Detected</h2>
      <p className="text-xs text-slate-500 mb-6 leading-relaxed font-semibold max-w-sm">
        These parameters match severe or acute clinical conditions that require direct emergency medicine. Please do not book a routine consult.
      </p>

      <div className="w-full flex flex-col gap-3">
        <a href="tel:108" className="st-btn-primary w-full rounded-xl py-3.5 text-sm font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-red-650 to-red-700 border-red-600/20 cursor-pointer shadow-md">
          <Phone size={18} /> Call Emergency Services (108)
        </a>
        
        <div className="st-card p-4 flex items-center gap-3 border border-red-200 bg-red-50/30">
          <MapPin size={18} className="text-red-500 shrink-0" />
          <div className="text-left">
            <div className="text-xs font-bold text-red-850">Nearest Trauma ER: Apex Care Institute</div>
            <div className="text-[10px] text-slate-500 font-semibold mt-0.5">1.8 km · 24×7 Emergency · Ambulance diverts enabled</div>
          </div>
        </div>
      </div>
      
      <button onClick={onBack} className="text-xs mt-6 underline text-slate-500 font-bold hover:text-slate-800 transition-colors cursor-pointer">
        This isn't an emergency — go back
      </button>
    </div>
  );
};

// 5. Advice Consent Screen
interface ConsentProps {
  symptom: any;
  onChoice: (yes: boolean) => void;
}

const AdviceConsentScreen: React.FC<ConsentProps> = ({ symptom, onChoice }) => {
  return (
    <div className="p-8 st-fade flex flex-col justify-between h-full bg-white max-w-lg mx-auto rounded-2xl border border-slate-200 shadow-lg">
      <div className="flex flex-col gap-4">
        <ScreenHeader eyebrow="AI COGNITIVE ROUTE" title="Symptom Analysis Ready" />
        
        <div className="st-card p-5 border border-slate-200 bg-slate-50/50 flex flex-col gap-3">
          <div className="st-mono text-[9px] font-bold text-blue-600 tracking-widest">TRIAGED SYMPTOM</div>
          <p className="text-sm font-semibold text-slate-850">"{symptom?.label}"</p>
          <div className="border-t border-slate-200 my-2" />
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            To provide precise specialist recommendations, Saathi can ask 2 brief clinical questions regarding duration and intensity.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 mt-8">
        <button onClick={() => onChoice(true)} className="st-btn-primary rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-1.5 shadow-md cursor-pointer">
          <Sparkles size={14} /> Get Tailored Recommendations
        </button>
        <button onClick={() => onChoice(false)} className="st-btn-ghost rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
          Skip questions & view nearest clinics
        </button>
      </div>
    </div>
  );
};

// 6. Advice Questions Screen
interface QuestionsProps {
  onSubmit: (data: { severity: string; duration: string }) => void;
  onBack: () => void;
}

const AdviceQuestionsScreen: React.FC<QuestionsProps> = ({ onSubmit, onBack }) => {
  const [severity, setSeverity] = useState("");
  const [duration, setDuration] = useState("");

  const proceed = () => {
    if (severity && duration) {
      onSubmit({ severity, duration });
    }
  };

  return (
    <div className="p-8 st-fade flex flex-col justify-between h-full bg-white max-w-lg mx-auto rounded-2xl border border-slate-200 shadow-lg">
      <div className="flex flex-col gap-5">
        <ScreenHeader onBack={onBack} eyebrow="AI REASONING" title="Describe the intensity" sub="Select options that describe your symptom's severity and duration." />

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Severity</label>
          <div className="flex flex-col gap-2">
            {SEVERITY_OPTIONS.map((o) => (
              <button key={o.id} onClick={() => setSeverity(o.id)} className={`p-3 text-left rounded-xl border transition-all cursor-pointer ${severity === o.id ? "bg-blue-50/50 border-blue-500 text-blue-700" : "bg-slate-50 border-slate-200 hover:border-slate-350 text-slate-600"}`}>
                <div className="text-xs font-bold">{o.label}</div>
                <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">{o.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Duration</label>
          <div className="grid grid-cols-3 gap-2">
            {DURATION_OPTIONS.map((o) => (
              <button key={o.id} onClick={() => setDuration(o.id)} className={`p-2.5 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${duration === o.id ? "bg-blue-50/50 border-blue-500 text-blue-700" : "bg-slate-50 border-slate-200 hover:border-slate-355 text-slate-600"}`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button disabled={!severity || !duration} onClick={proceed} className="st-btn-primary w-full rounded-xl py-3 text-sm font-bold mt-8 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer">
        Analyze Recommendations <ChevronRight size={16} />
      </button>
    </div>
  );
};

// 7. Advice Result Screen
interface AdviceResultProps {
  symptom: any;
  answers: any;
  onPick: (dept: string) => void;
  onBack: () => void;
}

const AdviceResultScreen: React.FC<AdviceResultProps> = ({ symptom, answers, onPick, onBack }) => {
  const urgent = answers?.severity === "Severe";
  
  return (
    <div className="p-8 st-fade flex flex-col justify-between h-full bg-white max-w-lg mx-auto rounded-2xl border border-slate-200 shadow-lg">
      <div className="flex flex-col gap-4 flex-1 st-scroll overflow-y-auto pr-1">
        <ScreenHeader onBack={onBack} eyebrow="SAATHI'S ADVICE" title="Here's what fits your case" />
        
        {answers && (
          <div className={`st-card p-4 flex items-start gap-3 border ${urgent ? "bg-red-50 border-red-200 text-red-750" : "bg-teal-50 border-teal-200 text-teal-800"}`}>
            <Sparkles size={18} className={`mt-0.5 shrink-0 ${urgent ? "text-red-500" : "text-teal"}`} />
            <p className="text-xs leading-relaxed font-semibold">
              {urgent
                ? `Severe discomfort detected — this is worth getting looked at soon, not weeks from now.`
                : `${answers.severity} pain, starting ${answers.duration.toLowerCase()} — this can likely be handled as a routine visit.`}
            </p>
          </div>
        )}

        <div className="st-mono text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-4">RECOMMENDED CHANNELS &amp; DEPTS</div>
        <div className="flex flex-col gap-3">
          {symptom?.routed_departments.map((d: any, idx: number) => (
            <div key={idx} className="st-card p-4 border border-slate-200 bg-slate-50/50 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-slate-800">{d.name}</span>
                <span className={`st-mono text-[9px] px-2 py-0.5 rounded-full font-bold border ${d.conf === "Likely" ? "bg-teal-50 border-teal-200 text-teal-600" : "bg-blue-50 border-blue-200 text-blue-600"}`}>{d.conf} Match</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">{d.why}</p>
              <button onClick={() => onPick(d.name)} className="st-btn-ghost w-full py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer">
                Book in {d.name} <ChevronRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 8. Hospital Rankings Screen
interface HospitalScreenProps {
  dept: string | null;
  city: string;
  onPick: (h: any) => void;
  onBack: () => void;
}

const HospitalScreen: React.FC<HospitalScreenProps> = ({ dept, city, onPick, onBack }) => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const fetchHospitals = async () => {
      setLoading(true);
      try {
        const data = await api.get(`/hospitals/branches?city=${city}${dept ? `&dept=${dept}` : ""}`);
        setHospitals(data);
      } catch (err) {
        console.error("Failed to load hospitals", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHospitals();
  }, [dept, city]);

  return (
    <div className="p-6 st-fade flex flex-col bg-white w-full rounded-2xl border border-slate-200 shadow-xl">
      <div className="border-b border-slate-200 pb-4 mb-4">
        <ScreenHeader onBack={onBack} title={dept ? `${dept} — matched & ranked` : "Hospitals near you"}
          sub={`Matched on distance, live wait, department depth & patient ratings.`} />
      </div>
        
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Clock className="text-blue-500 animate-spin" size={28} />
          <span className="text-xs text-slate-500 font-bold">Calculating ranks...</span>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 st-scroll overflow-y-auto pb-4">
          {hospitals.map((h, i) => (
            <div key={h.id} className="st-card p-5 border border-slate-200 shadow-sm flex flex-col justify-between bg-slate-50/20 h-52">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-start gap-2 flex-wrap">
                      {i === 0 && <Pill tone="indigo">TOP MATCH</Pill>}
                      <span className="font-bold text-sm text-slate-800 leading-snug">{h.branch_name.split(",")[0]}</span>
                      <span className="st-mono text-[9px] text-blue-600 font-extrabold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg ml-2 uppercase tracking-wide">
                        {h.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] mt-2 text-slate-500 font-bold flex-wrap">
                      <span className="flex items-center gap-0.5"><MapPin size={11} />{h.distance_km} km</span>
                      <span className="flex items-center gap-0.5"><Clock size={11} />~{h.wait_min}m wait</span>
                      <span className="flex items-center gap-0.5"><Star size={11} className="fill-amber-500 text-amber-500" />{h.rating}</span>
                      <span className="font-extrabold text-blue-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{h.cost_band}</span>
                    </div>
                  </div>
                  <div className="st-mono text-base font-extrabold text-blue-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {h.score?.total || 85}
                  </div>
                </div>

                <button onClick={() => setExpanded(expanded === h.id ? null : h.id)} className="text-[10px] font-bold flex items-center gap-0.5 text-blue-600 hover:underline mt-3.5 cursor-pointer">
                  {expanded === h.id ? "Hide details" : "Why this match?"} <ChevronRight size={10} className={`transform transition-transform ${expanded === h.id ? "rotate-90" : ""}`} />
                </button>

                {expanded === h.id && h.score && (
                  <div className="mt-3 st-fade bg-slate-100 p-3 rounded-xl border border-slate-200 text-xs">
                    <p className="text-[10px] text-slate-550 mb-3 font-medium leading-relaxed">{h.why}</p>
                    <ScoreBar label={dept ? `${dept} Specialisation` : "Specialisation"} value={h.score.spec} color="var(--indigo)" />
                    <ScoreBar label="Distance fit" value={h.score.distScore} color="var(--teal)" />
                    <ScoreBar label="Outpatient queue fit" value={h.score.waitScore} color="var(--saffron)" />
                  </div>
                )}
              </div>

              <button onClick={() => onPick(h)} className="st-btn-primary w-full rounded-lg py-2 text-xs font-bold mt-4 cursor-pointer shadow-sm">
                View Profile &amp; Book Slots
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 9. Hospital detail Screen
interface HospitalDetailProps {
  hospital: any;
  dept: string | null;
  onBack: () => void;
  onNext: (dayKey: number) => void;
}

const HospitalDetailScreen: React.FC<HospitalDetailProps> = ({ hospital, dept, onBack, onNext }) => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const days = useMemo(() => next7Days(), []);
  const forecast = useMemo(() => crowdForecast(hospital.wait_min || 30), [hospital]);
  
  const best = forecast.reduce((a, b) => (b.pct < a.pct ? b : a), forecast[0]);
  const bestDay = days.find((d) => d.key === best.key);
  const todayPct = forecast[0].pct;
  const diff = todayPct > 0 ? Math.round(((todayPct - best.pct) / todayPct) * 100) : 0;
  const worthSuggesting = best.key !== 0 && diff >= 15;

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const data = await api.get(`/hospitals/branches/${hospital.id}/doctors${dept ? `?dept=${dept}` : ""}`);
        setDoctors(data);
      } catch (err) {
        console.error("Failed to load doctors", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [hospital.id, dept]);

  return (
    <div className="p-6 st-fade flex flex-col bg-white w-full rounded-2xl border border-slate-200 shadow-xl">
      <div className="border-b border-slate-200 pb-4 mb-5">
        <ScreenHeader onBack={onBack} eyebrow="HOSPITAL PROFILE" title={hospital.branch_name.split(",")[0]} />
        <div className="flex items-center gap-3 text-[10px] mt-1 text-slate-500 font-bold">
          <span className="flex items-center gap-0.5"><MapPin size={11} />{hospital.distance_km} km away ({hospital.city})</span>
          <span className="flex items-center gap-0.5"><Star size={11} className="fill-amber-500 text-amber-500" />{hospital.rating} rating</span>
          <span className="flex items-center gap-0.5"><Building2 size={11} />{hospital.years || 15} yrs running</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Hospital Summary & Crowded Hours Forecast */}
        <div className="flex flex-col gap-4">
          <div className="st-card p-4 border border-slate-200 bg-slate-50/50 text-xs">
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">{hospital.about}</p>
            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 mt-3">
              <Award size={13} /> {hospital.accreditation || "NABH accredited hospital"}
            </div>
          </div>

          <div className="st-card p-4 border border-slate-200 bg-white">
            <div className="flex items-center gap-2 mb-3 text-slate-800">
              <Activity size={14} className="text-blue-500" />
              <span className="text-xs font-bold">Live crowd index &amp; weekly forecast</span>
            </div>
            
            <div className="flex justify-between items-end h-20 px-2 mt-4">
              {forecast.map((f) => (
                <div key={f.key} className="flex flex-col items-center gap-1.5 flex-1 group relative">
                  <div className="w-full max-w-[20px] bg-slate-200 hover:bg-blue-500 transition-colors rounded-t-sm relative" style={{ height: `${f.pct * 0.6}px` }}>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 bg-slate-800 text-[8px] border border-slate-700 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-1 whitespace-nowrap z-10 shadow-lg">
                      {f.wait}m wait
                    </div>
                  </div>
                  <span className="st-mono text-[8px] font-bold text-slate-400">{f.label}</span>
                </div>
              ))}
            </div>

            {worthSuggesting && bestDay && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-[10px] leading-relaxed text-blue-800 font-semibold flex items-center gap-2">
                <Sparkles size={16} className="text-blue-600 shrink-0 animate-pulse" />
                <span>
                  💡 {bestDay.label} runs about {diff}% emptier than today. Click below to view slots for then.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Specialists / Slots Trigger */}
        <div className="flex flex-col gap-4">
          <div className="st-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">AVAILABLE SPECIALISTS</div>
          
          {loading ? (
            <div className="flex items-center justify-center p-8 bg-slate-50 border border-slate-200 rounded-xl">
              <Clock className="text-blue-500 animate-spin" size={20} />
            </div>
          ) : doctors.length > 0 ? (
            <div className="flex flex-col gap-3">
              {doctors.map((d: any) => (
                <div key={d.id} className="st-card p-3.5 flex items-center gap-3 border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <Stethoscope size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-850">{d.doctor.full_name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{d.doctor.qualification}</div>
                    <div className="text-[9px] text-blue-600 mt-1 font-extrabold">{d.doctor.specialization} specialist · {d.doctor.experience_years} yrs exp</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border border-dashed border-slate-200 bg-slate-50/55 rounded-xl text-center text-xs text-slate-400 font-medium">
              No specific {dept} specialists found. General physicians can triage.
            </div>
          )}

          <div className="flex flex-col gap-2 mt-4">
            <button onClick={() => onNext(0)} className="st-btn-primary w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer">
              See Today's Slots <CalendarDays size={14} />
            </button>
            <button onClick={() => onNext(best.key)} className="st-btn-ghost w-full py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer">
              View all dates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 10. Doctor Slots Calendar Selection
interface DateSlotProps {
  hospital: any;
  dept: string | null;
  initialDayKey: number;
  onBack: () => void;
  onConfirm: (doctorAss: any, day: any, slot: string, fee: number) => void;
}

const DateSlotScreen: React.FC<DateSlotProps> = ({ hospital, dept, initialDayKey, onBack, onConfirm }) => {
  const days = useMemo(() => next7Days(), []);
  const [dayKey, setDayKey] = useState<number>(initialDayKey);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAss, setSelectedAss] = useState<any>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  const selectedDay = days.find((d) => d.key === dayKey) || days[0];

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      setSelectedAss(null);
      setSelectedSlot(null);
      try {
        const data = await api.get(`/hospitals/branches/${hospital.id}/doctors${dept ? `?dept=${dept}` : ""}`);
        setDoctors(data);
        if (data.length > 0) {
          setSelectedAss(data[0]);
        }
      } catch (err) {
        console.error("Failed to load doctors", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, [hospital.id, dept]);

  useEffect(() => {
    if (!selectedAss) return;
    const fetchSlots = async () => {
      setSlotsLoading(true);
      setSelectedSlot(null);
      try {
        const dateStr = selectedDay.rawDate.toISOString().split("T")[0];
        const data = await api.get(`/appointments/doctors/${selectedAss.id}/slots?date=${dateStr}`);
        // filter out booked slots
        const free = data.filter((s: any) => !s.is_booked).map((s: any) => s.start_time.substring(0, 5));
        setSlots(free);
      } catch (err) {
        console.error("Failed to load slots", err);
        setSlots(["10:15 AM", "11:40 AM", "2:30 PM", "4:15 PM"]); // local seed fallback
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [selectedAss, selectedDay]);

  const confirmSelection = () => {
    if (selectedAss && selectedSlot) {
      onConfirm(selectedAss, selectedDay, selectedSlot, selectedAss.consultation_fee);
    }
  };

  return (
    <div className="p-6 st-fade flex flex-col bg-white w-full rounded-2xl border border-slate-200 shadow-xl">
      <div className="border-b border-slate-200 pb-4 mb-4">
        <ScreenHeader onBack={onBack} title="Select date and specialist" sub="Real-time calendar slot routing. Select doctor to sync availability." />
      </div>

      {/* Date Stepper Tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl overflow-x-auto st-scroll mb-6">
        {days.map((d) => (
          <button key={d.key} onClick={() => setDayKey(d.key)} className={`text-xs font-bold px-4 py-2 rounded-lg shrink-0 transition-colors cursor-pointer ${dayKey === d.key ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
            {d.key === 0 ? "Today" : d.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left list: Doctors */}
        <div className="flex flex-col gap-3">
          <div className="st-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">CHOOSE SPECIALIST</div>
          
          {loading ? (
            <div className="flex justify-center p-8"><Clock className="text-blue-500 animate-spin" size={24} /></div>
          ) : doctors.length > 0 ? (
            doctors.map((d) => {
              const isActive = selectedAss?.id === d.id;
              return (
                <button key={d.id} onClick={() => setSelectedAss(d)} className={`st-card p-4 text-left flex items-start gap-3 border transition-colors cursor-pointer ${isActive ? "bg-blue-50/50 border-blue-500" : "bg-slate-50/50 border-slate-200 hover:border-slate-300"}`}>
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <Stethoscope size={16} className={isActive ? "text-blue-600" : "text-blue-400"} />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold text-slate-800">{d.doctor.full_name}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">{d.doctor.specialization} · {d.doctor.qualification}</div>
                    <div className="text-[10px] font-bold text-blue-600 mt-2">Consultation Fee: ₹{d.consultation_fee}</div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-xs text-slate-500 italic p-4 text-center">No specialists assigned for this department.</div>
          )}
        </div>

        {/* Right list: Slots */}
        <div className="flex flex-col gap-4">
          <div className="st-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">AVAILABLE HOURS</div>
          
          {slotsLoading ? (
            <div className="flex justify-center p-8"><Clock className="text-blue-500 animate-spin" size={20} /></div>
          ) : slots.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {slots.map((s) => (
                <button key={s} onClick={() => setSelectedSlot(s)} className={`p-3 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${selectedSlot === s ? "bg-blue-50/50 border-blue-500 text-blue-700 shadow-sm" : "bg-slate-50 border-slate-200 hover:border-slate-350 text-slate-600"}`}>
                  {s}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 border border-dashed border-slate-200 bg-slate-50/55 rounded-xl text-center text-xs text-slate-500 font-medium">
              No slots available for {selectedDay.label}. Choose another specialist or day.
            </div>
          )}

          {selectedAss && selectedSlot && (
            <div className="mt-6 p-4 border border-slate-200 bg-slate-50/60 rounded-xl st-fade flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Specialist Fee</span>
                <span className="font-bold text-slate-800">₹{selectedAss.consultation_fee}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Time slot chosen</span>
                <span className="font-bold text-blue-600">{selectedDay.label} · {selectedSlot}</span>
              </div>
              
              <button onClick={confirmSelection} className="st-btn-primary w-full rounded-xl py-3 text-xs font-bold mt-4 shadow-md flex items-center justify-center gap-1.5 cursor-pointer">
                Lock Appointment <Check size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ReceiptProps {
  bookingForName: string;
  hospital: any;
  doctor: any;
  day: any;
  slot: string;
  total: number;
  onNext: () => void;
}

const ReceiptScreen: React.FC<ReceiptProps> = ({ bookingForName, hospital, doctor, day, slot, total, onNext }) => {
  return (
    <div className="p-8 st-fade flex flex-col justify-between h-full bg-white max-w-lg mx-auto rounded-2xl border border-slate-200 shadow-xl">
      <div className="flex flex-col gap-4">
        <div className="w-12 h-12 rounded-full bg-teal/10 flex items-center justify-center mb-1 animate-pulse">
          <Check size={26} className="text-teal" />
        </div>
        <h2 className="st-display text-2xl font-black text-slate-800 tracking-tight leading-none">Booking Confirmed!</h2>
        <p className="text-xs text-slate-500 -mt-1 font-semibold">Your reservation code has been sent via SMS/Email.</p>

        <div className="st-card p-4 border border-slate-200 bg-slate-50/50 text-xs flex flex-col gap-3 mt-2">
          <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
            <span className="text-slate-500 font-semibold">Patient Name</span>
            <span className="font-bold text-slate-800">{bookingForName}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
            <span className="text-slate-500 font-semibold">Hospital Branch</span>
            <span className="font-bold text-slate-800">{hospital.branch_name.split(",")[0]}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
            <span className="text-slate-500 font-semibold">Doctor Assigned</span>
            <span className="font-bold text-blue-600">{doctor.doctor.full_name}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
            <span className="text-slate-500 font-semibold">Appointment Time</span>
            <span className="font-bold text-teal">{day.label} · {slot}</span>
          </div>
          <div className="flex justify-between items-center py-1.5 text-xs pt-2">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Total Paid (Consultation)</span>
            <span className="font-black text-teal text-sm font-mono">₹{total}</span>
          </div>
        </div>
      </div>

      <button onClick={onNext} className="st-btn-primary w-full rounded-xl py-3.5 text-sm font-bold mt-8 flex items-center justify-center gap-1.5 shadow-md cursor-pointer">
        Continue to Pharmacy Offer <ChevronRight size={16} />
      </button>
    </div>
  );
};

// 12. Medicine Offer (Tata 1mg Reordering integration)
interface MedicineOfferProps {
  patientProfile: PatientProfile;
  onDone: () => void;
}

const MedicineOfferScreen: React.FC<MedicineOfferProps> = ({ patientProfile, onDone }) => {
  const [accepted, setAccepted] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  
  const chronicList = useMemo(() => {
    return patientProfile.chronic_conditions || ["Hypertension"];
  }, [patientProfile]);

  const handleOrderSubmit = () => {
    setSuccess(true);
    setTimeout(() => {
      onDone();
    }, 1800);
  };

  if (success) {
    return (
      <div className="p-8 st-fade flex flex-col justify-center items-center text-center max-w-lg mx-auto bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl min-h-[400px]">
        <div className="w-12 h-12 rounded-full bg-teal-500/10 flex items-center justify-center mb-4">
          <Package size={24} className="text-teal animate-bounce" />
        </div>
        <h2 className="st-display text-xl font-bold text-zinc-100">Order Placed Successfully!</h2>
        <p className="text-xs text-grey mt-2 max-w-[240px] font-semibold leading-relaxed">
          Tata 1mg has dispatched your prescription refill. SMS tracker is active.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 st-fade flex flex-col justify-between h-full bg-zinc-900 max-w-lg mx-auto rounded-2xl border border-zinc-800 shadow-xl">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1 justify-between">
          <Pill tone="saffron">TATA 1MG PARTNERSHIP</Pill>
          <span className="text-[9px] font-bold text-grey uppercase tracking-widest st-mono">Refill Offer</span>
        </div>
        <h2 className="st-display text-xl font-extrabold text-zinc-100 leading-tight">Reorder chronic condition medications at 20% discount</h2>
        <p className="text-xs text-grey -mt-1">Refills on file synced with your patient profile.</p>

        <div className="st-card p-4 border border-zinc-800 bg-zinc-950/40 text-xs flex flex-col gap-3 mt-2">
          <span className="st-mono text-[9px] font-bold text-teal tracking-widest uppercase">PROFILE REFLEX AUTO-FILL</span>
          <div className="flex flex-col gap-1.5">
            {chronicList.map((c: string, idx: number) => (
              <div key={idx} className="flex items-center gap-2.5 text-zinc-200">
                <PillIcon size={14} className="text-saffron shrink-0" />
                <span className="font-semibold text-xs">{c === "Hypertension" ? "Amlodipine 5mg (30 Tablets)" : c}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-900 my-1" />
          <div className="flex justify-between items-center text-xs">
            <span className="text-grey font-semibold">Subtotal Price</span>
            <span className="font-semibold text-zinc-300">₹320</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-grey font-bold">1mg Partner Price (-20%)</span>
            <span className="font-bold text-teal">₹256</span>
          </div>
        </div>

        <label className="flex items-start gap-2.5 mt-4 p-3 bg-zinc-900 border border-zinc-800 rounded-xl cursor-pointer">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5" />
          <span className="text-[11px] leading-relaxed text-zinc-400 font-semibold select-none">
            Accept Tata 1mg terms and allow cashless checkout against registered payment method.
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-2 mt-8">
        <button disabled={!accepted} onClick={handleOrderSubmit} className="st-btn-primary w-full rounded-xl py-3.5 text-xs font-bold disabled:opacity-40 shadow-md">
          Place Refill Order (₹256)
        </button>
        <button onClick={onDone} className="st-btn-ghost w-full py-3 text-xs font-bold rounded-xl shadow-sm border border-zinc-850">
          Skip pharmacy refilling
        </button>
      </div>
    </div>
  );
};

// 13. Done Screen
interface DoneProps {
  onRestart: () => void;
}

const DoneScreen: React.FC<DoneProps> = ({ onRestart }) => {
  return (
    <div className="p-12 st-fade flex flex-col h-full bg-zinc-900 items-center text-center justify-center max-w-lg mx-auto rounded-2xl border border-zinc-800 shadow-xl min-h-[400px]">
      <div className="w-12 h-12 rounded-full bg-saffron/10 flex items-center justify-center mb-4">
        <SaarthiLogo size={32} />
      </div>
      <h2 className="st-display text-2xl font-extrabold text-zinc-100">All set!</h2>
      <p className="text-xs text-grey mb-6 leading-relaxed font-semibold max-w-[240px]">
        Reminders are active. We'll guide you again next time you need care.
      </p>
      <button onClick={onRestart} className="st-btn-primary rounded-xl px-6 py-2.5 text-xs font-bold shadow-md cursor-pointer">
        Start a new check
      </button>
    </div>
  );
};

// 14. Health Timeline Screen
interface HealthTimelineProps {
  onBack: () => void;
}

const HealthTimelineScreen: React.FC<HealthTimelineProps> = ({ onBack }) => {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackAnswered, setFeedbackAnswered] = useState<Record<string, boolean>>({});

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const data = await api.get("/appointments/patient/timeline");
      setTimeline(data);
    } catch (err) {
      console.error("Failed to load timeline", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const handleFeedback = async (apptId: string, rightCall: boolean) => {
    try {
      await api.post(`/appointments/${apptId}/feedback`, { right_call: rightCall });
      setFeedbackAnswered((prev) => ({ ...prev, [apptId]: true }));
      // Reload timeline records
      fetchTimeline();
    } catch (err) {
      console.error("Failed to save feedback", err);
    }
  };

  return (
    <div className="p-6 st-fade flex flex-col bg-white w-full rounded-2xl border border-slate-200 shadow-xl">
      <div className="border-b border-slate-200 pb-4 mb-5 flex justify-between items-center">
        <ScreenHeader onBack={onBack} title="Clinical Health Timeline" sub="Chronological repository of all diagnostic advice, consult prescriptions and triage feedback logs." />
        <button onClick={fetchTimeline} className="st-mono text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
          REFRESH
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Clock className="text-blue-500 animate-spin" size={28} /></div>
      ) : timeline.length > 0 ? (
        <div className="flex flex-col gap-4 max-h-[500px] st-scroll overflow-y-auto pr-1">
          {timeline.map((item) => {
            const hasRecord = !!item.record;
            const feedbackDone = feedbackAnswered[item.id] || item.feedback_right_call !== null;
            return (
              <div key={item.id} className="st-card p-4 border border-slate-200 bg-slate-50/40 hover:border-slate-300 transition-colors">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${hasRecord ? "bg-teal-500/10 text-teal" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                      {hasRecord ? <FileText size={16} /> : <History size={16} />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{item.doctor_assignment?.doctor?.full_name || "Specialist Consultant"}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{item.doctor_assignment?.department?.name || "General Medicine"} · {item.doctor_assignment?.branch?.branch_name?.split(",")[0] || "Saathi Branch"}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="st-mono text-[9px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-sm">
                      {item.appointment_date} · {item.appointment_time}
                    </div>
                    <div className="mt-1">
                      <span className={`st-mono text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border ${item.status === "completed" ? "bg-teal-50 border-teal-200 text-teal-600" : "bg-blue-50 border-blue-200 text-blue-600"}`}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 my-3 pt-3 flex flex-col gap-2">
                  <div className="text-xs text-slate-700 leading-relaxed font-semibold">
                    💬 <span className="text-slate-400 font-bold">Symptoms reported:</span> "{item.symptoms}"
                  </div>

                  {hasRecord && (
                    <div className="bg-slate-100/50 p-3 rounded-xl border border-slate-200 text-[11px] leading-relaxed mt-1">
                      <div className="font-bold text-slate-800">Prescription Refills &amp; Assessment:</div>
                      <div className="mt-1.5 text-slate-700">
                        <strong className="text-slate-500">Diagnosis:</strong> {item.record.diagnosis}
                      </div>
                      <div className="mt-1 text-slate-700">
                        <strong className="text-slate-500">Treatment/Rx Plan:</strong> {item.record.treatment}
                      </div>
                    </div>
                  )}

                  {/* Feedback question for completed items */}
                  {item.status === "completed" && !feedbackDone && (
                    <div className="mt-3 bg-blue-50 border border-blue-100 p-3 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                      <span className="text-slate-650 font-bold">Was this triaging route correct?</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleFeedback(item.id, true)} className="st-mono text-[9px] font-bold text-teal bg-teal-50 border border-teal-200 px-2.5 py-1 rounded hover:bg-teal-100 cursor-pointer">
                          YES
                        </button>
                        <button onClick={() => handleFeedback(item.id, false)} className="st-mono text-[9px] font-bold text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded hover:bg-red-100 cursor-pointer">
                          NO
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {item.status === "completed" && feedbackDone && (
                    <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1 font-semibold">
                      <Check size={12} className="text-teal" /> feedback recorded (Routing feedback matched)
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 border border-dashed border-slate-200 bg-slate-50/50 text-center text-xs text-slate-500 font-semibold rounded-2xl flex flex-col justify-center items-center h-48">
          No medical records found on file. Book a specialist slot to build history.
        </div>
      )}
    </div>
  );
};

// 15. Planned Surgery Cost Select
interface OperationSelectProps {
  patientProfile: PatientProfile;
  onBack: () => void;
  onNext: (opId: string, insurerId: string) => void;
}

const OperationSelectScreen: React.FC<OperationSelectProps> = ({ patientProfile, onBack, onNext }) => {
  const [ops, setOps] = useState<any[]>([]);
  const [opId, setOpId] = useState("");
  const [loading, setLoading] = useState(true);
  
  const insurerId = patientProfile.insurer_id || "none";

  const mapInsurerName = (id: string) => {
    const list: Record<string, string> = {
      none: "No insurance coverage (Self-Pay)",
      niva: "Niva Bupa Health",
      star: "Star Health Insurance",
      icici: "ICICI Lombard",
      cghs: "CGHS (Govt.)",
      ayushman: "Ayushman Bharat PM-JAY",
    };
    return list[id] || "Registered Insurance";
  };

  useEffect(() => {
    const fetchOps = async () => {
      setLoading(true);
      try {
        const data = await api.get("/hospitals/operations");
        setOps(data);
        if (data.length > 0) setOpId(data[0].id);
      } catch (err) {
        console.error("Failed to load operations", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOps();
  }, []);

  const proceed = () => {
    if (opId) onNext(opId, insurerId);
  };

  return (
    <div className="p-8 st-fade flex flex-col justify-between h-full bg-white max-w-lg mx-auto rounded-2xl border border-slate-200 shadow-xl">
      <div className="flex flex-col gap-4">
        <ScreenHeader onBack={onBack} eyebrow="SURGERY PLANNER" title="Planned procedure estimator" sub="Compare out-of-pocket costs and empanelment approvals for planned operations." />
        
        {loading ? (
          <div className="flex justify-center p-8"><Clock className="text-blue-500 animate-spin" size={24} /></div>
        ) : (
          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Planned Procedure</label>
              <select className="st-input py-3 cursor-pointer text-slate-800 text-xs font-bold" value={opId} onChange={(e) => setOpId(e.target.value)}>
                {ops.map((o) => (
                  <option key={o.id} value={o.id} className="bg-white text-slate-800 font-sans">{o.name} (Est. Base: ₹{o.base_cost})</option>
                ))}
              </select>
            </div>

            <div className="st-card p-4 border border-slate-200 bg-slate-50/50 text-xs flex flex-col gap-2">
              <span className="st-mono text-[9px] font-bold text-blue-600 tracking-widest uppercase">Seeded Insurance Plan</span>
              <div className="flex justify-between items-center py-1 mt-1">
                <span className="text-slate-500 font-semibold">Registered Insurer</span>
                <span className="font-bold text-slate-850">{mapInsurerName(insurerId)}</span>
              </div>
              <div className="text-[10px] text-slate-500 leading-relaxed font-semibold mt-1">
                ⚡ Cost planner automatically calculates coverage limits based on empanelment status of specific hospital branches.
              </div>
            </div>
          </div>
        )}
      </div>

      <button disabled={!opId} onClick={proceed} className="st-btn-primary w-full rounded-xl py-3.5 text-sm font-bold mt-8 flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
        Calculate Cost Breakdowns <ChevronRight size={16} />
      </button>
    </div>
  );
};

// 16. Planned Surgery Cost Estimates
interface OperationHospitalsProps {
  opId: string;
  insurerId: string;
  onBack: () => void;
}

const OperationHospitalsScreen: React.FC<OperationHospitalsProps> = ({ opId, insurerId, onBack }) => {
  const [estimates, setEstimates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEstimates = async () => {
      setLoading(true);
      try {
        const data = await api.get(`/hospitals/operations/estimate?op_id=${opId}&insurer_id=${insurerId}`);
        setEstimates(data);
      } catch (err) {
        console.error("Failed to load estimates", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEstimates();
  }, [opId, insurerId]);

  return (
    <div className="p-6 st-fade flex flex-col bg-white w-full rounded-2xl border border-slate-200 shadow-sm">
      <div className="border-b border-slate-200 pb-4 mb-4">
        <ScreenHeader onBack={onBack} title="Procedure Cost Comparisons" sub="Estimates split by hospital billing bands, room fees, surgeon splits, and cashless approvals." />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Clock className="text-blue-500 animate-spin" size={28} /></div>
      ) : estimates.length > 0 ? (
        <div className="flex flex-col gap-4 st-scroll overflow-y-auto max-h-[500px]">
          {estimates.map((est, idx) => {
            const total = est.cost_breakup?.total || 0;
            const room = est.cost_breakup?.room || 0;
            const surgeon = est.cost_breakup?.surgeon || 0;
            const ot = (est.cost_breakup?.medicines || 0) + (est.cost_breakup?.other || 0);
            const outOfPocket = est.empanelled ? 0 : total;
            
            return (
              <div key={idx} className="st-card p-5 border border-slate-200 bg-slate-50/50">
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-800">{est.hospital_name || "Hospital Branch"}</span>
                      <span className="st-mono text-[9px] text-grey bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded uppercase">✨ Matched</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-grey font-bold mt-2">
                      <span>Accreditation: Accredited</span>
                      <span>·</span>
                      <span>Distance: {est.distance_km} km</span>
                      <span>·</span>
                      <span>Rating: {est.rating} ⭐</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Estimated Gross Bill</div>
                    <div className="st-mono text-base font-black text-slate-800 mt-0.5">₹{total.toLocaleString()}</div>
                  </div>
                </div>

                {/* Cost splits visual bar */}
                <div className="my-5">
                  <div className="flex justify-between text-[9px] text-grey font-bold mb-1.5">
                    <span>ROOM FEES: ₹{room.toLocaleString()} (25%)</span>
                    <span>SURGEON FEES: ₹{surgeon.toLocaleString()} (40%)</span>
                    <span>OT &amp; MEDICINES: ₹{ot.toLocaleString()} (35%)</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
                    <div style={{ width: "25%" }} className="bg-teal" />
                    <div style={{ width: "40%" }} className="bg-indigo" />
                    <div style={{ width: "35%" }} className="bg-saffron" />
                  </div>
                </div>

                {/* Empanelment Status card */}
                <div className="flex justify-between items-center bg-slate-100/60 p-3 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${est.empanelled ? "bg-teal" : "bg-red-500"}`} />
                    <span className="text-slate-600 font-semibold">
                      Cashless Coverage: {est.empanelled ? "Empanelled" : "Non-Empanelled (Requires reimbursement claim)"}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-slate-500 font-bold uppercase">Out of Pocket Est.</div>
                    <span className={`st-mono font-bold ${est.empanelled ? "text-teal text-sm" : "text-saffron text-sm"}`}>
                      ₹{outOfPocket.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-xs text-grey italic p-4 text-center">Estimates calculations not available.</div>
      )}
    </div>
  );
};

// 17. Conversational AI Assistant Screen
interface AiAssistantProps {
  patientProfile: PatientProfile;
}

const AiAssistantScreen: React.FC<AiAssistantProps> = () => {
  const [messages, setMessages] = useState<Array<{ sender: "user" | "ai"; text: string; confidence?: string }>>([
    { sender: "ai", text: "Hello! I am your Saathi Health AI Assistant. Ask me anything about your symptoms, prescriptions, insurance coverage, or clinical guidelines." }
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [allDoctors, setAllDoctors] = useState<any[]>([]);

  const suggestedQuestions = [
    "Which hospitals are in Delhi?",
    "Show me Cardiology doctors",
    "Should I see a cardiologist for left-sided chest pain?",
  ];

  useEffect(() => {
    const loadDirectoryData = async () => {
      try {
        const branchList = await api.get("/hospitals/branches");
        setBranches(branchList);
        
        // Fetch doctors for all branches
        const docPromises = branchList.map(async (b: any) => {
          try {
            const docs = await api.get(`/hospitals/branches/${b.id}/doctors`);
            return docs.map((d: any) => ({ 
              ...d, 
              branchName: b.branch_name, 
              city: b.city,
              distance: b.distance_km,
              rating: b.rating
            }));
          } catch {
            return [];
          }
        });
        const docLists = await Promise.all(docPromises);
        setAllDoctors(docLists.flat());
      } catch (err) {
        console.error("Failed to load AI directory data", err);
      }
    };
    loadDirectoryData();
  }, []);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    setMessages((prev) => [...prev, { sender: "user", text: textToSend }]);
    setInput("");
    setThinking(true);

    setTimeout(() => {
      let responseText = "";
      let confidence = "92%";
      const lower = textToSend.toLowerCase();

      // 1. GREETINGS
      if (
        lower === "hi" || 
        lower === "hello" || 
        lower === "hey" || 
        lower.startsWith("hey ") ||
        lower.startsWith("hello ") ||
        lower.includes("how are you") ||
        lower.includes("good morning") ||
        lower.includes("good afternoon")
      ) {
        responseText = "Hello! I am your Saathi AI Triage Advisor.\n\nI can dynamically lookup hospitals in your city, find specialists, show their experience, check patient ratings, verify insurer empanelment, and review available appointment hours.\n\nTry asking me:\n• \"Which hospitals are in Delhi?\"\n• \"Show me Cardiology doctors\"\n• \"What are the side effects of Amlodipine?\"";
        confidence = "100% (Greeting)";
      } 
      // 1.5. EMPATHETIC MENTAL HEALTH & CASUAL CONVERSATION
      else if (
        lower.includes("stress") || 
        lower.includes("anxious") || 
        lower.includes("anxiety") || 
        lower.includes("panic") || 
        lower.includes("overwhelmed") || 
        lower.includes("worry") || 
        lower.includes("worried") || 
        lower.includes("tension")
      ) {
        responseText = "I hear you, and I am really sorry you are feeling this way. Stress and anxiety can take a heavy toll on both your mind and body.\n\nWhat happened, my friend? Is it related to work pressure, family, health worries, or are you having trouble sleeping?\n\nSometimes just sharing it helps, and I'm here to listen. If you feel your heart racing right now, let's take a deep breath together. Inhale for 4 seconds, hold for 7, and exhale for 8. Let me know how I can help you.";
        confidence = "100% (Mental Wellness Support)";
      }
      else if (
        lower.includes("sad") || 
        lower.includes("depressed") || 
        lower.includes("lonely") || 
        lower.includes("crying") || 
        lower.includes("bad day") || 
        lower.includes("feeling down")
      ) {
        responseText = "I'm so sorry you are having a rough time right now. It is completely okay to feel down, and you don't have to carry this weight alone.\n\nWhat happened, my friend? Did something specific trigger this, or are you just feeling completely drained and exhausted?\n\nIf you want to talk about it, I'm right here to listen. You are doing the best you can, and that is more than enough.";
        confidence = "100% (Emotional Support)";
      }
      else if (
        lower.includes("tired") || 
        lower.includes("exhausted") || 
        lower.includes("fatigue") || 
        lower.includes("sleepy") || 
        lower.includes("can't sleep") || 
        lower.includes("insomnia")
      ) {
        responseText = "It sounds like your body and mind are completely drained. Burnout and exhaustion can make everything feel much harder.\n\nHave you been having trouble falling asleep, or has it just been an incredibly hectic week, my friend? \n\nMake sure to drink some water and give yourself permission to rest. Let me know if you'd like some simple tips for better sleep hygiene.";
        confidence = "98% (Wellness Advisory)";
      }
      // 2. HOSPITALS SEARCH
      else if (
        lower.includes("hospital") || 
        lower.includes("branch") || 
        lower.includes("mumbai") || 
        lower.includes("delhi") || 
        lower.includes("bangalore") || 
        lower.includes("bengaluru")
      ) {
        let matches = branches;
        let filterTitle = "our empanelled network hospitals";
        
        if (lower.includes("mumbai")) {
          matches = branches.filter(b => b.city.toLowerCase() === "mumbai");
          filterTitle = "network hospitals in Mumbai";
        } else if (lower.includes("delhi")) {
          matches = branches.filter(b => b.city.toLowerCase() === "delhi");
          filterTitle = "network hospitals in Delhi";
        } else if (lower.includes("bangalore") || lower.includes("bengaluru")) {
          matches = branches.filter(b => b.city.toLowerCase() === "bangalore");
          filterTitle = "network hospitals in Bangalore";
        }

        if (matches.length > 0) {
          responseText = `Here are the details for ${filterTitle} matching your inquiry:\n\n` +
            matches.map(b => {
              const ins = [];
              try {
                const parsed = typeof b.insurers === "string" ? JSON.parse(b.insurers) : b.insurers;
                ins.push(...parsed);
              } catch {
                ins.push("Star", "Niva Bupa");
              }
              return `🏥 **${b.branch_name}**\n` +
                     `   📍 Address: ${b.address}, ${b.city}\n` +
                     `   ⭐ Rating: ${b.rating || "4.6"}/5 | ⏳ Wait Time: ~${b.wait_min || 15} mins\n` +
                     `   💳 Empanelled Insurers: ${ins.join(", ").toUpperCase()}\n` +
                     `   🎟️ Consultation Fee: ₹${b.consult_fee || 500} | Accreditation: ${b.accreditation || "NABH Accredited"}`;
            }).join("\n\n") + `\n\nWould you like me to guide you to book an appointment at one of these locations?`;
          confidence = "98% (Dynamic Facility Index)";
        } else {
          responseText = `I found Saathi empanelled network hospitals across Mumbai, Delhi, and Bangalore. Please specify which city you'd like to check! (e.g. "Which hospitals are in Delhi?")`;
          confidence = "90%";
        }
      } 
      // 3. DOCTORS / SPECIALISTS / SLOTS SEARCH
      else if (
        lower.includes("doctor") || 
        lower.includes("specialist") || 
        lower.includes("cardiologist") || 
        lower.includes("medicine") || 
        lower.includes("ortho") || 
        lower.includes("neuro") || 
        lower.includes("gastro") || 
        lower.includes("pulmono") ||
        lower.includes("rating") ||
        lower.includes("experience") ||
        lower.includes("fee") ||
        lower.includes("slot")
      ) {
        let matches = allDoctors;
        let specTitle = "available specialists";

        if (lower.includes("cardio")) {
          matches = allDoctors.filter(d => d.doctor.specialization.toLowerCase().includes("cardio"));
          specTitle = "Cardiology specialists";
        } else if (lower.includes("ortho")) {
          matches = allDoctors.filter(d => d.doctor.specialization.toLowerCase().includes("ortho"));
          specTitle = "Orthopaedics specialists";
        } else if (lower.includes("general") || lower.includes("medicine") || lower.includes("physician")) {
          matches = allDoctors.filter(d => d.doctor.specialization.toLowerCase().includes("general") || d.doctor.specialization.toLowerCase().includes("physician"));
          specTitle = "General Medicine practitioners";
        } else if (lower.includes("neuro")) {
          matches = allDoctors.filter(d => d.doctor.specialization.toLowerCase().includes("neuro"));
          specTitle = "Neurology specialists";
        } else if (lower.includes("gastro")) {
          matches = allDoctors.filter(d => d.doctor.specialization.toLowerCase().includes("gastro"));
          specTitle = "Gastroenterology specialists";
        } else if (lower.includes("pulmono")) {
          matches = allDoctors.filter(d => d.doctor.specialization.toLowerCase().includes("pulmono"));
          specTitle = "Pulmonology specialists";
        }

        if (matches.length > 0) {
          responseText = `Here are the top-rated ${specTitle} currently empanelled on Saathi:\n\n` +
            matches.slice(0, 5).map(d => 
              `👨‍⚕️ **${d.doctor.full_name}** (${d.doctor.specialization})\n` +
              `   • Qualification: ${d.doctor.qualification || "MD"}\n` +
              `   • Experience: ${d.doctor.experience_years || 10} years | Rating: ⭐ ${d.doctor.average_rating || "4.7"}/5\n` +
              `   • Location: ${d.branchName} (${d.city})\n` +
              `   • Consultation Fee: ₹${d.consultation_fee}\n` +
              `   • Available slots this week: Today 10:30 AM, Tomorrow 2:15 PM, Thursday 4:00 PM`
            ).join("\n\n") + `\n\nWould you like me to help you navigate to the booking page for one of these specialists?`;
          confidence = "97% (Dynamic Provider Registry)";
        } else {
          responseText = `I couldn't find a specific doctor matching that specialization. However, we have Cardiology, Orthopaedics, Pulmonology, and General Medicine specialists available. You can view all by asking: "Show me Cardiology doctors".`;
          confidence = "91%";
        }
      } 
      // 4. SPECIFIC CLINICAL OR POLICY PRESETS
      else if (lower.includes("amlodipine")) {
        responseText = "Amlodipine is a calcium channel blocker commonly prescribed for Hypertension. Common side effects include swollen ankles (edema), fatigue, dizziness, and flushing. Alert your doctor if you experience persistent swelling.";
        confidence = "98% (Clinical Presets)";
      } else if (lower.includes("star health") || lower.includes("horizon")) {
        responseText = "Yes, Star Health is fully empanelled at Horizon Multispecialty Hospital. Cashless pre-authorizations are typically approved within 4 hours, and out-of-pocket room charges are capped at ₹1,500/day.";
        confidence = "96% (Policy Presets)";
      } else if (lower.includes("cardiologist") || lower.includes("chest pain")) {
        responseText = "Left-sided chest pain, especially if radiating to the shoulder or accompanied by shortness of breath, is a clinical red-flag. You should proceed directly to the nearest emergency room (ER) for an ECG rather than scheduling a routine appointment.";
        confidence = "99% (Emergency Route)";
      } 
      // 5. DEFAULT CLINICAL ASSISTANT ADVICE
      else {
        responseText = `Based on simulated clinical guidelines, this symptom is usually evaluated by the department of General Medicine.\n\nTo find more specialized care, please let me know if you are experiencing any of the following:\n• Chest pain or palpitation (Cardiology)\n• Joint pain or fractures (Orthopaedics)\n• Breathing difficulties or persistent cough (Pulmonology)\n• Severe headaches or numbness (Neurology)`;
        confidence = "92% (Clinical Guidelines Classifier)";
      }

      setMessages((prev) => [...prev, { sender: "ai", text: responseText, confidence }]);
      setThinking(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col h-[580px] bg-white border border-slate-200 rounded-2xl overflow-hidden st-fade max-w-4xl mx-auto shadow-xl">
      {/* HUD Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-blue-600 animate-pulse" />
          <span className="text-xs font-bold text-slate-800">Saathi AI Clinical Advisor</span>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
          <span className="w-1 h-1 rounded-full bg-blue-600 animate-pulse" /> inference core active
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 p-4 overflow-y-auto st-scroll flex flex-col gap-4 bg-slate-50/20">
        {messages.map((m, idx) => {
          const renderFormattedText = (content: string) => {
            if (!content) return null;
            if (!content.includes("**")) return content;
            const parts = content.split(/(\*\*.*?\*\*)/g);
            return parts.map((part, i) => {
              if (part.startsWith("**") && part.endsWith("**")) {
                const innerText = part.slice(2, -2).replace(/\*\*/g, "").trim();
                return (
                  <strong key={i} className="font-extrabold text-slate-900">
                    {innerText}
                  </strong>
                );
              }
              return part;
            });
          };

          return (
            <div key={idx} className={`flex flex-col max-w-[80%] ${m.sender === "user" ? "self-end items-end" : "self-start items-start"}`}>
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${m.sender === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white text-slate-700 border border-slate-200 rounded-tl-sm shadow-sm"}`}>
                {renderFormattedText(m.text)}
              </div>
              {m.confidence && (
                <span className="st-mono text-[8px] text-blue-600 mt-1.5 font-bold">
                  Clinical Confidence: {m.confidence}
                </span>
              )}
            </div>
          );
        })}
        {thinking && (
          <div className="flex items-center gap-1.5 self-start bg-white border border-slate-200 p-3.5 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        )}
      </div>

      {/* Quick suggest tags */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex gap-2 overflow-x-auto st-scroll">
        {suggestedQuestions.map((q, i) => (
          <button key={i} onClick={() => handleSend(q)} className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 hover:border-slate-350 hover:text-slate-800 px-3 py-1.5 rounded-lg shrink-0 transition-colors cursor-pointer shadow-sm">
            {q}
          </button>
        ))}
      </div>

      {/* Chat Input */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }} className="bg-slate-50 p-3 border-t border-slate-200 flex gap-2">
        <input className="st-input flex-1 py-3 text-xs" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type symptoms or insurance questions here..." />
        <button type="submit" className="st-btn-primary rounded-xl px-4 flex items-center justify-center cursor-pointer shadow-md">
          <Send size={14} />
        </button>
      </form>
    </div>
  );
};

// 18. Health Analytics Dashboard Screen
const HealthAnalyticsScreen: React.FC = () => {
  // Simulated stats history
  const heartRateData = [
    { name: "Mon", rate: 72, bpSystolic: 118 },
    { name: "Tue", rate: 78, bpSystolic: 122 },
    { name: "Wed", rate: 82, bpSystolic: 120 },
    { name: "Thu", rate: 75, bpSystolic: 119 },
    { name: "Fri", rate: 85, bpSystolic: 124 },
    { name: "Sat", rate: 80, bpSystolic: 121 },
    { name: "Sun", rate: 74, bpSystolic: 120 },
  ];

  const sleepData = [
    { name: "Mon", hrs: 7.2 },
    { name: "Tue", hrs: 6.8 },
    { name: "Wed", hrs: 7.8 },
    { name: "Thu", hrs: 8.0 },
    { name: "Fri", hrs: 6.5 },
    { name: "Sat", hrs: 8.5 },
    { name: "Sun", hrs: 7.9 },
  ];

  return (
    <div className="p-6 st-fade flex flex-col bg-white w-full rounded-2xl border border-slate-200 shadow-xl gap-6">
      <ScreenHeader title="Interactive Health Analytics" sub="Physiological vitals logs and claims statistics visualizer." />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Heart Rate / Blood Pressure Trend */}
        <div className="st-card p-5 border border-slate-200 bg-slate-50/40">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-800">Vitals Log (Heart Rate &amp; BP Systolic)</span>
            <span className="st-mono text-[9px] text-teal-600 font-extrabold uppercase bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg shadow-sm">7 Days Log</span>
          </div>
          <div className="h-56 w-full text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={heartRateData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" />
                <YAxis stroke="#64748B" domain={[60, 140]} />
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", color: "#0F172A", borderRadius: "10px" }} />
                <Area type="monotone" dataKey="rate" stroke="#06B6D4" fillOpacity={1} fill="url(#colorRate)" name="Heart Rate (BPM)" />
                <Area type="monotone" dataKey="bpSystolic" stroke="#3B82F6" fillOpacity={0} name="BP Systolic (mmHg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sleep tracker */}
        <div className="st-card p-5 border border-slate-200 bg-slate-50/40">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-800">Sleep Schedule Analysis</span>
            <span className="st-mono text-[9px] text-blue-600 font-extrabold uppercase bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg shadow-sm">Target: 8.0 Hrs</span>
          </div>
          <div className="h-56 w-full text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" />
                <YAxis stroke="#64748B" domain={[0, 10]} />
                <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", color: "#0F172A", borderRadius: "10px" }} />
                <Bar dataKey="hrs" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Sleep Hours" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// 19. Patient Settings Screen
const SettingsScreen: React.FC<{ patientProfile: PatientProfile }> = ({ patientProfile }) => {
  return (
    <div className="p-6 st-fade flex flex-col bg-white w-full rounded-2xl border border-slate-200 shadow-xl gap-6 max-w-2xl mx-auto">
      <ScreenHeader title="Account Settings" sub="Review and update your patient profile parameters." />

      <div className="st-card p-6 border border-slate-200 bg-slate-50/40 flex flex-col gap-4 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Full Name</label>
            <input className="st-input" disabled value={patientProfile.full_name} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Mobile Phone</label>
            <input className="st-input" disabled value={patientProfile.phone} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Date of Birth</label>
            <input className="st-input" disabled value={patientProfile.date_of_birth?.toString()} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Gender</label>
            <input className="st-input" disabled value={patientProfile.gender} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Blood Group</label>
            <input className="st-input" disabled value={patientProfile.blood_group || "O+"} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Registered City</label>
            <input className="st-input" disabled value={patientProfile.city || "Mumbai"} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Pincode</label>
            <input className="st-input" disabled value={patientProfile.pincode || "400050"} />
          </div>
        </div>

        <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl text-[10px] text-slate-500 leading-relaxed font-semibold">
          ⚡ For profile parameter modifications or updating insurer contracts, please coordinate with your hospital registry clerk.
        </div>
      </div>
    </div>
  );
};

// 20. Upcoming Appointments Screen
interface AppointmentsListProps {
  upcoming: any[];
}

const AppointmentsListScreen: React.FC<AppointmentsListProps> = ({ upcoming }) => {
  return (
    <div className="p-6 st-fade flex flex-col bg-white w-full rounded-2xl border border-slate-200 shadow-xl gap-5">
      <ScreenHeader title="Scheduled Appointments" sub="Manage your active outpatient consultation reservations." />

      <div className="st-card border border-slate-200 overflow-hidden bg-slate-50/10 rounded-xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 font-bold text-slate-500 text-[10px] uppercase">
              <th className="p-3">Hospital Branch</th>
              <th className="p-3">Doctor</th>
              <th className="p-3">Department</th>
              <th className="p-3">Date &amp; Time</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.length > 0 ? (
              upcoming.map((a, idx) => (
                <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-slate-700">
                  <td className="p-3 font-semibold text-slate-800">{a.hospitalName}</td>
                  <td className="p-3 font-medium text-slate-600">{a.doctorName}</td>
                  <td className="p-3 font-medium text-slate-600">{a.dept}</td>
                  <td className="p-3 text-teal font-semibold">{a.dayLabel} · {a.time}</td>
                  <td className="p-3 text-right">
                    <span className="st-mono text-[9px] font-bold px-2 py-0.5 rounded border border-teal-500/20 bg-teal-500/10 text-teal">
                      Booked
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400 font-medium italic">
                  No upcoming appointments scheduled for this week.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 21. Prescriptions Screen
interface PrescriptionsProps {
  patientProfile: PatientProfile;
  onReorder: () => void;
}

const PrescriptionsScreen: React.FC<PrescriptionsProps> = ({ patientProfile, onReorder }) => {
  const chronicList = useMemo(() => {
    return patientProfile.chronic_conditions || ["Hypertension"];
  }, [patientProfile]);

  return (
    <div className="p-6 st-fade flex flex-col bg-white w-full rounded-2xl border border-slate-200 shadow-xl gap-5 max-w-2xl mx-auto">
      <ScreenHeader title="Refills &amp; Prescriptions" sub="Manage active chronic medications and refilling logs." />

      <div className="flex flex-col gap-4">
        {chronicList.map((c: string, i: number) => (
          <div key={i} className="st-card p-5 border border-slate-200 bg-slate-50/40 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-100">
                <PillIcon size={18} className="text-amber-600 animate-bounce" style={{ animationDuration: '3s' }} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-850">{c === "Hypertension" ? "Amlodipine 5mg" : c}</div>
                <div className="text-[10px] text-slate-550 mt-1 font-semibold">Dosage: One tablet daily after meals · Refill remaining: 2</div>
              </div>
            </div>
            
            <button onClick={onReorder} className="st-mono text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg hover:bg-blue-100 cursor-pointer shadow-sm">
              REORDER
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// 22. Dashboard View (`HomeScreen`)
interface HomeScreenProps {
  patientProfile: PatientProfile;
  onNav: (dest: string) => void;
  upcoming: any[];
}

const HomeScreen: React.FC<HomeScreenProps> = ({ patientProfile, onNav, upcoming }) => {
  // Mock multi-line trend data matching the image
  const trendData = [
    { name: "Mon", "Heart Rate": 62, "Sleep (hrs)": 42, "Steps (k)": 28 },
    { name: "Tue", "Heart Rate": 78, "Sleep (hrs)": 52, "Steps (k)": 34 },
    { name: "Wed", "Heart Rate": 74, "Sleep (hrs)": 48, "Steps (k)": 30 },
    { name: "Thu", "Heart Rate": 82, "Sleep (hrs)": 56, "Steps (k)": 38 },
    { name: "Fri", "Heart Rate": 70, "Sleep (hrs)": 46, "Steps (k)": 26 },
    { name: "Sat", "Heart Rate": 84, "Sleep (hrs)": 58, "Steps (k)": 40 },
    { name: "Sun", "Heart Rate": 76, "Sleep (hrs)": 50, "Steps (k)": 32 }
  ];

  // If there are no live upcoming appointments, display a realistic fallback matching the mockup
  const displayAppointments = upcoming && upcoming.length > 0 ? upcoming : [
    {
      doctorName: "Dr. Renu Kapadia",
      dept: "Cardiologist",
      dayLabel: "21 May 2025",
      time: "10:30 AM",
      hospitalName: "Saathi Hospital, Mumbai"
    }
  ];

  return (
    <div className="st-fade flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="st-display text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
            Good Morning, {patientProfile.full_name.split(" ")[0]}! 🌟
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">Here's your health overview for today.</p>
        </div>

        {/* Dynamic Insurance Banner */}
        <div className="flex items-center justify-between p-3 px-4 bg-emerald-50 border border-emerald-100 rounded-2xl w-full lg:w-96 shadow-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <Check size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Insurance Active</div>
              <div className="text-[10px] text-slate-500 font-semibold leading-none mt-0.5">Policy valid until 12 Dec 2025</div>
            </div>
          </div>
          <button 
            onClick={() => onNav("operation")}
            className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-sm cursor-pointer"
          >
            View Details
          </button>
        </div>
      </div>

      {/* 5 Vitals HUD cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {/* Health Score */}
        <div className="st-card p-4 flex flex-col justify-between h-28 border-l-4 border-l-red-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-500">
              <Heart size={12} fill="currentColor" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Health Score</span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-800 font-mono">84</span>
              <span className="text-xs text-slate-400 font-bold">/ 100</span>
            </div>
            <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Good
            </span>
          </div>
        </div>

        {/* Heart Rate */}
        <div className="st-card p-4 flex flex-col justify-between h-28 border-l-4 border-l-pink-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-pink-100 flex items-center justify-center text-pink-500">
              <Heart size={12} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Heart Rate</span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black text-slate-800 font-mono">72</span>
              <span className="text-[10px] text-slate-500 font-bold ml-1">bpm</span>
            </div>
            <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Normal
            </span>
          </div>
        </div>

        {/* Sleep Quality */}
        <div className="st-card p-4 flex flex-col justify-between h-28 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
              <Moon size={12} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sleep</span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black text-slate-800 font-mono">7h 32m</span>
            </div>
            <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Good
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="st-card p-4 flex flex-col justify-between h-28 border-l-4 border-l-amber-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-500">
              <Activity size={12} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Steps</span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black text-slate-800 font-mono">6,842</span>
            </div>
            <span className="text-[9px] text-slate-500 font-extrabold flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Today
            </span>
          </div>
        </div>

        {/* BMI Index */}
        <div className="st-card p-4 flex flex-col justify-between h-28 border-l-4 border-l-teal-500">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-500">
              <User size={12} />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">BMI</span>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl font-black text-slate-800 font-mono">22.5</span>
            </div>
            <span className="text-[9px] text-emerald-600 font-extrabold flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Normal
            </span>
          </div>
        </div>
      </div>

      {/* Main split grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Side: Services & Charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Quick Services Actions */}
          <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-slate-800">Quick Actions</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <button 
                onClick={() => onNav("symptom")}
                className="st-card st-chip p-4 flex flex-col items-center text-center justify-between h-32 cursor-pointer bg-white"
              >
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Symptom Check</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">Check your symptoms</div>
                </div>
              </button>

              <button 
                onClick={() => onNav("symptom")} // Leads to clinic booking path
                className="st-card st-chip p-4 flex flex-col items-center text-center justify-between h-32 cursor-pointer bg-white"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Book Appointment</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">Find &amp; book doctors</div>
                </div>
              </button>

              <button 
                onClick={() => onNav("timeline")}
                className="st-card st-chip p-4 flex flex-col items-center text-center justify-between h-32 cursor-pointer bg-white"
              >
                <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                  <Package size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Upload Reports</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">Share medical reports</div>
                </div>
              </button>

              <button 
                onClick={() => onNav("symptom")} // Mock navigation logic, can direct to AI
                className="st-card st-chip p-4 flex flex-col items-center text-center justify-between h-32 cursor-pointer bg-white"
              >
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">AI Assistant</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5">Ask anything</div>
                </div>
              </button>
            </div>
          </div>

          {/* Spline Chart */}
          <div className="st-card p-5 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-bold text-slate-800">Health Trends</span>
              <select className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-1 px-2.5 outline-none">
                <option>This Week</option>
                <option>This Month</option>
              </select>
            </div>

            <div className="h-56 w-full text-[10px] font-bold">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" tickLine={false} />
                  <YAxis stroke="#64748B" tickLine={false} />
                  <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10 }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                  <Line type="monotone" dataKey="Heart Rate" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Sleep (hrs)" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Steps (k)" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Right Side: Appointment, Recent Reports, and AI Insights */}
        <div className="flex flex-col gap-6">
          
          {/* Upcoming Appointment */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800">Upcoming Appointment</span>
              <button onClick={() => onNav("timeline")} className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer">View all</button>
            </div>

            <div className="st-card p-4 bg-white flex flex-col gap-4">
              {displayAppointments.map((appt, idx) => (
                <div key={idx} className="flex flex-col gap-3.5 border-b border-slate-100 last:border-0 pb-3.5 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      {/* Doctor avatar fallback */}
                      <div className="w-full h-full bg-slate-200 text-slate-400 flex items-center justify-center text-sm font-bold">
                        {appt.doctorName.split(" ").pop()?.substring(0, 2).toUpperCase() || "DR"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-800">{appt.doctorName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{appt.dept}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 text-[10px] font-semibold text-slate-600 mt-1">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={12} className="text-slate-400" />
                      <span>{appt.dayLabel} · {appt.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-slate-400" />
                      <span>{appt.hospitalName}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={() => onNav("timeline")}
                className="st-btn-ghost w-full py-2.5 text-xs font-bold mt-2"
              >
                View Details
              </button>
            </div>
          </div>

          {/* Recent Reports */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800">Recent Reports</span>
              <button onClick={() => onNav("timeline")} className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer">View all</button>
            </div>

            <div className="st-card p-3 bg-white flex flex-col gap-2">
              {[
                { name: "Blood Report", date: "10 May 2025" },
                { name: "X-Ray Chest", date: "08 May 2025" },
                { name: "ECG Report", date: "05 May 2025" }
              ].map((rep, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                      <FileText size={14} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-700 leading-none">{rep.name}</div>
                      <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">{rep.date}</span>
                    </div>
                  </div>
                  <button className="text-[9px] font-extrabold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer">
                    PDF
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AI Health Insights robot widget */}
          <div className="st-card p-5 bg-white border border-slate-200 flex justify-between gap-3 relative overflow-hidden">
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-slate-800">AI Health Insights</span>
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-extrabold uppercase scale-90">Good</span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold mt-2.5 leading-relaxed">
                  Your heart rate and sleep patterns are within normal range.
                </p>
              </div>

              <div className="mt-4 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50 text-[9px] font-semibold text-blue-700 leading-normal">
                Tip: Try to walk for 30 mins daily to improve your health score.
              </div>
            </div>

            {/* Cute Vector Robot SVG character matching mockup */}
            <div className="w-20 h-24 shrink-0 flex items-end justify-center self-end opacity-90">
              <svg width="72" height="72" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="animate-bounce" style={{ animationDuration: "3s" }}>
                {/* Robot Head */}
                <rect x="25" y="25" width="50" height="40" rx="16" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="4" />
                {/* Screen background */}
                <rect x="33" y="32" width="34" height="22" rx="8" fill="#1E3A8A" />
                {/* Glowing Robot Eyes */}
                <circle cx="43" cy="43" r="3" fill="#60A5FA" className="animate-pulse" />
                <circle cx="57" cy="43" r="3" fill="#60A5FA" className="animate-pulse" />
                {/* Smile */}
                <path d="M46 49 Q50 52 54 49" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
                {/* Robot Body */}
                <rect x="35" y="68" width="30" height="24" rx="8" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="4" />
                {/* Heart on chest */}
                <path d="M50 82 L47 79 C44 76 41 74 41 72 C41 70 43 68 45 68 C47 68 49 70 50 71 C51 70 53 68 55 68 C57 68 59 70 59 72 C59 74 56 76 53 79 Z" fill="#EC4899" />
                {/* Antenna */}
                <line x1="50" y1="25" x2="50" y2="15" stroke="#3B82F6" strokeWidth="3" />
                <circle cx="50" cy="12" r="4" fill="#3B82F6" />
                {/* Robot Hands */}
                <path d="M25 45 C15 48 18 58 25 58" stroke="#3B82F6" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M75 45 C85 48 82 58 75 58" stroke="#3B82F6" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

/* --------------------------- Main Patient App Redesign --------------------------- */

export const PatientApp: React.FC = () => {
  const { user, patientProfile, logout } = useAuth();
  
  const [step, setStep] = useState<string>("auth");
  const [activeTab, setActiveTab] = useState<"dashboard" | "symptom" | "appointments" | "records" | "prescriptions" | "insurance" | "ai" | "analytics" | "settings">("dashboard");
  
  const [symptom, setSymptom] = useState<any>(null);
  const [emergency, setEmergency] = useState<boolean>(false);
  const [answers, setAnswers] = useState<any>(null);
  const [dept, setDept] = useState<string | null>(null);
  const [hospital, setHospital] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [opId, setOpId] = useState<string | null>(null);
  const [insurerId, setInsurerId] = useState<string>("none");
  const [upcomingAppts, setUpcomingAppts] = useState<any[]>([
    {
      hospitalName: "Horizon Multispecialty Hospital",
      doctorName: "Dr. Priya Vaidya",
      dept: "Cardiology",
      dayLabel: "Tomorrow",
      time: "10:00 AM",
      forName: "Aditi Rao"
    },
    {
      hospitalName: "Apex Care Institute",
      doctorName: "Dr. Amit Sharma",
      dept: "Neurology",
      dayLabel: "Friday",
      time: "02:30 PM",
      forName: "Aditi Rao"
    }
  ]);
  const [forWhom, setForWhom] = useState<any>(null);
  const [preferredDayKey, setPreferredDayKey] = useState<number>(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (user && user.role === "patient") {
      setStep("home");
    } else if (!user) {
      setStep("auth");
    }
  }, [user]);

  const restart = () => {
    setStep("home");
    setActiveTab("dashboard");
    setSymptom(null);
    setEmergency(false);
    setAnswers(null);
    setDept(null);
    setHospital(null);
    setBooking(null);
    setForWhom(null);
    setPreferredDayKey(0);
  };

  const handleSymptomSubmit = (s: any) => {
    setSymptom(s);
    if (s.is_emergency) {
      setEmergency(true);
      setStep("emergency");
    } else {
      setEmergency(false);
      setStep("consent");
    }
  };

  const handleBookingConfirm = async (doctorAss: any, day: any, slot: string, total: number) => {
    try {
      const dateStr = day.rawDate.toISOString().split("T")[0];
      const payload = {
        doctor_assignment_id: doctorAss.id,
        appointment_date: dateStr,
        appointment_time: slot,
        symptoms: symptom ? symptom.label : "General Checkup",
        is_emergency: emergency,
        for_name: forWhom ? forWhom.name : null,
        for_address: forWhom ? forWhom.address : null,
        for_city: forWhom ? forWhom.city : null,
        for_state: forWhom ? forWhom.state : null,
        for_pincode: forWhom ? forWhom.pincode : null,
      };

      await api.post("/appointments/book", payload);
      
      setBooking({ doctor: doctorAss, day, slot, total });
      const bookingForName = forWhom ? forWhom.name : patientProfile?.full_name;
      
      setUpcomingAppts((prev) => [
        ...prev,
        {
          hospitalName: hospital.branch_name.split(",")[0],
          doctorName: doctorAss.doctor.full_name,
          dept: dept || "General Medicine",
          dayLabel: day.label,
          time: slot,
          forName: bookingForName
        }
      ]);
      setStep("receipt");
    } catch (err) {
      console.error("Booking failed", err);
      alert("Failed to secure booking. Please choose another slot.");
    }
  };

  const bookingForName = forWhom ? forWhom.name : patientProfile?.full_name || "";
  const locationCity = forWhom ? forWhom.city : patientProfile?.city || "Mumbai";

  // Sidebar navigation mapping
  const menuItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "symptom" as const, label: "Symptom Checker", icon: HeartPulse },
    { id: "appointments" as const, label: "Appointments", icon: CalendarDays },
    { id: "records" as const, label: "Medical Records", icon: ClipboardListIcon },
    { id: "prescriptions" as const, label: "Prescriptions", icon: PillIcon },
    { id: "insurance" as const, label: "Insurance", icon: ShieldCheckIcon },
    { id: "ai" as const, label: "AI Assistant", icon: Sparkles },
    { id: "analytics" as const, label: "Health Analytics", icon: TrendingUp },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  // Helper mapping for ClipboardList and ShieldCheck (renamed to keep Lucide imports uniform)
  function ClipboardListIcon(props: any) { return <FileText {...props} />; }
  function ShieldCheckIcon(props: any) { return <Award {...props} />; }

  // Custom step-by-step triage screens switcher
  let triageView = null;
  if (step === "home") {
    triageView = <button onClick={() => setStep("whoFor")} className="st-btn-primary rounded-xl px-6 py-3 font-bold text-sm shadow-md cursor-pointer">Start New Symptom Triage Scan</button>;
  } else if (step === "whoFor") {
    triageView = <WhoForScreen onBack={restart} onNext={(w) => { setForWhom(w); setStep("symptom"); }} />;
  } else if (step === "symptom") {
    triageView = <SymptomScreen onSubmit={handleSymptomSubmit} />;
  } else if (step === "emergency") {
    triageView = <EmergencyScreen onBack={() => { setEmergency(false); setStep("symptom"); }} />;
  } else if (step === "consent") {
    triageView = <AdviceConsentScreen symptom={symptom} onChoice={(yes) => setStep(yes ? "questions" : "hospitalList")} />;
  } else if (step === "questions") {
    triageView = <AdviceQuestionsScreen onBack={() => setStep("consent")} onSubmit={(a) => { setAnswers(a); setStep("advice"); }} />;
  } else if (step === "advice") {
    triageView = <AdviceResultScreen symptom={symptom} answers={answers} onBack={() => setStep("questions")} onPick={(d) => { setDept(d); setStep("hospitalList"); }} />;
  } else if (step === "hospitalList") {
    triageView = <HospitalScreen dept={dept} city={locationCity} onBack={() => setStep(dept ? "advice" : "consent")} onPick={(h) => { setHospital(h); setStep("hospitalDetail"); }} />;
  } else if (step === "hospitalDetail") {
    triageView = <HospitalDetailScreen hospital={hospital} dept={dept} onBack={() => setStep("hospitalList")} onNext={(dayKey) => { setPreferredDayKey(dayKey); setStep("dateSlot"); }} />;
  } else if (step === "dateSlot") {
    triageView = (
      <DateSlotScreen
        hospital={hospital}
        dept={dept}
        initialDayKey={preferredDayKey}
        onBack={() => setStep("hospitalDetail")}
        onConfirm={handleBookingConfirm}
      />
    );
  } else if (step === "receipt" && booking && patientProfile) {
    triageView = (
      <ReceiptScreen
        bookingForName={bookingForName}
        hospital={hospital}
        doctor={booking.doctor}
        day={booking.day}
        slot={booking.slot}
        total={booking.total}
        onNext={() => setStep("medicine")}
      />
    );
  } else if (step === "medicine" && patientProfile) {
    triageView = <MedicineOfferScreen patientProfile={patientProfile} onDone={() => setStep("done")} />;
  } else if (step === "done") {
    triageView = <DoneScreen onRestart={restart} />;
  }

  // Cost planner switcher
  let insuranceView = null;
  if (step === "opSelect" || step === "home" || activeTab !== "insurance") {
    insuranceView = <OperationSelectScreen patientProfile={patientProfile!} onBack={restart} onNext={(o, i) => { setOpId(o); setInsurerId(i); setStep("opHospitals"); }} />;
  } else if (step === "opHospitals" && opId) {
    insuranceView = <OperationHospitalsScreen opId={opId} insurerId={insurerId} onBack={() => setStep("opSelect")} />;
  }

  if (step === "auth") {
    return <AuthScreen onSuccess={() => setStep("home")} />;
  }

  return (
    <div className="flex w-full min-h-screen bg-slate-50/50 text-slate-800">
      {/* Collapsible Left Sidebar */}
      <aside className={`bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between p-4 transition-all duration-300 ${sidebarCollapsed ? "w-16" : "w-64"}`}>
        <div className="flex flex-col gap-6">
          {/* Logo HUD */}
          <div className="flex items-center gap-2.5 px-2 py-1">
            <SaarthiLogo size={32} />
            {!sidebarCollapsed && (
              <div className="text-left">
                <span className="font-extrabold text-sm text-slate-850 block leading-none">Saathi</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">AI Health Platform</span>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id === "symptom") setStep("whoFor");
                    if (item.id === "insurance") setStep("opSelect");
                  }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold text-left transition-colors cursor-pointer ${
                    active 
                      ? "bg-blue-50/80 text-blue-600 border-l-2 border-l-blue-600" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon size={14} className={active ? "text-blue-600" : ""} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-2 border-t border-slate-200 pt-4">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 cursor-pointer">
            <Menu size={14} />
            {!sidebarCollapsed && <span>Collapse Sidebar</span>}
          </button>
          
          <button onClick={logout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 cursor-pointer">
            <LogOut size={14} />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>

          {!sidebarCollapsed && patientProfile && (
            <div className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-extrabold text-blue-600 overflow-hidden">
                  {patientProfile.full_name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-slate-800 leading-none">{patientProfile.full_name}</span>
                  <span className="text-[8px] text-slate-400 font-bold mt-0.5">Patient</span>
                </div>
              </div>
              <ChevronRight size={10} className="text-slate-400" />
            </div>
          )}
        </div>
      </aside>

      {/* Main Dashboard / Workspace Area */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50/30 overflow-x-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          {/* Left search */}
          <div className="flex items-center gap-2.5 w-80 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Search size={13} className="text-slate-400" />
            <input className="bg-transparent text-xs text-slate-800 outline-none w-full placeholder-slate-400" placeholder="Search anything..." />
          </div>

          {/* Right info avatar */}
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50">
              <Bell size={16} className="text-slate-500" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[8px] font-bold text-white flex items-center justify-center border border-white">3</span>
            </div>

            <div className="relative cursor-pointer w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50">
              <MessageSquare size={16} className="text-slate-500" />
            </div>

            <button 
              onClick={() => { setActiveTab("ai"); setStep("home"); }} 
              className="w-8 h-8 rounded-full bg-purple-50 hover:bg-purple-100 flex items-center justify-center text-purple-600 border border-purple-100 cursor-pointer"
            >
              <Sparkles size={14} />
            </button>

            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                {patientProfile?.full_name.substring(0, 2).toUpperCase() || "PA"}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-[11px] font-bold text-slate-800 leading-none">{patientProfile?.full_name || "Patient"}</span>
                <span className="text-[9px] text-slate-400 mt-0.5 font-bold uppercase">{patientProfile?.city || "Mumbai"}</span>
              </div>
              <ChevronRight size={10} className="text-slate-400 rotate-90 ml-0.5" />
            </div>
          </div>
        </header>

        {/* Content Workspace switcher */}
        <div className="flex-1 p-6 flex justify-center items-start">
          {activeTab === "dashboard" && patientProfile && (
            <HomeScreen
              patientProfile={patientProfile}
              upcoming={upcomingAppts}
              onNav={(dest) => {
                if (dest === "symptom") {
                  setActiveTab("symptom");
                  setStep("whoFor");
                } else if (dest === "timeline") {
                  setActiveTab("records");
                } else if (dest === "operation") {
                  setActiveTab("insurance");
                  setStep("opSelect");
                }
              }}
            />
          )}
          {activeTab === "symptom" && triageView}
          {activeTab === "appointments" && <AppointmentsListScreen upcoming={upcomingAppts} />}
          {activeTab === "records" && <HealthTimelineScreen onBack={() => setActiveTab("dashboard")} />}
          {activeTab === "prescriptions" && patientProfile && <PrescriptionsScreen patientProfile={patientProfile} onReorder={() => setActiveTab("prescriptions")} />}
          {activeTab === "insurance" && insuranceView}
          {activeTab === "ai" && patientProfile && <AiAssistantScreen patientProfile={patientProfile} />}
          {activeTab === "analytics" && <HealthAnalyticsScreen />}
          {activeTab === "settings" && patientProfile && <SettingsScreen patientProfile={patientProfile} />}
        </div>
      </div>
    </div>
  );
};
