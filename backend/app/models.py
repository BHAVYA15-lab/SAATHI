import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, Float, Date, Time, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="patient")  # patient | doctor | admin
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient_profile = relationship("Patient", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = relationship("Doctor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(50), nullable=True)
    blood_group = Column(String(10), nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    profile_image = Column(String(255), nullable=True)
    chronic_conditions = Column(Text, nullable=True)  # JSON-encoded array: '["Hypertension"]'
    insurer_id = Column(String(50), nullable=True, default="none")  # none | niva | star | icici | cghs | ayushman
    city = Column(String(100), nullable=True, default="Mumbai")
    pincode = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="patient_profile")
    appointments = relationship("Appointment", back_populates="patient", cascade="all, delete-orphan")
    medical_reports = relationship("MedicalReport", back_populates="patient", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="patient", cascade="all, delete-orphan")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    full_name = Column(String(255), nullable=False)
    registration_number = Column(String(100), nullable=True)
    qualification = Column(String(255), nullable=True)
    specialization = Column(String(255), nullable=True)
    experience_years = Column(Integer, nullable=True)
    bio = Column(Text, nullable=True)
    consultation_fee = Column(Float, nullable=True)
    languages = Column(String(255), nullable=True)
    profile_image = Column(String(255), nullable=True)
    average_rating = Column(Float, nullable=True, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="doctor_profile")
    assignments = relationship("DoctorAssignment", back_populates="doctor", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="doctor", cascade="all, delete-orphan")


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    hospital_code = Column(String(50), unique=True, nullable=False, index=True)
    type = Column(String(100), nullable=True)
    website = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    branches = relationship("HospitalBranch", back_populates="hospital", cascade="all, delete-orphan")


class HospitalBranch(Base):
    __tablename__ = "hospital_branches"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    hospital_id = Column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False)
    branch_code = Column(String(50), unique=True, nullable=False, index=True)
    branch_name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(20), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    distance_km = Column(Float, nullable=True)
    rating = Column(Float, nullable=True)
    wait_min = Column(Integer, nullable=True)
    cost_band = Column(String(10), nullable=True)  # ₹ | ₹₹ | ₹₹₹
    emergency = Column(Boolean, default=False)
    consult_fee = Column(Integer, nullable=True)
    years = Column(Integer, nullable=True)
    accreditation = Column(String(255), nullable=True)
    insurers = Column(Text, nullable=True)  # JSON-encoded array: '["star", "icici"]'
    about = Column(Text, nullable=True)
    why = Column(Text, nullable=True)
    specialisation = Column(Text, nullable=True)  # JSON object mapping depts to scores: '{"Cardiology": 92}'
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    hospital = relationship("Hospital", back_populates="branches")
    departments = relationship("Department", back_populates="branch", cascade="all, delete-orphan")
    assignments = relationship("DoctorAssignment", back_populates="branch", cascade="all, delete-orphan")
    claims = relationship("ClaimsRecord", back_populates="branch", cascade="all, delete-orphan")


class Department(Base):
    __tablename__ = "departments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    branch_id = Column(String(36), ForeignKey("hospital_branches.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    branch = relationship("HospitalBranch", back_populates="departments")
    assignments = relationship("DoctorAssignment", back_populates="department", cascade="all, delete-orphan")


class DoctorAssignment(Base):
    __tablename__ = "doctor_assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    doctor_id = Column(String(36), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    branch_id = Column(String(36), ForeignKey("hospital_branches.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(String(36), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    consultation_fee = Column(Float, nullable=True)
    working_days = Column(String(255), nullable=True)  # JSON-encoded array: '["Mon", "Wed"]'
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    doctor = relationship("Doctor", back_populates="assignments")
    branch = relationship("HospitalBranch", back_populates="assignments")
    department = relationship("Department", back_populates="assignments")
    appointments = relationship("Appointment", back_populates="assignment", cascade="all, delete-orphan")
    time_slots = relationship("TimeSlot", back_populates="assignment", cascade="all, delete-orphan")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    doctor_assignment_id = Column(String(36), ForeignKey("doctor_assignments.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(String(50), unique=True, nullable=False, index=True)
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(String(20), nullable=False)  # stored as string for exact match with slot: '9:30 AM'
    estimated_duration = Column(Integer, default=20)
    status = Column(String(50), default="booked")  # booked | completed | cancelled
    symptoms = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    feedback_right_call = Column(Boolean, nullable=True)  # True | False | None
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    assignment = relationship("DoctorAssignment", back_populates="appointments")
    medical_record = relationship("MedicalRecord", back_populates="appointment", uselist=False, cascade="all, delete-orphan")
    review = relationship("Review", back_populates="appointment", uselist=False, cascade="all, delete-orphan")


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    appointment_id = Column(String(36), ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False, unique=True)
    diagnosis = Column(Text, nullable=True)
    treatment = Column(Text, nullable=True)
    follow_up_date = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    appointment = relationship("Appointment", back_populates="medical_record")


class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    report_type = Column(String(100), nullable=True)
    report_name = Column(String(255), nullable=False)
    file_url = Column(String(255), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    patient = relationship("Patient", back_populates="medical_reports")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    appointment_id = Column(String(36), ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False, unique=True)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    review = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    appointment = relationship("Appointment", back_populates="review")
    patient = relationship("Patient", back_populates="reviews")
    doctor = relationship("Doctor", back_populates="reviews")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    doctor_assignment_id = Column(String(36), ForeignKey("doctor_assignments.id", ondelete="CASCADE"), nullable=False)
    slot_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_booked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    assignment = relationship("DoctorAssignment", back_populates="time_slots")


class ClaimsRecord(Base):
    __tablename__ = "claims_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    branch_id = Column(String(36), ForeignKey("hospital_branches.id", ondelete="CASCADE"), nullable=False)
    insurer_name = Column(String(255), nullable=False)
    pending = Column(Integer, default=0)
    approved = Column(Integer, default=0)
    rejected = Column(Integer, default=0)

    # Relationships
    branch = relationship("HospitalBranch", back_populates="claims")


class Operation(Base):
    __tablename__ = "operations"

    id = Column(String(50), primary_key=True)  # procedure id: 'knee', 'cataract'
    name = Column(String(255), nullable=False)
    days = Column(String(100), nullable=True)
    base_cost = Column(Integer, nullable=False)
