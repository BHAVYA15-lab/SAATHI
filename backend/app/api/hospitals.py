import json
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models import HospitalBranch, DoctorAssignment, Doctor, Department, Operation
from app.schemas import HospitalBranchResponse, DoctorAssignmentResponse, OperationResponse, DoctorResponse, DepartmentResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/hospitals", tags=["hospitals"])

def calculate_hospital_score(h: HospitalBranch, dept_name: Optional[str] = None):
    # Parse specialisation from JSON
    spec_dict = {}
    try:
        spec_dict = json.loads(h.specialisation) if h.specialisation else {}
    except:
        pass
    
    spec = spec_dict.get(dept_name, 70) if dept_name else 75
    dist_score = max(0.0, 100.0 - h.distance_km * 8.0)
    wait_score = max(0.0, 100.0 - h.wait_min * 1.4)
    rating_score = (h.rating / 5.0) * 100.0 if h.rating else 80.0
    
    total = spec * 0.4 + dist_score * 0.2 + wait_score * 0.25 + rating_score * 0.15
    return {
        "total": round(total),
        "spec": round(spec),
        "distScore": round(dist_score),
        "waitScore": round(wait_score),
        "ratingScore": round(rating_score)
    }

@router.get("/branches", response_model=List[dict])
def get_hospital_branches(
    dept: Optional[str] = Query(None, description="Filter/Rank by department specialisation"),
    city: Optional[str] = Query(None, description="Filter by city"),
    db: Session = Depends(get_db)
):
    query = db.query(HospitalBranch)
    if city:
        query = query.filter(HospitalBranch.city.ilike(city))
    
    branches = query.all()
    
    results = []
    for b in branches:
        # Load empanelled insurers
        try:
            ins_list = json.loads(b.insurers) if b.insurers else []
        except:
            ins_list = []

        try:
            spec_dict = json.loads(b.specialisation) if b.specialisation else {}
        except:
            spec_dict = {}

        score_details = calculate_hospital_score(b, dept)
        
        # Serialize branch matching Pydantic response expectations (with dynamic scores attached)
        results.append({
            "id": b.id,
            "hospital_id": b.hospital_id,
            "branch_code": b.branch_code,
            "branch_name": b.branch_name,
            "address": b.address,
            "city": b.city,
            "state": b.state,
            "pincode": b.pincode,
            "distance_km": b.distance_km,
            "rating": b.rating,
            "wait_min": b.wait_min,
            "cost_band": b.cost_band,
            "emergency": b.emergency,
            "consult_fee": b.consult_fee,
            "years": b.years,
            "accreditation": b.accreditation,
            "insurers": ins_list,
            "about": b.about,
            "why": b.why,
            "specialisation": spec_dict,
            "score": score_details,
            "hospital": {
                "id": b.hospital.id,
                "name": b.hospital.name,
                "hospital_code": b.hospital.hospital_code,
                "type": b.hospital.type,
                "website": b.hospital.website
            }
        })
    
    # Sort results by score total descending
    results.sort(key=lambda x: x["score"]["total"], reverse=True)
    return results

@router.get("/branches/{branch_id}", response_model=dict)
def get_branch_detail(branch_id: str, db: Session = Depends(get_db)):
    b = db.query(HospitalBranch).filter(HospitalBranch.id == branch_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Hospital branch not found")
        
    try:
        ins_list = json.loads(b.insurers) if b.insurers else []
    except:
        ins_list = []

    try:
        spec_dict = json.loads(b.specialisation) if b.specialisation else {}
    except:
        spec_dict = {}
        
    return {
        "id": b.id,
        "hospital_id": b.hospital_id,
        "branch_code": b.branch_code,
        "branch_name": b.branch_name,
        "address": b.address,
        "city": b.city,
        "state": b.state,
        "pincode": b.pincode,
        "distance_km": b.distance_km,
        "rating": b.rating,
        "wait_min": b.wait_min,
        "cost_band": b.cost_band,
        "emergency": b.emergency,
        "consult_fee": b.consult_fee,
        "years": b.years,
        "accreditation": b.accreditation,
        "insurers": ins_list,
        "about": b.about,
        "why": b.why,
        "specialisation": spec_dict,
        "hospital": {
            "id": b.hospital.id,
            "name": b.hospital.name,
            "hospital_code": b.hospital.hospital_code,
            "type": b.hospital.type,
            "website": b.hospital.website
        }
    }

@router.get("/branches/{branch_id}/doctors", response_model=List[DoctorAssignmentResponse])
def get_branch_doctors(
    branch_id: str, 
    dept: Optional[str] = Query(None, description="Filter by department"),
    db: Session = Depends(get_db)
):
    query = db.query(DoctorAssignment).filter(DoctorAssignment.branch_id == branch_id)
    if dept:
        query = query.join(Department).filter(Department.name.ilike(dept))
        
    assignments = query.all()
    
    results = []
    for a in assignments:
        try:
            days = json.loads(a.working_days) if a.working_days else []
        except:
            days = []

        results.append(DoctorAssignmentResponse(
            id=a.id,
            doctor=DoctorResponse.from_orm(a.doctor),
            branch_id=a.branch_id,
            department=DepartmentResponse.from_orm(a.department),
            consultation_fee=a.consultation_fee,
            working_days=days,
            start_time=a.start_time,
            end_time=a.end_time,
            is_available=a.is_available
        ))
    return results

@router.get("/operations", response_model=List[OperationResponse])
def get_operations(db: Session = Depends(get_db)):
    return db.query(Operation).all()

# Surgery Cost Estimation Endpoint
COST_MULT = {
    "₹": 0.75,
    "₹₹": 1.0,
    "₹₹₹": 1.6
}

@router.get("/operations/estimate", response_model=List[dict])
def get_operations_estimate(
    op_id: str = Query(..., description="Operation procedure ID (e.g. knee, cataract)"),
    insurer_id: str = Query("none", description="Insurer ID empanelment check"),
    db: Session = Depends(get_db)
):
    op = db.query(Operation).filter(Operation.id == op_id).first()
    if not op:
        raise HTTPException(status_code=404, detail="Operation procedure not found")
        
    branches = db.query(HospitalBranch).all()
    
    results = []
    for h in branches:
        cost_mult = COST_MULT.get(h.cost_band, 1.0)
        total = round((op.base_cost * cost_mult) / 500.0) * 500
        
        room = round(total * 0.25)
        surgeon = round(total * 0.40)
        medicines = round(total * 0.20)
        other = total - room - surgeon - medicines
        
        # Check cashless empanelment
        try:
            ins_list = json.loads(h.insurers) if h.insurers else []
        except:
            ins_list = []
            
        empanelled = insurer_id != "none" and insurer_id in ins_list
        
        results.append({
            "hospital_branch_id": h.id,
            "hospital_name": h.branch_name,
            "distance_km": h.distance_km,
            "rating": h.rating,
            "cost_breakup": {
                "room": room,
                "surgeon": surgeon,
                "medicines": medicines,
                "other": other,
                "total": total
            },
            "empanelled": empanelled
        })
        
    # Sort by total cost ascending (cheapest first)
    results.sort(key=lambda x: x["cost_breakup"]["total"])
    return results
