import os
import json
import uuid
from datetime import date, time, datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models import (
    User, Patient, Doctor, Hospital, HospitalBranch, Department,
    DoctorAssignment, Appointment, MedicalRecord, ClaimsRecord, Operation, TimeSlot
)

def clean_db(db: Session):
    # Truncate / delete all rows
    db.query(TimeSlot).delete()
    db.query(MedicalRecord).delete()
    db.query(Appointment).delete()
    db.query(ClaimsRecord).delete()
    db.query(DoctorAssignment).delete()
    db.query(Department).delete()
    db.query(HospitalBranch).delete()
    db.query(Hospital).delete()
    db.query(Patient).delete()
    db.query(Doctor).delete()
    db.query(User).delete()
    db.query(Operation).delete()
    db.commit()

def seed_db():
    db = SessionLocal()
    clean_db(db)

    print("Seeding operations...")
    ops_data = [
        {"id": "knee", "name": "Knee Replacement (single)", "days": "3-4 day stay", "base_cost": 140000},
        {"id": "cataract", "name": "Cataract Surgery (single eye)", "days": "Day care", "base_cost": 35000},
        {"id": "appendix", "name": "Appendectomy (laparoscopic)", "days": "1-2 day stay", "base_cost": 65000},
        {"id": "gallbladder", "name": "Gallbladder Removal", "days": "1-2 day stay", "base_cost": 85000},
        {"id": "hernia", "name": "Hernia Repair", "days": "1 day stay", "base_cost": 55000},
        {"id": "bypass", "name": "Cardiac Bypass (CABG)", "days": "6-8 day stay", "base_cost": 350000},
    ]
    for op in ops_data:
        db.add(Operation(**op))
    db.commit()

    print("Seeding hospitals...")
    h1 = Hospital(name="Horizon Multispecialty Hospital", hospital_code="HORIZON", type="Multispecialty")
    h2 = Hospital(name="Sundar Trauma & Care Institute", hospital_code="SUNDAR", type="Trauma & Specialty")
    h3 = Hospital(name="Apex Care Institute", hospital_code="APEX", type="Tertiary Care")
    db.add_all([h1, h2, h3])
    db.commit()

    print("Seeding hospital branches...")
    b1 = HospitalBranch(
        id="h1", # Keep hardcoded IDs matching JSX references
        hospital_id=h1.id,
        branch_code="HORIZON_MUM",
        branch_name="Horizon Multispecialty Hospital, Mumbai",
        address="Linking Road, Santacruz West",
        city="Mumbai",
        state="Maharashtra",
        pincode="400050",
        latitude=19.0760,
        longitude=72.8400,
        distance_km=2.1,
        rating=4.6,
        wait_min=22,
        cost_band="₹₹",
        emergency=True,
        consult_fee=700,
        years=18,
        accreditation="NABH accredited",
        insurers=json.dumps(["niva", "star", "cghs", "ayushman"]),
        about="A 220-bed multispecialty hospital known for fast OPD turnaround and a dedicated diagnostics wing on the same floor as most specialty clinics.",
        why="Closest option with a dedicated unit for this department and live capacity below 70% right now.",
        specialisation=json.dumps({
            "Cardiology": 92, "Orthopaedics": 78, "Pulmonology": 70, 
            "General Medicine": 85, "Neurology": 74, "Gastroenterology": 80
        })
    )

    b2 = HospitalBranch(
        id="h2",
        hospital_id=h2.id,
        branch_code="SUNDAR_MUM",
        branch_name="Sundar Trauma & Care Institute, Mumbai",
        address="Sion Trombay Road, Chembur",
        city="Mumbai",
        state="Maharashtra",
        pincode="400071",
        latitude=19.0620,
        longitude=72.8980,
        distance_km=4.8,
        rating=4.4,
        wait_min=40,
        cost_band="₹",
        emergency=True,
        consult_fee=500,
        years=11,
        accreditation="State licensed, Level II trauma centre",
        insurers=json.dumps(["star", "icici", "cghs", "ayushman"]),
        about="A budget-friendly trauma and general care hospital with strong orthopaedic and emergency departments, popular for its lower consultation costs.",
        why="Lower cost band and strong department depth, though further away with a longer wait today.",
        specialisation=json.dumps({
            "Cardiology": 75, "Orthopaedics": 90, "Pulmonology": 65, 
            "General Medicine": 82, "Neurology": 68, "Gastroenterology": 71
        })
    )

    b3 = HospitalBranch(
        id="h3",
        hospital_id=h3.id,
        branch_code="APEX_MUM",
        branch_name="Apex Care Institute, Mumbai",
        address="Dr. E Moses Road, Worli",
        city="Mumbai",
        state="Maharashtra",
        pincode="400018",
        latitude=19.0030,
        longitude=72.8180,
        distance_km=6.3,
        rating=4.8,
        wait_min=15,
        cost_band="₹₹₹",
        emergency=True,
        consult_fee=1200,
        years=24,
        accreditation="NABH & JCI accredited",
        insurers=json.dumps(["niva", "star", "icici"]),
        about="A premium tertiary-care hospital with the deepest specialist bench in the city and the shortest current wait times, at a higher price point.",
        why="Highest specialisation depth and shortest current wait, at a higher consultation cost.",
        specialisation=json.dumps({
            "Cardiology": 96, "Orthopaedics": 88, "Pulmonology": 91, 
            "General Medicine": 89, "Neurology": 93, "Gastroenterology": 90
        })
    )

    b4 = HospitalBranch(
        id="h4",
        hospital_id=h1.id,
        branch_code="HORIZON_DEL",
        branch_name="Horizon Multispecialty Hospital, Delhi",
        address="Pusa Road, Karol Bagh",
        city="Delhi",
        state="Delhi",
        pincode="110005",
        latitude=28.6440,
        longitude=77.1900,
        distance_km=3.5,
        rating=4.5,
        wait_min=20,
        cost_band="₹₹",
        emergency=True,
        consult_fee=800,
        years=15,
        accreditation="NABH accredited",
        insurers=json.dumps(["niva", "star", "cghs", "ayushman"]),
        about="A well-established branch of Horizon in the heart of Delhi, specializing in comprehensive outpatient diagnostics and pulmonology.",
        why="Top-rated general hospital in central Delhi with high cashless insurance approval rates.",
        specialisation=json.dumps({
            "Cardiology": 88, "Orthopaedics": 75, "Pulmonology": 80, 
            "General Medicine": 84, "Neurology": 72, "Gastroenterology": 78
        })
    )

    b5 = HospitalBranch(
        id="h5",
        hospital_id=h2.id,
        branch_code="SUNDAR_DEL",
        branch_name="Sundar Trauma & Specialty Institute, Delhi",
        address="Ring Road, Lajpat Nagar",
        city="Delhi",
        state="Delhi",
        pincode="110024",
        latitude=28.5700,
        longitude=77.2400,
        distance_km=5.1,
        rating=4.3,
        wait_min=35,
        cost_band="₹",
        emergency=True,
        consult_fee=550,
        years=9,
        accreditation="State licensed trauma unit",
        insurers=json.dumps(["star", "icici", "cghs", "ayushman"]),
        about="Budget-friendly trauma and bone health specialist center in South Delhi, open 24/7.",
        why="Economical trauma care option in Delhi with round-the-clock specialists on call.",
        specialisation=json.dumps({
            "Cardiology": 72, "Orthopaedics": 89, "Pulmonology": 68, 
            "General Medicine": 80, "Neurology": 65, "Gastroenterology": 70
        })
    )

    b6 = HospitalBranch(
        id="h6",
        hospital_id=h3.id,
        branch_code="APEX_DEL",
        branch_name="Apex Care Institute, Delhi",
        address="Siri Fort Road, New Delhi",
        city="Delhi",
        state="Delhi",
        pincode="110049",
        latitude=28.5560,
        longitude=77.2200,
        distance_km=6.0,
        rating=4.7,
        wait_min=12,
        cost_band="₹₹₹",
        emergency=True,
        consult_fee=1300,
        years=19,
        accreditation="NABH & JCI accredited",
        insurers=json.dumps(["niva", "star", "icici"]),
        about="Premium multi-wing superspecialty hospital equipped with top-tier intensive care and surgical facilities.",
        why="Highly advanced cardiology and neurological infrastructure in New Delhi with minimal wait times.",
        specialisation=json.dumps({
            "Cardiology": 94, "Orthopaedics": 86, "Pulmonology": 89, 
            "General Medicine": 88, "Neurology": 91, "Gastroenterology": 88
        })
    )

    b7 = HospitalBranch(
        id="h7",
        hospital_id=h1.id,
        branch_code="HORIZON_BLR",
        branch_name="Horizon Multispecialty Hospital, Bangalore",
        address="80 Feet Road, Koramangala",
        city="Bangalore",
        state="Karnataka",
        pincode="560034",
        latitude=12.9340,
        longitude=77.6200,
        distance_km=2.8,
        rating=4.6,
        wait_min=25,
        cost_band="₹₹",
        emergency=True,
        consult_fee=750,
        years=12,
        accreditation="NABH accredited",
        insurers=json.dumps(["niva", "star", "cghs", "ayushman"]),
        about="Modern diagnostic and tertiary care hospital in Koramangala, serving tech corridors.",
        why="Conveniently situated multispecialty branch with robust cardiac screening panels.",
        specialisation=json.dumps({
            "Cardiology": 90, "Orthopaedics": 76, "Pulmonology": 72, 
            "General Medicine": 86, "Neurology": 75, "Gastroenterology": 82
        })
    )

    b8 = HospitalBranch(
        id="h8",
        hospital_id=h2.id,
        branch_code="SUNDAR_BLR",
        branch_name="Sundar Trauma & Specialty Institute, Bangalore",
        address="Outer Ring Road, Marathahalli",
        city="Bangalore",
        state="Karnataka",
        pincode="560037",
        latitude=12.9560,
        longitude=77.6980,
        distance_km=4.9,
        rating=4.4,
        wait_min=30,
        cost_band="₹",
        emergency=True,
        consult_fee=600,
        years=8,
        accreditation="State licensed trauma facility",
        insurers=json.dumps(["star", "icici", "cghs", "ayushman"]),
        about="Affordable community trauma care center catering to emergency orthopaedics and general diagnostics.",
        why="Highly affordable out-of-pocket checkups and fracture treatments on ORR.",
        specialisation=json.dumps({
            "Cardiology": 76, "Orthopaedics": 88, "Pulmonology": 66, 
            "General Medicine": 84, "Neurology": 70, "Gastroenterology": 72
        })
    )

    b9 = HospitalBranch(
        id="h9",
        hospital_id=h3.id,
        branch_code="APEX_BLR",
        branch_name="Apex Care Institute, Bangalore",
        address="Residency Road, Bangalore",
        city="Bangalore",
        state="Karnataka",
        pincode="560025",
        latitude=12.9720,
        longitude=77.6000,
        distance_km=5.5,
        rating=4.9,
        wait_min=10,
        cost_band="₹₹₹",
        emergency=True,
        consult_fee=1400,
        years=21,
        accreditation="NABH & JCI accredited",
        about="State-of-the-art super specialty tertiary center offering cutting-edge cardiac, organ transplant, and neuro facilities.",
        why="Top clinical outcomes and zero wait time for critical care appointments in Residency Road.",
        specialisation=json.dumps({
            "Cardiology": 97, "Orthopaedics": 89, "Pulmonology": 92, 
            "General Medicine": 91, "Neurology": 95, "Gastroenterology": 92
        })
    )

    db.add_all([b1, b2, b3, b4, b5, b6, b7, b8, b9])
    db.commit()

    print("Seeding departments for branches...")
    depts = [
        "Cardiology", "Orthopaedics", "Pulmonology", 
        "General Medicine", "Neurology", "Gastroenterology",
        "ENT", "Infectious Disease"
    ]
    dept_map = {} 
    for b_id in ["h1", "h2", "h3", "h4", "h5", "h6", "h7", "h8", "h9"]:
        for d_name in depts:
            d = Department(branch_id=b_id, name=d_name, description=f"{d_name} department at branch")
            db.add(d)
            dept_map[(b_id, d_name)] = d
    db.commit()

    print("Seeding claims records...")
    claims_data = [
        # Horizon Hospital (h1)
        {"branch_id": "h1", "insurer_name": "Niva Bupa", "pending": 12, "approved": 54, "rejected": 3},
        {"branch_id": "h1", "insurer_name": "Star Health", "pending": 8, "approved": 41, "rejected": 5},
        {"branch_id": "h1", "insurer_name": "ICICI Lombard", "pending": 5, "approved": 29, "rejected": 2},
        {"branch_id": "h1", "insurer_name": "CGHS (Govt.)", "pending": 20, "approved": 60, "rejected": 9},
        {"branch_id": "h1", "insurer_name": "Ayushman Bharat", "pending": 31, "approved": 88, "rejected": 14},
        # Sundar Trauma (h2)
        {"branch_id": "h2", "insurer_name": "Star Health", "pending": 15, "approved": 30, "rejected": 8},
        {"branch_id": "h2", "insurer_name": "ICICI Lombard", "pending": 3, "approved": 15, "rejected": 1},
        # Apex Care (h3)
        {"branch_id": "h3", "insurer_name": "Niva Bupa", "pending": 25, "approved": 110, "rejected": 10},
        {"branch_id": "h3", "insurer_name": "Star Health", "pending": 18, "approved": 95, "rejected": 6},
        # Horizon Delhi (h4)
        {"branch_id": "h4", "insurer_name": "Niva Bupa", "pending": 14, "approved": 48, "rejected": 4},
        {"branch_id": "h4", "insurer_name": "Star Health", "pending": 10, "approved": 38, "rejected": 6},
        {"branch_id": "h4", "insurer_name": "CGHS (Govt.)", "pending": 18, "approved": 55, "rejected": 8},
        # Sundar Delhi (h5)
        {"branch_id": "h5", "insurer_name": "Star Health", "pending": 12, "approved": 24, "rejected": 5},
        # Apex Delhi (h6)
        {"branch_id": "h6", "insurer_name": "Niva Bupa", "pending": 20, "approved": 95, "rejected": 8},
        {"branch_id": "h6", "insurer_name": "ICICI Lombard", "pending": 15, "approved": 70, "rejected": 5},
        # Horizon Bangalore (h7)
        {"branch_id": "h7", "insurer_name": "Niva Bupa", "pending": 15, "approved": 50, "rejected": 5},
        {"branch_id": "h7", "insurer_name": "Star Health", "pending": 12, "approved": 45, "rejected": 4},
        # Sundar Bangalore (h8)
        {"branch_id": "h8", "insurer_name": "Star Health", "pending": 10, "approved": 28, "rejected": 6},
        # Apex Bangalore (h9)
        {"branch_id": "h9", "insurer_name": "Niva Bupa", "pending": 22, "approved": 105, "rejected": 7},
        {"branch_id": "h9", "insurer_name": "Star Health", "pending": 16, "approved": 88, "rejected": 5},
    ]
    for c in claims_data:
        db.add(ClaimsRecord(**c))
    db.commit()

    print("Seeding Users, Patients and Doctors...")
    # Admin/Ops User
    u_ops = User(email="ops@horizonhospital.in", password_hash=get_password_hash("password"), role="admin")
    db.add(u_ops)
    db.commit()

    # 1. Aditi Rao (Patient)
    u_aditi = User(email="aditi@email.com", password_hash=get_password_hash("password"), role="patient")
    db.add(u_aditi)
    db.commit()

    p_aditi = Patient(
        user_id=u_aditi.id,
        full_name="Aditi Rao",
        phone="9876543210",
        date_of_birth=date(1992, 5, 12),
        gender="Female",
        blood_group="O+",
        emergency_contact="Rajesh Rao (Husband) - 9876543211",
        insurer_id="star",
        chronic_conditions=json.dumps(["Hypertension"]),
    )
    db.add(p_aditi)

    # 2. Seeded Doctors
    # Dr. Priya Vaidya (Worli branch - Apex Care Institute)
    u_vaidya = User(email="dr.vaidya@apexcare.in", password_hash=get_password_hash("password"), role="doctor")
    db.add(u_vaidya)
    db.commit()

    d_vaidya = Doctor(
        user_id=u_vaidya.id,
        full_name="Dr. Priya Vaidya",
        registration_number="MCI-12345",
        qualification="MD, DM (Cardiology) - AIIMS",
        specialization="Cardiology",
        experience_years=20,
        bio="Senior consultant, second-opinion specialist for complex cases.",
        consultation_fee=1200,
        languages="English, Hindi, Marathi",
        profile_image="",
        average_rating=4.8
    )
    db.add(d_vaidya)
    db.commit()

    # Add assignment for Priya Vaidya at Apex Care Cardiology
    assign_vaidya = DoctorAssignment(
        doctor_id=d_vaidya.id,
        branch_id="h3",
        department_id=dept_map[("h3", "Cardiology")].id,
        consultation_fee=1200,
        working_days=json.dumps(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
        start_time=time(9, 0),
        end_time=time(17, 0)
    )
    db.add(assign_vaidya)

    # Define other doctors
    other_docs = [
        {
            "email": "renu.kapadia@horizon.in", "name": "Dr. Renu Kapadia", "specialization": "Cardiology",
            "branch": "h1", "exp": 14, "bio": "Focuses on preventive cardiology and post-op recovery.",
            "fee": 700, "slots": ["9:30 AM", "11:40 AM", "12:20 PM", "4:00 PM"]
        },
        {
            "email": "aslam.sheikh@horizon.in", "name": "Dr. Aslam Sheikh", "specialization": "General Medicine",
            "branch": "h1", "exp": 9, "bio": "General & internal medicine, known for unhurried consults.",
            "fee": 700, "slots": ["10:15 AM", "2:10 PM", "5:30 PM"]
        },
        {
            "email": "meenal.oak@sundar.in", "name": "Dr. Meenal Oak", "specialization": "Orthopaedics",
            "branch": "h2", "exp": 11, "bio": "Sports injuries and joint replacement follow-ups.",
            "fee": 500, "slots": ["1:00 PM", "3:45 PM"]
        },
        {
            "email": "fahad.ansari@sundar.in", "name": "Dr. Fahad Ansari", "specialization": "General Medicine",
            "branch": "h2", "exp": 6, "bio": "General physician, also handles walk-in urgent cases.",
            "fee": 500, "slots": ["10:30 AM", "6:15 PM"]
        },
        {
            "email": "karan.bhatt@apexcare.in", "name": "Dr. Karan Bhatt", "specialization": "General Medicine",
            "branch": "h3", "exp": 8, "bio": "Focuses on early diagnosis and diagnostic imaging referrals.",
            "fee": 1200, "slots": ["11:15 AM", "4:30 PM"]
        },
        {
            "email": "anil.kumar@apexcare.in", "name": "Dr. Anil Kumar", "specialization": "Cardiology",
            "branch": "h6", "exp": 16, "bio": "Interventional cardiologist with DM from cardiac centres.",
            "fee": 1300, "slots": ["9:00 AM", "11:00 AM", "3:00 PM"]
        },
        {
            "email": "shalini.hegde@apexcare.in", "name": "Dr. Shalini Hegde", "specialization": "Cardiology",
            "branch": "h9", "exp": 18, "bio": "Consultant cardiologist specialising in coronary artery diseases.",
            "fee": 1400, "slots": ["10:00 AM", "2:00 PM", "4:30 PM"]
        },
        {
            "email": "rahul.verma@horizon.in", "name": "Dr. Rahul Verma", "specialization": "General Medicine",
            "branch": "h4", "exp": 10, "bio": "Experienced consultant in general infectious diseases.",
            "fee": 800, "slots": ["9:30 AM", "12:00 PM", "3:30 PM"]
        },
        {
            "email": "sandeep.naik@horizon.in", "name": "Dr. Sandeep Naik", "specialization": "General Medicine",
            "branch": "h7", "exp": 12, "bio": "Focuses on diabetes management and internal medicine checkups.",
            "fee": 750, "slots": ["10:30 AM", "1:30 PM", "5:00 PM"]
        }
    ]

    doctor_assignments = {} # key: doc name, value: DoctorAssignment object

    for od in other_docs:
        u = User(email=od["email"], password_hash=get_password_hash("password"), role="doctor")
        db.add(u)
        db.commit()

        d = Doctor(
            user_id=u.id,
            full_name=od["name"],
            specialization=od["specialization"],
            experience_years=od["exp"],
            bio=od["bio"],
            consultation_fee=od["fee"]
        )
        db.add(d)
        db.commit()

        assign = DoctorAssignment(
            doctor_id=d.id,
            branch_id=od["branch"],
            department_id=dept_map[(od["branch"], od["specialization"])].id,
            consultation_fee=od["fee"],
            working_days=json.dumps(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
            start_time=time(10, 0),
            end_time=time(18, 0)
        )
        db.add(assign)
        db.commit()
        doctor_assignments[od["name"]] = assign

        # Seed pre-determined slots for other doctors
        for slot_time_str in od["slots"]:
            # e.g., "9:30 AM" -> parse to hour/minute
            parts = slot_time_str.split(" ")
            h_m = parts[0].split(":")
            h = int(h_m[0])
            m = int(h_m[1])
            if parts[1] == "PM" and h != 12:
                h += 12
            elif parts[1] == "AM" and h == 12:
                h = 0
            
            # Seed slots for the next 7 days
            today = date.today()
            dt_start = datetime.combine(today, time(h, m))
            dt_end = dt_start + timedelta(minutes=20)
            end_time_val = dt_end.time()
            
            for day_offset in range(7):
                d_slot = TimeSlot(
                    doctor_assignment_id=assign.id,
                    slot_date=today + timedelta(days=day_offset),
                    start_time=time(h, m),
                    end_time=end_time_val,
                    is_booked=False
                )
                db.add(d_slot)
        db.commit()

    # Seed slots for Priya Vaidya as well
    # Dr Priya Vaidya slots: "9:00 AM", "12:00 PM", "3:00 PM", "5:45 PM"
    vaidya_slots = ["9:00 AM", "12:00 PM", "3:00 PM", "5:45 PM"]
    today = date.today()
    for s_str in vaidya_slots:
        parts = s_str.split(" ")
        h_m = parts[0].split(":")
        h = int(h_m[0])
        m = int(h_m[1])
        if parts[1] == "PM" and h != 12:
            h += 12
        elif parts[1] == "AM" and h == 12:
            h = 0
            
        dt_start = datetime.combine(today, time(h, m))
        dt_end = dt_start + timedelta(minutes=20)
        end_time_val = dt_end.time()
        
        for day_offset in range(7):
            d_slot = TimeSlot(
                doctor_assignment_id=assign_vaidya.id,
                slot_date=today + timedelta(days=day_offset),
                start_time=time(h, m),
                end_time=end_time_val,
                is_booked=False
            )
            db.add(d_slot)
    db.commit()

    # 3. Seed other patient users for Doctor's schedule (R. Mehta, S. Iyer, A. Rao, K. Nair)
    patients_data = [
        {"name": "R. Mehta", "email": "mehta@email.com", "conditions": ["Hypertension"]},
        {"name": "S. Iyer", "email": "iyer@email.com", "conditions": ["Heart disease"]},
        {"name": "A. Rao", "email": "arao@email.com", "conditions": ["Diabetes"]},
        {"name": "K. Nair", "email": "nair@email.com", "conditions": []}
    ]
    patient_models = {}
    for p_info in patients_data:
        u = User(email=p_info["email"], password_hash=get_password_hash("password"), role="patient")
        db.add(u)
        db.commit()

        p = Patient(
            user_id=u.id,
            full_name=p_info["name"],
            chronic_conditions=json.dumps(p_info["conditions"]),
        )
        db.add(p)
        db.commit()
        patient_models[p_info["name"]] = p

    # Seed Aditi Rao's health timeline history
    # Visit 1: 2 Jun 2026, General Medicine, Dr. Aslam Sheikh, Horizon Hospital (h1)
    # Let's mock the appointment
    appt1 = Appointment(
        patient_id=p_aditi.id,
        doctor_assignment_id=doctor_assignments["Dr. Aslam Sheikh"].id,
        booking_id="SAR-584732",
        appointment_date=date(2026, 6, 2),
        appointment_time="10:15 AM",
        status="completed",
        symptoms="High fever and body ache",
        notes="Visit completed",
        feedback_right_call=True
    )
    db.add(appt1)
    db.commit()
    db.add(MedicalRecord(
        appointment_id=appt1.id,
        diagnosis="Viral Fever",
        treatment="Viral fever, prescribed rest and antipyretics. Resolved in 4 days.",
        follow_up_date=date(2026, 6, 6)
    ))

    # Visit 2: 14 Mar 2026, Cardiology, Dr. Priya Vaidya, Apex Care (h3)
    appt2 = Appointment(
        patient_id=p_aditi.id,
        doctor_assignment_id=assign_vaidya.id,
        booking_id="SAR-903421",
        appointment_date=date(2026, 3, 14),
        appointment_time="12:00 PM",
        status="completed",
        symptoms="Routine lipid check",
        notes="ECG normal",
        feedback_right_call=True
    )
    db.add(appt2)
    db.commit()
    db.add(MedicalRecord(
        appointment_id=appt2.id,
        diagnosis="Routine Cardiology Review",
        treatment="Routine ECG and lipid panel review. All parameters normal, advised annual follow-up.",
        follow_up_date=date(2027, 3, 14)
    ))

    # Visit 3: 2 Nov 2025, Orthopaedics, Dr. Meenal Oak, Sundar Trauma (h2)
    appt3 = Appointment(
        patient_id=p_aditi.id,
        doctor_assignment_id=doctor_assignments["Dr. Meenal Oak"].id,
        booking_id="SAR-234901",
        appointment_date=date(2025, 11, 2),
        appointment_time="1:00 PM",
        status="completed",
        symptoms="Ankle pain",
        notes="Sprain diagnosed",
        feedback_right_call=False
    )
    db.add(appt3)
    db.commit()
    db.add(MedicalRecord(
        appointment_id=appt3.id,
        diagnosis="Ankle Sprain",
        treatment="Ankle sprain from a fall, X-ray clear, physiotherapy advised."
    ))
    db.commit()

    # Seed Patient history for doctor view (MOCK_PATIENT_HISTORY)
    # R. Mehta histories
    mehta_records = [
        {"date": date(2026, 4, 20), "diagnosis": "Hypertension follow-up", "treatment": "Hypertension follow-up, BP controlled on current dosage."},
        {"date": date(2026, 1, 10), "diagnosis": "Chest discomfort", "treatment": "Initial consult for chest discomfort; stress test done, result normal."}
    ]
    for rec in mehta_records:
        dummy_appt = Appointment(
            patient_id=patient_models["R. Mehta"].id,
            doctor_assignment_id=assign_vaidya.id,
            booking_id=f"SAR-{uuid.uuid4().hex[:6].upper()}",
            appointment_date=rec["date"],
            appointment_time="9:00 AM",
            status="completed"
        )
        db.add(dummy_appt)
        db.commit()
        db.add(MedicalRecord(appointment_id=dummy_appt.id, diagnosis=rec["diagnosis"], treatment=rec["treatment"]))
    
    # S. Iyer histories
    iyer_appt = Appointment(
        patient_id=patient_models["S. Iyer"].id,
        doctor_assignment_id=assign_vaidya.id,
        booking_id=f"SAR-{uuid.uuid4().hex[:6].upper()}",
        appointment_date=date(2026, 5, 5),
        appointment_time="12:00 PM",
        status="completed"
    )
    db.add(iyer_appt)
    db.commit()
    db.add(MedicalRecord(appointment_id=iyer_appt.id, diagnosis="Post-angioplasty review", treatment="Post-angioplasty follow-up, recovering well."))

    # A. Rao histories
    arao_appt = Appointment(
        patient_id=patient_models["A. Rao"].id,
        doctor_assignment_id=assign_vaidya.id,
        booking_id=f"SAR-{uuid.uuid4().hex[:6].upper()}",
        appointment_date=date(2026, 2, 28),
        appointment_time="3:00 PM",
        status="completed"
    )
    db.add(arao_appt)
    db.commit()
    db.add(MedicalRecord(appointment_id=arao_appt.id, diagnosis="Baseline Cardiac Workup", treatment="New patient, family history of heart disease — baseline workup ordered."))
    db.commit()

    # Seed the active schedule list for Priya Vaidya (Doctor Portlet)
    # { id: "seed1", hospitalId: "h3", day: 0, time: "9:00 AM", status: "booked", patient: "R. Mehta" }
    # { id: "seed2", hospitalId: "h3", day: 0, time: "9:20 AM", status: "booked", patient: "S. Iyer" }
    # { id: "seed3", hospitalId: "h3", day: 0, time: "9:40 AM", status: "open" }
    # { id: "seed4", hospitalId: "h1", day: 1, time: "4:00 PM", status: "booked", patient: "A. Rao" } -> Note: Dr Vaidya has assignments at Apex Care (h3). Let's let her also have an assignment at Horizon (h1) to matches the JSX!
    # Yes! Dr. Vaidya is assigned to both h3 and h1 in the JSX:
    # "Horizon Multispecialty Hospital (h1) ... Dr. Renu Kapadia, Dr. Aslam Sheikh"
    # "Apex Care Institute (h3) ... Dr. Priya Vaidya, Dr. Karan Bhatt"
    # Wait, in the JSX, Dr. Priya Vaidya's schedule has:
    # { hospitalId: "h3", day: 0, time: "9:00 AM", status: "booked", patient: "R. Mehta" }
    # { hospitalId: "h1", day: 1, time: "4:00 PM", status: "booked", patient: "A. Rao" }
    # This means Dr. Priya Vaidya is empanelled at both h3 and h1! Let's add an assignment for her at Horizon (h1) too! This is great.
    assign_vaidya_h1 = DoctorAssignment(
        doctor_id=d_vaidya.id,
        branch_id="h1",
        department_id=dept_map[("h1", "Cardiology")].id,
        consultation_fee=700,
        working_days=json.dumps(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]),
        start_time=time(14, 0),
        end_time=time(18, 0)
    )
    db.add(assign_vaidya_h1)
    db.commit()

    # Now let's seed those specific appointments for this week
    # Day 0 (today)
    today = date.today()
    appt_seed1 = Appointment(
        patient_id=patient_models["R. Mehta"].id,
        doctor_assignment_id=assign_vaidya.id,
        booking_id="SAR-SEED01",
        appointment_date=today,
        appointment_time="9:00 AM",
        status="booked",
        symptoms="Routine hypertension check"
    )
    appt_seed2 = Appointment(
        patient_id=patient_models["S. Iyer"].id,
        doctor_assignment_id=assign_vaidya.id,
        booking_id="SAR-SEED02",
        appointment_date=today,
        appointment_time="9:20 AM",
        status="booked",
        symptoms="Post-op review check"
    )
    # Day 1 (tomorrow)
    tomorrow = today + timedelta(days=1)
    appt_seed4 = Appointment(
        patient_id=patient_models["A. Rao"].id,
        doctor_assignment_id=assign_vaidya_h1.id,
        booking_id="SAR-SEED04",
        appointment_date=tomorrow,
        appointment_time="4:00 PM",
        status="booked",
        symptoms="Consultation for diabetes-linked heart risk assessment"
    )
    appt_seed6 = Appointment(
        patient_id=patient_models["K. Nair"].id,
        doctor_assignment_id=assign_vaidya_h1.id,
        booking_id="SAR-SEED06",
        appointment_date=tomorrow,
        appointment_time="4:40 PM",
        status="booked",
        symptoms="General cardiology baseline check"
    )
    db.add_all([appt_seed1, appt_seed2, appt_seed4, appt_seed6])

    # Mark corresponding time slots as booked
    # (Priya Vaidya's time slots were created for 7 days above, let's mark these specific slots as booked)
    db.query(TimeSlot).filter(
        TimeSlot.doctor_assignment_id == assign_vaidya.id,
        TimeSlot.slot_date == today,
        TimeSlot.start_time == time(9, 0)
    ).update({"is_booked": True})
    db.query(TimeSlot).filter(
        TimeSlot.doctor_assignment_id == assign_vaidya.id,
        TimeSlot.slot_date == today,
        TimeSlot.start_time == time(9, 20)
    ).update({"is_booked": True})
    
    # We need slots for Dr Vaidya at h1 (4:00 PM and 4:40 PM)
    for t_str in ["4:00 PM", "4:20 PM", "4:40 PM"]:
        parts = t_str.split(" ")
        h_m = parts[0].split(":")
        h = int(h_m[0]) + 12 # it's PM
        m = int(h_m[1])
        dt_start = datetime.combine(tomorrow, time(h, m))
        dt_end = dt_start + timedelta(minutes=20)
        end_time_val = dt_end.time()
        
        db.add(TimeSlot(
            doctor_assignment_id=assign_vaidya_h1.id,
            slot_date=tomorrow,
            start_time=time(h, m),
            end_time=end_time_val,
            is_booked=True if t_str in ["4:00 PM", "4:40 PM"] else False
        ))
    db.commit()

    print("Database seeding completed successfully!")
    db.close()

def ensure_db_seeded():
    db = SessionLocal()
    try:
        user_count = db.query(User).count()
        hospital_count = db.query(HospitalBranch).count()
        if user_count == 0 or hospital_count == 0:
            print("Database is empty or incomplete. Auto-seeding initial dataset...")
            seed_db()
        else:
            print(f"Database ready: {user_count} users, {hospital_count} hospital branches.")
    except Exception as e:
        print(f"Error checking database status, auto-seeding: {e}")
        try:
            seed_db()
        except Exception as seed_err:
            print(f"Failed to seed database: {seed_err}")
    finally:
        db.close()

if __name__ == "__main__":
    # Create tables
    Base.metadata.create_all(bind=engine)
    seed_db()
