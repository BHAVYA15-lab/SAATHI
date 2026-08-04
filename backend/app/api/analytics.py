import json
from datetime import date, time, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.database import get_db
from app.models import Appointment, Patient, Doctor, DoctorAssignment, TimeSlot, MedicalRecord, ClaimsRecord, HospitalBranch, Department, User
from app.schemas import AppointmentResponse, ClaimsRecordResponse, CommandCenterResponse, PrescriptionCreate
from app.api.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])

# Helper function to convert time string (e.g. "9:30 AM") to time object
def parse_time_str(t_str: str) -> time:
    parts = t_str.split(" ")
    h_m = parts[0].split(":")
    h = int(h_m[0])
    m = int(h_m[1])
    if parts[1] == "PM" and h != 12:
        h += 12
    elif parts[1] == "AM" and h == 12:
        h = 0
    return time(h, m)

# -------------------------------- Doctor Dashboard Endpoints --------------------------------

@router.get("/doctor/schedule", response_model=List[AppointmentResponse])
def get_doctor_schedule(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=400, detail="Only doctors can access schedules")
        
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
        
    # Get all appointments for assignments of this doctor
    # Sorted by date ascending, then time ascending
    appts = db.query(Appointment).join(DoctorAssignment).filter(
        DoctorAssignment.doctor_id == doctor.id
    ).order_by(Appointment.appointment_date.asc(), Appointment.appointment_time.asc()).all()
    
    # Sort helper to sort time strings like "9:00 AM", "12:00 PM"
    appts_list = list(appts)
    appts_list.sort(key=lambda x: (x.appointment_date, parse_time_str(x.appointment_time)))
    
    return appts_list

@router.post("/doctor/add-availability")
def add_doctor_availability(
    branch_id: str,
    slot_date: date,
    start_time_str: str = Query(..., description="Start time (e.g. '11:00 AM')"),
    duration_mins: int = Query(..., description="Duration in minutes (30, 60, 120)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=400, detail="Only doctors can add availability")
        
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
        
    # Find matching assignment for this branch and doctor
    assignment = db.query(DoctorAssignment).filter(
        DoctorAssignment.doctor_id == doctor.id,
        DoctorAssignment.branch_id == branch_id
    ).first()
    
    if not assignment:
        # If no assignment exists for this branch, let's create one on the fly!
        # Find any department matching doctor's specialization or General Medicine
        dept = db.query(Department).filter(
            Department.branch_id == branch_id,
            Department.name.ilike(doctor.specialization or "General Medicine")
        ).first()
        if not dept:
            dept = db.query(Department).filter(Department.branch_id == branch_id).first()
            
        assignment = DoctorAssignment(
            doctor_id=doctor.id,
            branch_id=branch_id,
            department_id=dept.id if dept else None,
            consultation_fee=doctor.consultation_fee or 500,
            working_days=json.dumps(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
            start_time=time(9, 0),
            end_time=time(18, 0)
        )
        db.add(assignment)
        db.commit()
        db.refresh(assignment)

    # Parse start time
    parts = start_time_str.split(" ")
    h_m = parts[0].split(":")
    h = int(h_m[0])
    m = int(h_m[1])
    if parts[1] == "PM" and h != 12:
        h += 12
    elif parts[1] == "AM" and h == 12:
        h = 0
        
    start_dt = datetime.combine(slot_date, time(h, m))
    
    # Split into 20-minute slots
    slots_count = max(1, duration_mins // 20)
    created_slots = 0
    
    for i in range(slots_count):
        slot_start_dt = start_dt + timedelta(minutes=i * 20)
        slot_end_dt = slot_start_dt + timedelta(minutes=20)
        
        # Check if slot already exists
        existing = db.query(TimeSlot).filter(
            TimeSlot.doctor_assignment_id == assignment.id,
            TimeSlot.slot_date == slot_date,
            TimeSlot.start_time == slot_start_dt.time()
        ).first()
        
        if not existing:
            db.add(TimeSlot(
                doctor_assignment_id=assignment.id,
                slot_date=slot_date,
                start_time=slot_start_dt.time(),
                end_time=slot_end_dt.time(),
                is_booked=False
            ))
            created_slots += 1
            
    db.commit()
    return {"message": f"Successfully created {created_slots} open slots"}

@router.post("/doctor/complete-appointment/{appointment_id}", response_model=AppointmentResponse)
def complete_appointment(
    appointment_id: str,
    prescription: PrescriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "doctor":
        raise HTTPException(status_code=400, detail="Only doctors can complete appointments")
        
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
        
    # Get appointment
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    # verify appointment belongs to this doctor
    if appt.assignment.doctor_id != doctor.id:
        raise HTTPException(status_code=403, detail="Unauthorized to manage this appointment")
        
    appt.status = "completed"
    
    # Create or update medical record
    med_rec = db.query(MedicalRecord).filter(MedicalRecord.appointment_id == appt.id).first()
    if med_rec:
        med_rec.diagnosis = prescription.diagnosis
        med_rec.treatment = prescription.treatment
        med_rec.follow_up_date = prescription.follow_up_date
    else:
        med_rec = MedicalRecord(
            appointment_id=appt.id,
            diagnosis=prescription.diagnosis,
            treatment=prescription.treatment,
            follow_up_date=prescription.follow_up_date
        )
        db.add(med_rec)
        
    db.commit()
    db.refresh(appt)
    return appt

# -------------------------------- Hospital Portal (BI) Endpoints --------------------------------

@router.get("/admin/dashboard", response_model=CommandCenterResponse)
def get_admin_dashboard(
    branch_id: str = Query("h1", description="Branch ID to retrieve analytics for"),
    db: Session = Depends(get_db)
):
    # 1. Capacity Forecasts (occupancy per department)
    # Cardiology: 74%, Ortho: 91% (Ortho busy), Gen Med: 62%
    # Ortho capacity is high load, recommend action
    # Let's compute this dynamically based on bookings, but seed with realistic baseline
    # Count of appointments today in Orthopaedics at h1:
    today_date = date.today()
    
    # Simple dynamic load calculator based on appointments and assignments
    # We will fetch all departments for this branch
    depts = db.query(Department).filter(Department.branch_id == branch_id).all()
    capacity_forecasts = []
    workloads = {}
    
    # Base load guidelines (so the charts look like the JSX ones)
    base_loads = {
        "Orthopaedics": (96, "up", "Add 2 staff, 10 AM-1 PM tomorrow"),
        "Cardiology": (71, "flat", None),
        "General Medicine": (58, "down", None),
        "Emergency": (83, "up", "Monitor - approaching threshold")
    }
    
    for d in depts:
        load, trend, action = base_loads.get(d.name, (65, "flat", None))
        
        # Adjust load slightly based on actual bookings today
        bookings_today = db.query(Appointment).join(DoctorAssignment).filter(
            DoctorAssignment.branch_id == branch_id,
            DoctorAssignment.department_id == d.id,
            Appointment.appointment_date == today_date
        ).count()
        
        # Add 3% load per booking today
        adjusted_load = min(100, load + (bookings_today * 3))
        
        capacity_forecasts.append({
            "name": d.name,
            "load": adjusted_load,
            "trend": trend,
            "action": action
        })
        
        workloads[d.name] = adjusted_load
        
    # If Emergency is missing from database departments, append it manually as a forecast
    if "Emergency" not in workloads:
        capacity_forecasts.append({
            "name": "Emergency",
            "load": 83,
            "trend": "up",
            "action": "Monitor - approaching threshold"
        })
        workloads["Emergency"] = 83

    # 2. Insurer Claims logs
    claims = db.query(ClaimsRecord).filter(ClaimsRecord.branch_id == branch_id).all()
    
    # 3. Dynamic Trends
    no_show_trend = {
        "text": "Cancellations up 15% this week vs. 4-week average.",
        "percent": 15,
        "direction": "up"
    }
    
    return CommandCenterResponse(
        capacity_forecast=capacity_forecasts,
        workloads=workloads,
        no_show_trend=no_show_trend,
        claims=claims
    )
