import React, { useState, useEffect } from "react";
import {
  Building2, Mail, Lock, TrendingUp, Users, Bed, BarChart3,
  Sparkles, Wallet
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

/* ----------------------------- Sub-components ----------------------------- */

interface AuthScreenProps {
  onSuccess: () => void;
}

const HospitalAuthScreen: React.FC<AuthScreenProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("ops@horizonhospital.in");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slowRequest, setSlowRequest] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    setSlowRequest(false);
    const slowTimer = setTimeout(() => setSlowRequest(true), 5000);
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to log in as admin");
    } finally {
      clearTimeout(slowTimer);
      setLoading(false);
      setSlowRequest(false);
    }
  };

  return (
    <div className="st-card p-6 w-[380px] st-fade bg-white border border-slate-200 shadow-xl mx-auto mt-24 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <Building2 size={18} className="text-blue-600 animate-pulse" />
        <span className="st-mono text-[11px] tracking-wide text-slate-500 font-bold">HOSPITAL PORTAL</span>
      </div>
      <h2 className="st-display text-lg font-bold mb-4 text-slate-850">Sign in to hospital ops</h2>
      
      {error && <div className="p-3 mb-4 rounded-xl text-xs font-semibold bg-red-50 text-red-650 border border-red-200">{error}</div>}
      
      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold flex items-center gap-1.5 text-slate-650"><Mail size={12} /> Work email</label>
        <input className="st-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ops@horizonhospital.in" />
        
        <label className="text-xs font-semibold flex items-center gap-1.5 text-slate-650"><Lock size={12} /> Password</label>
        <input className="st-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        
        <button disabled={loading} onClick={handleLogin} className="st-btn-primary rounded-xl py-3 text-sm font-semibold mt-4 flex justify-center items-center gap-2 cursor-pointer shadow-md">
          {loading ? "Authenticating..." : "Log in"}
        </button>
        {slowRequest && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-lg font-medium flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span>Server is waking up — please keep this page open.</span>
          </div>
        )}
        <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">Demo credentials pre-filled. Tap Log in to continue.</p>
      </div>
    </div>
  );
};

/* ----------------------------- Main Dashboard ----------------------------- */

export const HospitalCommand: React.FC = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState("h1"); // h1 is Horizon Hospital

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const dbData = await api.get(`/analytics/admin/dashboard?branch_id=${selectedBranch}`);
      setData(dbData);
    } catch (err) {
      console.error("Failed to load command center details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "doctor")) {
      fetchDashboardData();
    }
  }, [user, selectedBranch]);

  // Recharts Chart Data prep
  const chartData = React.useMemo(() => {
    if (!data || !data.claims) return [];
    return data.claims.map((c: any) => ({
      insurer: c.insurer_name,
      Approved: c.approved,
      Pending: c.pending,
      Rejected: c.rejected,
    }));
  }, [data]);

  if (!user || (user.role !== "admin" && user.role !== "doctor")) {
    return <HospitalAuthScreen onSuccess={fetchDashboardData} />;
  }

  return (
    <div className="st-root min-h-screen w-full flex flex-col items-center py-8 px-4 bg-slate-50">
      <div className="flex items-center gap-2 mb-2">
        <Building2 size={22} className="text-blue-600 animate-pulse" />
        <span className="st-display text-2xl font-extrabold text-blue-600">Saathi Operations Command Center</span>
      </div>
      <p className="text-xs text-slate-500 mb-6 font-semibold">Hospital capacity planning and Business Intelligence dashboards</p>

      <div className="flex gap-3 mb-6 items-center flex-wrap justify-center">
        <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="st-input w-64 bg-white border border-slate-200 shadow-sm cursor-pointer text-slate-800 text-xs font-bold py-1.5 rounded-xl">
          <option value="h1">Horizon Multispecialty Hospital (Mumbai)</option>
          <option value="h2">Sundar Trauma &amp; Care Institute (Mumbai)</option>
          <option value="h3">Apex Care Institute (Mumbai)</option>
        </select>
        
        <button onClick={logout} className="st-mono text-[9px] font-bold text-slate-500 bg-white hover:bg-slate-50 px-3 py-1.5 rounded border border-slate-200 transition-colors shadow-sm cursor-pointer">
          Logout Command Center
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-slate-500 font-bold">Aggregating capacity forecasts...</div>
      ) : (
        <div className="grid md:grid-cols-3 gap-4 w-full max-w-5xl st-fade">
          {/* Capacity forecasts */}
          <div className="st-card p-5 md:col-span-2 border border-slate-200 bg-white shadow-sm rounded-2xl">
            <div className="st-mono text-[11px] text-slate-400 font-bold tracking-wider mb-1">REAL-TIME FORECASTS</div>
            <h3 className="st-display text-lg font-bold text-slate-800 mb-4">Capacity forecast, next 24h</h3>
            
            <div className="flex flex-col gap-3">
              {data.capacity_forecast.map((d: any) => (
                <div key={d.name} className={`rounded-xl border p-3.5 bg-slate-50/50 transition-all ${d.load > 90 ? "border-red-200 bg-red-50/20" : "border-slate-200"}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                      {d.name}
                      <TrendingUp size={13} className={d.trend === "up" ? "text-red-500" : d.trend === "down" ? "text-emerald-500 rotate-180" : "text-slate-400"} />
                    </span>
                    <span className="st-mono text-xs font-bold" style={{ color: d.load > 90 ? "#EF4444" : "#2563EB" }}>{d.load}%</span>
                  </div>
                  
                  <div className="st-bar mb-2">
                    <div style={{ width: `${d.load}%`, background: d.load > 90 ? "#EF4444" : d.load > 80 ? "#F59E0B" : "#10B981" }} />
                  </div>
                  
                  {d.action && (
                    <div className={`flex items-center gap-1.5 text-[10px] font-bold ${d.load > 90 ? "text-red-650" : "text-slate-500"}`}>
                      <Sparkles size={11} className={d.load > 90 ? "text-red-550" : "text-amber-500"} /> {d.action}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Metrics sidebar */}
          <div className="flex flex-col gap-4">
            <div className="st-card p-5 border border-slate-200 bg-white shadow-sm rounded-2xl">
              <div className="flex items-center gap-2 mb-2 text-slate-800">
                <Users size={16} className="text-blue-500" />
                <span className="text-sm font-bold">Aggregate workloads</span>
              </div>
              <p className="text-[10px] text-slate-500 mb-3 font-semibold leading-relaxed">
                De-identified and aggregated department workloads for operational planning.
              </p>
              <div className="text-[11px] st-mono font-bold text-blue-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                {Object.entries(data.workloads).map(([name, load]: any) => (
                  <div key={name} className="flex justify-between py-0.5">
                    <span className="text-slate-500 font-sans">{name}</span>
                    <span>{load}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="st-card p-5 border border-slate-200 bg-white shadow-sm rounded-2xl">
              <div className="flex items-center gap-2 mb-2 text-slate-800">
                <Bed size={16} className="text-amber-500" />
                <span className="text-sm font-bold">No-show trends</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                {data.no_show_trend.text || "Cancellations up 15% this week vs. 4-week average."}
              </p>
            </div>

            <div className="st-card p-5 border border-slate-200 bg-white shadow-sm rounded-2xl">
              <div className="flex items-center gap-2 mb-2 text-slate-800">
                <BarChart3 size={16} className="text-blue-600" />
                <span className="text-sm font-bold">Average wait accuracy</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Predicted vs. actual patient wait time deviation is within <span className="st-mono font-bold text-blue-650">6 min</span>, trending tighter week-over-week.
              </p>
            </div>
          </div>

          <div className="st-card p-5 md:col-span-3 border border-slate-200 bg-white shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="text-blue-500" />
              <span className="text-sm font-bold text-slate-800">Insurance empanelment &amp; claim reviews</span>
            </div>
            <p className="text-[10px] text-slate-500 mb-6 font-semibold">
              Tracks pending, approved, and rejected cashless claims by insurer, so billing loops can resolve aged claims.
            </p>
            
            <div className="h-64 w-full pr-4 text-xs font-semibold">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="insurer" stroke="#64748B" tickLine={false} />
                  <YAxis stroke="#64748B" tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.01)" }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: 10 }} />
                  <Bar dataKey="Approved" stackId="claims" fill="#10B981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Pending" stackId="claims" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Rejected" stackId="claims" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 flex flex-col gap-2.5">
              {data.claims.map((c: any) => {
                const total = c.pending + c.approved + c.rejected;
                const rejRate = total > 0 ? Math.round((c.rejected / total) * 100) : 0;
                return (
                  <div key={c.id} className="flex justify-between items-center text-[10px] font-bold border border-slate-200 p-2 rounded-xl bg-slate-50/60 flex-wrap gap-2 text-slate-700">
                    <span>{c.insurer_name}</span>
                    <span className={rejRate >= 12 ? "text-red-500" : "text-slate-500"}>{rejRate}% rejection rate ({c.rejected} / {total})</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
