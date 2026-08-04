import json
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import date, time, datetime

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: str = "patient"  # patient | doctor | admin
    full_name: str
    age: Optional[int] = None
    city: Optional[str] = None
    pincode: Optional[str] = None
    conditions: Optional[List[str]] = ["None"]
    insurer_id: Optional[str] = "none"

class UserResponse(UserBase):
    id: str
    role: str
    is_verified: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Patient Schemas
class PatientResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_contact: Optional[str] = None
    profile_image: Optional[str] = None
    chronic_conditions: Optional[List[str]] = []
    insurer_id: Optional[str] = "none"
    city: Optional[str] = "Mumbai"
    pincode: Optional[str] = None

    @field_validator("chronic_conditions", mode="before")
    @classmethod
    def parse_chronic_conditions(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v or []

    class Config:
        from_attributes = True

# Doctor Schemas
class DoctorResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    registration_number: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: Optional[int] = None
    bio: Optional[str] = None
    consultation_fee: Optional[float] = None
    languages: Optional[str] = None
    profile_image: Optional[str] = None
    average_rating: Optional[float] = 0.0

    class Config:
        from_attributes = True

# Department Schemas
class DepartmentResponse(BaseModel):
    id: str
    branch_id: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

# Hospital & HospitalBranch Schemas
class HospitalResponse(BaseModel):
    id: str
    name: str
    hospital_code: str
    type: Optional[str] = None
    website: Optional[str] = None

    class Config:
        from_attributes = True

class HospitalBranchResponse(BaseModel):
    id: str
    hospital_id: str
    branch_code: str
    branch_name: str
    address: Optional[str] = None
    city: str
    state: str
    pincode: str
    distance_km: Optional[float] = None
    rating: Optional[float] = None
    wait_min: Optional[int] = None
    cost_band: Optional[str] = None
    emergency: bool
    consult_fee: Optional[int] = None
    years: Optional[int] = None
    accreditation: Optional[str] = None
    insurers: List[str] = []
    about: Optional[str] = None
    why: Optional[str] = None
    specialisation: Dict[str, int] = {}
    hospital: HospitalResponse

    @field_validator("insurers", mode="before")
    @classmethod
    def parse_insurers(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v or []

    @field_validator("specialisation", mode="before")
    @classmethod
    def parse_specialisation(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return {}
        return v or {}

    class Config:
        from_attributes = True

# DoctorAssignment Schemas
class DoctorAssignmentResponse(BaseModel):
    id: str
    doctor: DoctorResponse
    branch_id: str
    department: DepartmentResponse
    consultation_fee: Optional[float] = None
    working_days: List[str] = []
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_available: bool

    @field_validator("working_days", mode="before")
    @classmethod
    def parse_working_days(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except:
                return []
        return v or []

    class Config:
        from_attributes = True

# Appointment Schemas
class AppointmentCreate(BaseModel):
    doctor_assignment_id: str
    appointment_date: date
    appointment_time: str
    symptoms: Optional[str] = None
    is_emergency: Optional[bool] = False
    for_name: Optional[str] = None
    for_address: Optional[str] = None
    for_city: Optional[str] = None
    for_state: Optional[str] = None
    for_pincode: Optional[str] = None

class MedicalRecordResponse(BaseModel):
    id: str
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    follow_up_date: Optional[date] = None

    class Config:
        from_attributes = True

class AppointmentResponse(BaseModel):
    id: str
    booking_id: str
    appointment_date: date
    appointment_time: str
    status: str
    symptoms: Optional[str] = None
    notes: Optional[str] = None
    feedback_right_call: Optional[bool] = None
    patient: Optional[PatientResponse] = None
    assignment: Optional[DoctorAssignmentResponse] = None
    medical_record: Optional[MedicalRecordResponse] = None

    class Config:
        from_attributes = True

# Timeline Feedback
class FeedbackSubmit(BaseModel):
    feedback_right_call: bool

# Prescription Complete Request
class PrescriptionCreate(BaseModel):
    diagnosis: str
    treatment: str
    follow_up_date: Optional[date] = None

# Operations Schemas
class OperationResponse(BaseModel):
    id: str
    name: str
    days: Optional[str] = None
    base_cost: int

    class Config:
        from_attributes = True

# Command Center & Claims Schemas
class ClaimsRecordResponse(BaseModel):
    id: str
    insurer_name: str
    pending: int
    approved: int
    rejected: int

    class Config:
        from_attributes = True

class DeptCapacityResponse(BaseModel):
    name: str
    load: int
    trend: str  # up | down | flat
    action: Optional[str] = None

class CommandCenterResponse(BaseModel):
    capacity_forecast: List[DeptCapacityResponse]
    workloads: Dict[str, int]
    no_show_trend: Dict[str, Any]
    claims: List[ClaimsRecordResponse]

# Symptom Checker request/response
class SymptomCheckRequest(BaseModel):
    text: str

class RoutedDeptInfo(BaseModel):
    name: str
    conf: str  # Likely | Possible
    why: str

class SymptomCheckResponse(BaseModel):
    symptom_id: str
    label: str
    is_emergency: bool
    routed_departments: List[RoutedDeptInfo]
