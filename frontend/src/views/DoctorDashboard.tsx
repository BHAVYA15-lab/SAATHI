import React, { useState, useEffect, useMemo } from "react";
import {
  Stethoscope, Mail, Lock, PlusCircle,
  Moon, History, FileText, BarChart3, ClipboardList
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { api, request } from "../api";
import { Pill } from "../components/SmallUi";

const TIME_OPTIONS = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];
const DURATIONS = [{ label: "30 min", mins: 30 }, { label: "1 hour", mins: 60 }, { label: "2 hours", mins: 120 }];

function next7Days() {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const out = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({ key: i, label: i === 0 ? "Today" : days[d.getDay()], date: d.getDate(), rawDate: d });
  }
  return out;
}


// Mock patients no-show history risk
const NO_SHOW_HISTORY: Record<string, number> = { "R. Mehta": 1, "S. Iyer": 0, "A. Rao": 2, "K. Nair": 0 };

function noShowRisk(patientTag: string) {
  const n = NO_SHOW_HISTORY[patientTag] ?? 0;
  if (n >= 2) return { label: "High no-show risk", tone: "coral" as const };
  if (n === 1) return { label: "Moderate no-show risk", tone: "saffron" as const };
  return null;
}


/* ----------------------------- Sub-components ----------------------------- */

interface AuthScreenProps {
  onSuccess: () => void;
}

const DoctorAuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("dr.vaidya@apexcare.in");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to log in as doctor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="st-card p-6 w-[380px] st-fade bg-white border border-slate-200 shadow-xl mx-auto mt-24 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Stethoscope size={18} className="text-blue-600" />
        <span className="st-mono text-[11px] tracking-wide text-slate-500 font-bold">DOCTOR PORTAL</span>
      </div>
      <h2 className="st-display text-lg font-bold mb-4 text-slate-800">Sign in to your practice</h2>
      
      {error && <div className="p-3 mb-4 rounded-xl text-xs font-semibold bg-red-50 text-red-650 border border-red-200">{error}</div>}
      
      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold flex items-center gap-1.5 text-slate-600"><Mail size={12} /> Email</label>
        <input className="st-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="dr.vaidya@apexcare.in" />
        
        <label className="text-xs font-semibold flex items-center gap-1.5 text-slate-600"><Lock size={12} /> Password</label>
        <input className="st-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        
        <button disabled={loading} onClick={handleLogin} className="st-btn-primary rounded-xl py-3 text-sm font-semibold mt-4 flex justify-center items-center gap-2 cursor-pointer shadow-md">
          {loading ? "Authenticating..." : "Log in"}
        </button>
        <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">Demo credentials pre-filled. Tap Log in to continue.</p>
      </div>
    </div>
  );
};

interface RxFormProps {
  onSave: (diagnosis: string, treatment: string) => void;
  onCancel: () => void;
}

const RxForm: React.FC<RxFormProps> = ({ onSave, onCancel }) => {
   const [diagnosis, setDiagnosis] = useState("");
   const [treatment, setTreatment] = useState("");
   const canSave = diagnosis.trim() && treatment.trim();
   
   return (
     <div className="mt-3 pt-3 st-fade border-t border-dashed border-slate-200 text-xs">
       <div className="flex flex-col gap-2">
         <label className="font-bold text-slate-700">Diagnosis</label>
         <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Mild cardiac arrhythmia, stable"
           className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-blue-500 bg-slate-50 text-slate-800 font-mono" />
         
         <label className="font-bold text-slate-700">Treatment / Prescription</label>
         <textarea value={treatment} onChange={(e) => setTreatment(e.target.value)} rows={2} placeholder="e.g. Atorvastatin 10mg OD, review in 4 weeks"
           className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none focus:border-blue-500 bg-slate-50 text-slate-800 font-mono" />
       </div>
       
       <div className="flex gap-2 mt-3">
         <button disabled={!canSave} onClick={() => onSave(diagnosis, treatment)} className="st-btn-primary rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-40 shadow-sm cursor-pointer">
           Save prescription &amp; complete
         </button>
         <button onClick={onCancel} className="st-btn-ghost rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm cursor-pointer">
           Cancel
         </button>
       </div>
       <p className="text-[9px] text-slate-400 mt-2 font-semibold">This record is instantly appended to the patient's secure health timeline.</p>
     </div>
   );
 };

/* ----------------------------- Main Dashboard ----------------------------- */

export const DoctorDashboard: React.FC = () => {
  const { user, doctorProfile, logout } = useAuth();
  const days = useMemo(() => next7Days(), []);
  
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingAvail, setAddingAvail] = useState(false);
  
  const [formHospital, setFormHospital] = useState("h3"); // Apex Care by default
  const [formDay, setFormDay] = useState(0);
  const [formStart, setFormStart] = useState("11:00 AM");
  const [formDuration, setFormDuration] = useState(60);
  
  const [opsScheduled] = useState(8);
  const [opsDone] = useState(5);
  
  const [openHistoryId, setOpenHistoryId] = useState<string | null>(null);
  const [openRxId, setOpenRxId] = useState<string | null>(null);
  const [patientHistories, setPatientHistories] = useState<Record<string, any[]>>({});

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const data = await api.get("/analytics/doctor/schedule");
      
      const defaultSlots = [
        {
          id: "seed-1",
          appointment_date: days[0].rawDate.toISOString().split("T")[0],
          appointment_time: "9:00 AM",
          status: "booked",
          patient: { id: "seed-p1", full_name: "R. Mehta" },
          assignment: { branch: { branch_name: "Apex Care Institute" } }
        },
        {
          id: "seed-2",
          appointment_date: days[0].rawDate.toISOString().split("T")[0],
          appointment_time: "9:20 AM",
          status: "booked",
          patient: { id: "seed-p2", full_name: "S. Iyer" },
          assignment: { branch: { branch_name: "Apex Care Institute" } }
        },
        {
          id: "seed-3",
          appointment_date: days[0].rawDate.toISOString().split("T")[0],
          appointment_time: "9:40 AM",
          status: "open",
          patient: null,
          assignment: { branch: { branch_name: "Apex Care Institute" } }
        },
        {
          id: "seed-4",
          appointment_date: (days.find(d => d.label === "Sat") || days[6]).rawDate.toISOString().split("T")[0],
          appointment_time: "4:00 PM",
          status: "booked",
          patient: { id: "seed-p3", full_name: "A. Rao" },
          assignment: { branch: { branch_name: "Horizon Multispecialty Hospital" } }
        },
        {
          id: "seed-5",
          appointment_date: (days.find(d => d.label === "Sat") || days[6]).rawDate.toISOString().split("T")[0],
          appointment_time: "4:20 PM",
          status: "open",
          patient: null,
          assignment: { branch: { branch_name: "Horizon Multispecialty Hospital" } }
        }
      ];

      const merged = [...defaultSlots];
      
      data.forEach((backendSlot: any) => {
        const matchIdx = merged.findIndex(m => 
          m.appointment_date === backendSlot.appointment_date && 
          m.appointment_time === backendSlot.appointment_time
        );
        if (matchIdx !== -1) {
          merged[matchIdx] = backendSlot;
        } else {
          merged.push(backendSlot);
        }
      });

      merged.sort((a, b) => {
        if (a.appointment_date !== b.appointment_date) {
          return a.appointment_date.localeCompare(b.appointment_date);
        }
        return a.appointment_time.localeCompare(b.appointment_time);
      });

      setSchedule(merged);
    } catch (err) {
      console.error("Failed to load doctor schedule", err);
      // Fallback
      const defaultSlots = [
        {
          id: "seed-1",
          appointment_date: days[0].rawDate.toISOString().split("T")[0],
          appointment_time: "9:00 AM",
          status: "booked",
          patient: { id: "seed-p1", full_name: "R. Mehta" },
          assignment: { branch: { branch_name: "Apex Care Institute" } }
        },
        {
          id: "seed-2",
          appointment_date: days[0].rawDate.toISOString().split("T")[0],
          appointment_time: "9:20 AM",
          status: "booked",
          patient: { id: "seed-p2", full_name: "S. Iyer" },
          assignment: { branch: { branch_name: "Apex Care Institute" } }
        },
        {
          id: "seed-3",
          appointment_date: days[0].rawDate.toISOString().split("T")[0],
          appointment_time: "9:40 AM",
          status: "open",
          patient: null,
          assignment: { branch: { branch_name: "Apex Care Institute" } }
        },
        {
          id: "seed-4",
          appointment_date: (days.find(d => d.label === "Sat") || days[6]).rawDate.toISOString().split("T")[0],
          appointment_time: "4:00 PM",
          status: "booked",
          patient: { id: "seed-p3", full_name: "A. Rao" },
          assignment: { branch: { branch_name: "Horizon Multispecialty Hospital" } }
        },
        {
          id: "seed-5",
          appointment_date: (days.find(d => d.label === "Sat") || days[6]).rawDate.toISOString().split("T")[0],
          appointment_time: "4:20 PM",
          status: "open",
          patient: null,
          assignment: { branch: { branch_name: "Horizon Multispecialty Hospital" } }
        }
      ];
      setSchedule(defaultSlots);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "doctor" && doctorProfile) {
      fetchSchedule();
    }
  }, [user, doctorProfile]);

  const loadPatientHistory = async (appt: any) => {
    if (openHistoryId === appt.id) {
      setOpenHistoryId(null);
      return;
    }
    
    // Check cache safely
    const pId = appt.patient?.id || appt.id;
    if (patientHistories[pId]) {
      setOpenHistoryId(appt.id);
      return;
    }
    
    try {
      const completedHistory = schedule.filter(s => s.patient?.id === pId && s.status === "completed");
      const seedHistory = [
        { date: "20 Apr 2026", note: "Hypertension follow-up, BP controlled on current dosage." },
        { date: "10 Jan 2026", note: "Initial consult for chest discomfort; stress test done, result normal." }
      ];
      
      setPatientHistories(prev => ({
        ...prev,
        [pId]: completedHistory.length 
          ? completedHistory.map(h => ({ date: h.appointment_date, note: h.medical_record?.treatment || "Routine consult completed." })) 
          : seedHistory
      }));
      setOpenHistoryId(appt.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAvailability = async () => {
    setAddingAvail(true);
    const selDay = days.find(d => d.key === formDay);
    if (!selDay) return;
    
    const dateStr = selDay.rawDate.toISOString().split("T")[0];
    try {
      await api.post(`/analytics/doctor/add-availability?branch_id=${formHospital}&slot_date=${dateStr}&start_time_str=${formStart}&duration_mins=${formDuration}`, {});
      await fetchSchedule();
      alert("Availability added successfully!");
    } catch (err) {
      console.error(err);
      
      const slotsCount = Math.floor(formDuration / 20);
      const newSlots: any[] = [];
      const branchName = formHospital === "h3" ? "Apex Care Institute" : "Horizon Multispecialty Hospital";
      
      for (let i = 0; i < slotsCount; i++) {
        const [timePart, ampm] = formStart.split(" ");
        const [hr, min] = timePart.split(":");
        const calculatedMin = (Number(min) + i * 20) % 60;
        const calculatedHr = Number(hr) + Math.floor((Number(min) + i * 20) / 60);
        const calculatedMinStr = calculatedMin.toString().padStart(2, "0");
        const newTimeStr = `${calculatedHr}:${calculatedMinStr} ${ampm}`;
        
        newSlots.push({
          id: `seed-added-${Date.now()}-${i}`,
          appointment_date: dateStr,
          appointment_time: newTimeStr,
          status: "open",
          patient: null,
          assignment: { branch: { branch_name: branchName } }
        });
      }
      
      setSchedule(prev => [...prev, ...newSlots]);
      alert("Availability slots allocated successfully (simulated)!");
    } finally {
      setAddingAvail(false);
    }
  };

  const handleCompleteRx = async (apptId: string, diagnosis: string, treatment: string) => {
    try {
      if (apptId.startsWith("seed-")) {
        setSchedule(prev => prev.map(s => {
          if (s.id === apptId) {
            return {
              ...s,
              status: "completed",
              patient: s.patient || { id: "seed-p", full_name: "Mock Patient" },
              assignment: s.assignment || { branch: { branch_name: "Apex Care Institute" } }
            };
          }
          return s;
        }));
        setOpenRxId(null);
        alert("Prescription saved and appointment completed (simulated)!");
      } else {
        await api.post(`/analytics/doctor/complete-appointment/${apptId}`, {
          diagnosis,
          treatment,
          follow_up_date: null
        });
        setOpenRxId(null);
        await fetchSchedule();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save prescription.");
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      if (!slotId.startsWith("seed-")) {
        try {
          await request(`/analytics/doctor/slots/${slotId}`, { method: "DELETE" });
        } catch(e) {
          // ignore
        }
      }
      setSchedule(prev => prev.filter(s => s.id !== slotId));
    } catch (err) {
      console.error(err);
    }
  };

  const dayUtilization = useMemo(() => {
    return days.map((d) => {
      const dateStr = d.rawDate.toISOString().split("T")[0];
      const daySlots = schedule.filter((s) => s.appointment_date === dateStr);
      const total = daySlots.length;
      const booked = daySlots.filter((s) => s.status === "booked" || s.status === "completed").length;
      return { ...d, total, booked, pct: total ? Math.round((booked / total) * 100) : null };
    });
  }, [schedule, days]);

  const highLoadDays = dayUtilization.filter((d) => d.pct !== null && d.pct >= 85).length;

  const baseTakenOffset = 38;
  const bookedThisWeek = schedule.filter((s) => s.status === "booked" || s.status === "completed").length;

  
  const monthTaken = baseTakenOffset + bookedThisWeek;

  if (!user || user.role !== "doctor" || !doctorProfile) {
    return <DoctorAuthScreen onSuccess={fetchSchedule} />;
  }

  return (
    <div className="st-root min-h-screen w-full flex flex-col items-center py-8 px-6 bg-slate-50">
      <div className="flex items-center gap-2 mb-2">
        <Stethoscope size={22} className="text-blue-600 animate-pulse" />
        <span className="st-display text-2xl font-extrabold text-blue-600">Saathi Doctor Portal</span>
      </div>
      <p className="text-xs text-slate-500 mb-6 font-semibold">Physician scheduling command console</p>

      <button onClick={logout} className="st-mono text-[9px] font-bold text-slate-500 bg-white hover:bg-slate-50 px-3 py-1.5 rounded border border-slate-200 transition-colors shadow-sm mb-6 cursor-pointer">
        Logout Portal
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full max-w-[1500px] st-fade">
        {/* Metric Header Card */}
        <div className="st-card p-5 lg:col-span-12 border border-slate-200 bg-white shadow-sm rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="st-mono text-[11px] text-slate-400 font-bold tracking-wider">DOCTOR DASHBOARD</div>
              <h3 className="st-display text-lg font-bold text-slate-800">{doctorProfile.full_name} · {doctorProfile.specialization}</h3>
            </div>
            <Pill tone={highLoadDays >= 3 ? "coral" : "teal"}>{highLoadDays >= 3 ? "BUSY WEEK" : "MANAGEABLE"}</Pill>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="rounded-xl p-3.5 bg-slate-50 border border-slate-200/60">
              <div className="st-mono text-xl font-extrabold text-blue-600">{monthTaken}</div>
              <div className="text-[10px] text-slate-500 mt-1 font-bold">Appointments completed this month</div>
            </div>
            <div className="rounded-xl p-3.5 bg-slate-50 border border-slate-200/60">
              <div className="st-mono text-xl font-extrabold text-teal">{bookedThisWeek}</div>
              <div className="text-[10px] text-slate-500 mt-1 font-bold font-sans">Active bookings this week</div>
            </div>
            <div className="rounded-xl p-3.5 bg-slate-50 border border-slate-200/60">
              <div className="st-mono text-xl font-extrabold text-amber-600">{opsDone}/{opsScheduled}</div>
              <div className="text-[10px] text-slate-500 mt-1 font-bold">Planned procedures executed</div>
            </div>
          </div>
        </div>

        {/* Left Column (Allocate, Workload, Benchmarks, Referrals) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Add Availability Form */}
          <div className="st-card p-5 border border-slate-200 bg-white shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-3 text-slate-850">
              <PlusCircle size={16} className="text-blue-600" />
              <span className="text-sm font-bold">Allocate availability blocks</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-3 font-semibold leading-relaxed">
              Pick a branch location, day, and block duration. The scheduler will split it into 20-min patient slots.
            </p>
            
            <div className="flex flex-col gap-2 mb-3">
              <select className="st-input" value={formHospital} onChange={(e) => setFormHospital(e.target.value)}>
                <option value="h3">Apex Care Institute (Worli)</option>
                <option value="h1">Horizon Multispecialty (Santacruz)</option>
              </select>
              
              <select className="st-input" value={formDay} onChange={(e) => setFormDay(Number(e.target.value))}>
                {days.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label} ({d.date})
                  </option>
                ))}
              </select>
              
              <div className="flex gap-2">
                <select className="st-input" value={formStart} onChange={(e) => setFormStart(e.target.value)}>
                  {TIME_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select className="st-input" value={formDuration} onChange={(e) => setFormDuration(Number(e.target.value))}>
                  {DURATIONS.map((d) => <option key={d.mins} value={d.mins}>{d.label}</option>)}
                </select>
              </div>
            </div>
            
            <button disabled={addingAvail} onClick={handleAddAvailability} className="st-btn-primary w-full rounded-lg py-2.5 text-xs font-bold shadow-sm cursor-pointer">
              {addingAvail ? "Allocating..." : `Add ${Math.floor(formDuration / 20)} slots of 20 min`}
            </button>
          </div>

          {/* Workload index Chart */}
          <div className="st-card p-5 border border-slate-200 bg-white shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-2 text-slate-850">
              <Moon size={16} className="text-amber-500" />
              <span className="text-sm font-bold">Availability / Workload load</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-3 font-semibold leading-relaxed">
              Private workload tracker. Individual physician utilization is hidden from hospital boards.
            </p>
            
            <div className="flex items-end gap-1.5 h-16 mb-2 px-2">
              {dayUtilization.map((d, i) => (
                <div key={i} title={`${d.label}: ${d.pct ?? "no data"}`} className="flex-1 rounded-t transition-all duration-300 cursor-pointer"
                  style={{
                    height: `${d.pct ?? 6}%`,
                    background: d.pct === null ? "#E2E8F0" : d.pct >= 85 ? "#EF4444" : d.pct >= 65 ? "#F59E0B" : "#10B981"
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between text-[9px] text-slate-400 font-bold mb-2 px-1">
              <span>{days[0].label.toUpperCase()}</span>
              <span>{days[6].label.toUpperCase()}</span>
            </div>
            <div className={`text-xs font-bold mt-3 ${highLoadDays >= 3 ? "text-red-500" : "text-slate-500"}`}>
              {highLoadDays} of 7 days at 85%+ booked capacity
            </div>
          </div>

          {/* Peer Benchmark statistics */}
          <div className="st-card p-5 border border-slate-200 bg-white shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-2 text-slate-800">
              <BarChart3 size={16} className="text-blue-600" />
              <span className="text-sm font-bold">Peer benchmark</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-4 font-semibold leading-relaxed">
              Anonymized against Cardiology department peers — no individual names shown to you either.
            </p>
            
            <div className="flex flex-col gap-3 mt-3 text-xs font-semibold">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Avg. consult time</span>
                <span className="st-mono text-slate-800">
                  <span className="text-emerald-600 font-extrabold">14 min</span> <span className="text-slate-400 font-medium">vs 17 min</span>
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">No-show rate</span>
                <span className="st-mono text-slate-800">
                  <span className="text-emerald-600 font-extrabold">6%</span> <span className="text-slate-400 font-medium">vs 9%</span>
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 last:border-0">
                <span className="text-slate-500">Follow-up adherence</span>
                <span className="st-mono text-slate-800">
                  <span className="text-amber-600 font-extrabold">71%</span> <span className="text-slate-400 font-medium">vs 78%</span>
                </span>
              </div>
            </div>
          </div>

          {/* Referrals sent list */}
          <div className="st-card p-5 border border-slate-200 bg-white shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-2 text-slate-800">
              <ClipboardList size={16} className="text-amber-500" />
              <span className="text-sm font-bold">Referral loop closures</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-3 font-semibold leading-relaxed">
              Tracks whether outpatient referrals led to completed reviews — closing the feedback loop.
            </p>
            <div className="grid grid-cols-1 gap-2 text-xs">
              {[
                { patient: "S. Iyer", to: "Radiology · Dr. Bhatt", status: "Completed" },
                { patient: "R. Mehta", to: "Endocrinology", status: "Pending" },
                { patient: "A. Rao", to: "Diagnostics — lipid panel", status: "Completed" },
              ].map((r, i) => (
                <div key={i} className="flex items-center justify-between border border-slate-200 p-2.5 rounded-xl bg-slate-50/60 font-medium text-slate-700">
                  <span>{r.patient} → <span className="font-bold">{r.to}</span></span>
                  <Pill tone={r.status === "Completed" ? "teal" : "saffron"}>{r.status.toUpperCase()}</Pill>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Live Schedule bookings board) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="st-card p-5 border border-slate-200 bg-white shadow-sm rounded-2xl">
            <div className="text-sm font-bold text-slate-800 mb-4">This week's schedule, by hospital</div>
            
            {loading ? (
              <div className="text-center py-12 text-xs text-slate-500 font-bold">Loading schedule board...</div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[700px] overflow-y-auto st-scroll pr-1 pb-4">
                {schedule.map((s) => {
                  const dayTag = days.find((d) => d.rawDate.toISOString().split("T")[0] === s.appointment_date);
                  const dayLabel = dayTag?.label || (s.appointment_date === days[0].rawDate.toISOString().split("T")[0] ? "Today" : s.appointment_date);
                  
                  const risk = s.status === "booked" ? noShowRisk(s.patient?.full_name) : null;
                  const pHistory = patientHistories[s.patient?.id || s.id] || [];
                  
                  return (
                    <div key={s.id} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between border border-slate-200 p-4 rounded-xl bg-white hover:shadow-sm transition-all text-xs flex-wrap gap-y-2">
                        {/* Left: Time and Hospital */}
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800">
                            {dayLabel} <span className="font-extrabold text-blue-600 ml-1">{s.appointment_time}</span>
                          </span>
                          <span className="text-slate-400 font-bold">{s.assignment?.branch?.branch_name.split(",")[0] || s.assignment?.branch_name || "Apex Care Institute"}</span>
                        </div>

                        {/* Right: Actions and Patient */}
                        <div className="flex items-center gap-4 flex-wrap">
                          {s.status === "booked" ? (
                            <>
                              {/* Patient Pill */}
                              <span className="bg-teal-50 border border-teal-200 text-teal-700 px-2.5 py-1 rounded-lg font-bold">
                                {s.patient?.full_name}
                              </span>

                              {/* Risk Pill */}
                              {risk && (
                                <span className={`px-2.5 py-1 rounded-lg font-bold border ${
                                  risk.tone === "coral" 
                                    ? "bg-red-50 border-red-200 text-red-650" 
                                    : "bg-amber-50 border-amber-200 text-amber-600"
                                }`}>
                                  {risk.label.toUpperCase()}
                                </span>
                              )}

                              {/* Actions */}
                              <div className="flex items-center gap-3 font-bold text-amber-600">
                                <button onClick={() => loadPatientHistory(s)} className="flex items-center gap-1 hover:text-amber-700 cursor-pointer transition-colors">
                                  <History size={12} /> History
                                </button>
                                <button onClick={() => setOpenRxId(openRxId === s.id ? null : s.id)} className="flex items-center gap-1 hover:text-amber-700 cursor-pointer transition-colors">
                                  <FileText size={12} /> {openRxId === s.id ? "Cancel Rx" : "Complete + Rx"}
                                </button>
                              </div>
                            </>
                          ) : s.status === "completed" ? (
                            <>
                              <span className="bg-slate-100 border border-slate-200 text-slate-500 px-2.5 py-1 rounded-lg font-bold">
                                {s.patient?.full_name}
                              </span>
                              <span className="bg-teal-50 border border-teal-200 text-teal-700 px-2.5 py-1 rounded-lg font-bold uppercase">
                                Completed
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="border border-slate-200 text-slate-500 bg-white px-3 py-1 rounded-lg font-bold text-[10px]">
                                OPEN
                              </span>
                              <button 
                                onClick={() => handleDeleteSlot(s.id)}
                                className="text-slate-400 hover:text-red-500 cursor-pointer p-1 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Patient Clinical History Toggle panel */}
                      {openHistoryId === s.id && (
                        <div className="st-fade border border-slate-200 bg-slate-50/50 p-3.5 rounded-xl ml-4 shadow-inner">
                          <p className="text-[10px] text-slate-500 font-bold tracking-wider mb-2 uppercase">Prior Discharges &amp; Consults</p>
                          {pHistory.map((h: any, idx: number) => (
                            <div key={idx} className="flex gap-3 py-2 border-b border-slate-200/60 last:border-0 text-xs">
                              <span className="st-mono shrink-0 text-slate-400 font-bold">{h.date}</span>
                              <span className="text-slate-700 font-medium">{h.note}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Complete & Write Rx Prescription Form panel */}
                      {openRxId === s.id && (
                        <div className="ml-4">
                          <RxForm
                            onSave={(diagnosis, treatment) => handleCompleteRx(s.id, diagnosis, treatment)}
                            onCancel={() => setOpenRxId(null)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {schedule.length === 0 && (
                  <div className="text-center text-[10px] text-slate-400 font-medium py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/30">
                    No appointments booked on Saathi for you this week.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
