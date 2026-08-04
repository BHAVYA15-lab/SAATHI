import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Patient, Doctor
from app.schemas import UserCreate, Token, UserResponse, PatientResponse
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/signup", response_model=Token)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists"
        )
    
    # Create new user
    db_user = User(
        email=user_in.email,
        password_hash=get_password_hash(user_in.password),
        role=user_in.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Create role profile
    if user_in.role == "patient":
        db_patient = Patient(
            user_id=db_user.id,
            full_name=user_in.full_name,
            insurer_id=user_in.insurer_id or "none",
            city=user_in.city or "Mumbai",
            pincode=user_in.pincode
        )
        import json
        db_patient.chronic_conditions = json.dumps(user_in.conditions or ["None"])
        db.add(db_patient)
        db.commit()
    elif user_in.role == "doctor":
        db_doctor = Doctor(
            user_id=db_user.id,
            full_name=user_in.full_name,
            specialization="General Medicine",
            experience_years=5,
            consultation_fee=500
        )
        db.add(db_doctor)
        db.commit()

    # Generate token
    access_token = create_access_token(subject=db_user.id)
    return {"access_token": access_token, "token_type": "bearer"}

# Form data login compatibility (FastAPI Swagger standard)
from fastapi.security import OAuth2PasswordRequestForm

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

# Custom JSON login for react app convenience
from pydantic import BaseModel
class LoginPayload(BaseModel):
    email: str
    password: str

@router.post("/login-json", response_model=Token)
def login_json(payload: LoginPayload, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(subject=user.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/me/patient", response_model=PatientResponse)
def get_me_patient(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user is not a patient"
        )
    patient = db.query(Patient).filter(Patient.user_id == current_user.id).first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient profile not found"
        )
    
    # parse chronic_conditions
    import json
    try:
        conditions = json.loads(patient.chronic_conditions) if patient.chronic_conditions else ["None"]
    except:
        conditions = [patient.chronic_conditions] if patient.chronic_conditions else ["None"]
        
    return PatientResponse(
        id=patient.id,
        user_id=patient.user_id,
        full_name=patient.full_name,
        phone=patient.phone,
        date_of_birth=patient.date_of_birth,
        gender=patient.gender,
        blood_group=patient.blood_group,
        emergency_contact=patient.emergency_contact,
        profile_image=patient.profile_image,
        chronic_conditions=conditions,
        insurer_id=patient.insurer_id,
        city=patient.city,
        pincode=patient.pincode
    )

from app.schemas import DoctorResponse

@router.get("/me/doctor", response_model=DoctorResponse)
def get_me_doctor(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current user is not a doctor"
        )
    doctor = db.query(Doctor).filter(Doctor.user_id == current_user.id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    return doctor
