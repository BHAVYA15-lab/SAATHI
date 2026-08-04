import React, { createContext, useState, useEffect, useContext } from "react";
import { api } from "../api";

export interface UserProfile {
  email: string;
  id: string;
  role: string;
  is_verified: boolean;
  is_active: boolean;
}

export interface PatientProfile {
  id: string;
  user_id: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  blood_group?: string;
  emergency_contact?: string;
  profile_image?: string;
  chronic_conditions?: string[];
  insurer_id?: string;
  city?: string;
  pincode?: string;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  full_name: string;
  registration_number?: string;
  qualification?: string;
  specialization?: string;
  experience_years?: number;
  bio?: string;
  consultation_fee?: number;
  languages?: string;
  profile_image?: string;
  average_rating?: number;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  patientProfile: PatientProfile | null;
  doctorProfile: DoctorProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: any) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfileDetails = async (currentUser: UserProfile) => {
    try {
      if (currentUser.role === "patient") {
        const pData = await api.get("/auth/me/patient");
        setPatientProfile(pData);
        setDoctorProfile(null);
      } else if (currentUser.role === "doctor") {
        const dData = await api.get("/auth/me/doctor");
        setDoctorProfile(dData);
        setPatientProfile(null);
      } else {
        setPatientProfile(null);
        setDoctorProfile(null);
      }
    } catch (err) {
      console.error("Failed to load sub-profile", err);
    }
  };

  const loadCurrentUser = async () => {
    try {
      setLoading(true);
      const uData = await api.get("/auth/me");
      setUser(uData);
      await fetchProfileDetails(uData);
    } catch (err) {
      console.error("Failed to load user info, logging out...", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await api.post("/auth/login-json", { email, password });
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
  };

  const signup = async (payload: any) => {
    const data = await api.post("/auth/signup", payload);
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setPatientProfile(null);
    setDoctorProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfileDetails(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        patientProfile,
        doctorProfile,
        loading,
        login,
        signup,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
