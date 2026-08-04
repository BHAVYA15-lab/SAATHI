# 🩺 Saathi — Healthcare Intelligence & SaaS Platform

🔗 **Live Demo**: [https://saathi-taupe-iota.vercel.app](https://saathi-taupe-iota.vercel.app)  
*Backend API: `https://saathi-ntbk.onrender.com/api` | API Docs: `https://saathi-ntbk.onrender.com/docs`*

---

Saathi is an all-in-one healthcare web platform that connects patients, doctors, and hospital administrators in a single system. Patients get an instant AI symptom check, hospital matching, and transparent surgery cost estimates. Doctors get a clean daily schedule board, patient history logs, and instant digital prescription tools. Hospital managers get live charts tracking bed capacity, department workload, and insurance claim approvals.

---

### 🚀 Try It Yourself

Click the live link above and log in with any of these pre-seeded demo accounts:

| Portal | Login Email | Password | What You Can Test |
| :--- | :--- | :--- | :--- |
| **Patient App** | `aditi@email.com` | `password` | Run AI symptom check, chat with clinical bot, book slots, view timeline & insurance estimates |
| **Doctor Console** | `dr.vaidya@apexcare.in` | `password` | View live schedule board, check no-show risk badges, write prescriptions, view peer benchmarks |
| **Hospital Admin BI** | `ops@horizonhospital.in` | `password` | Track department capacity load, staffing recommendations, and insurance claims status |

---

### 💡 What Makes This Interesting

* **Three Personas, One Unified Architecture**: Most portfolio projects focus on a single user type. Saathi connects patients, physicians, and hospital operators so data flows naturally across all three workflows.
* **Smart Deployment Split**: Built with a React SPA on Vercel's global CDN and a FastAPI Python backend on Render. This keeps the user interface fast while giving the Python backend a persistent execution environment.
* **Zero-Downtime Database Flexibility**: Designed to run on SQLite out of the box with automatic startup database seeding, but fully compatible with production PostgreSQL (Neon / Supabase) by changing a single `DATABASE_URL` environment variable.
* **Empathetic AI Triage Engine**: The built-in AI assistant does not just dump clinical department names; it handles emotional inputs like stress, fatigue, and anxiety with supportive dialogue while querying real database providers.

---

### 🛠️ Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| **Data Viz** | Recharts (Vitals history, workload gauges, claims status) |
| **Backend** | Python 3.11, FastAPI, Uvicorn |
| **Database & ORM** | SQLAlchemy 2.0, SQLite (default) / PostgreSQL (production ready) |
| **Authentication** | PyJWT (JSON Web Tokens), Passlib / Bcrypt |

---

### 📸 Key Screenshots

> *Add screenshots of your live deployment here for maximum visual impact.*

- **Patient Dashboard & AI Assistant**: `[Screenshot: Symptom Triage Scan & Conversational Advisor Widget]`
- **Physician Scheduling Console**: `[Screenshot: 12-Column Schedule Board with Risk Badges & Rx Writer]`
- **Hospital Command Center**: `[Screenshot: Capacity Forecasting Gauges & Claims Clearance Bar Chart]`

---

### 💻 Run It Locally

Follow these step-by-step commands to run Saathi on your own computer:

#### 1. Clone the project
```bash
git clone https://github.com/your-username/SAATHI.git
cd SAATHI
```

#### 2. Start the Backend API
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Create your local environment file
cp .env.example .env
```

> **Important**: Generate a fresh secret key for `.env` by running:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```
> Copy the output string and set `SECRET_KEY=<your-generated-key>` inside `backend/.env`. Never use default secret keys in production.

Seed the database and start the server:
```bash
python -m app.seed
uvicorn app.main:app --reload --port 8000
```
*Backend will run at: `http://127.0.0.1:8000` (Swagger docs at `http://127.0.0.1:8000/docs`)*

#### 3. Start the Frontend App
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*Frontend will run at: `http://localhost:5173`*

---

### 🎯 Technical Challenges Solved

Here are key engineering problems tackled while building Saathi:

1. **SQLite JSON Array Parsing in Pydantic Schemas**
   * *Problem*: SQLite stores lists (like patient chronic conditions or doctor working days) as JSON strings. Pydantic threw validation errors when returning database models expected as Python lists.
   * *Solution*: Wrote pre-validators (`@field_validator` with `mode="before"`) in `schemas.py` that automatically detect stringified JSON and deserialize it into native Python lists before response serialization.

2. **Doctor Appointment Slot Routing 404 Mismatch**
   * *Problem*: The frontend calendar called `/api/appointments/doctors/{id}/slots?date=...`, but the backend only listened on `/api/appointments/slots`.
   * *Solution*: Updated `appointments.py` with multi-route decorators and flexible query parameter resolution (`assignment_id` vs `doctor_assignment_id`), supporting both query structures seamlessly.

3. **Defensive Null-Safety on Open Calendar Slots**
   * *Problem*: Opening patient medical histories threw JavaScript `TypeError: Cannot read properties of null (reading 'id')` on unbooked doctor availability slots.
   * *Solution*: Updated `AppointmentResponse` Pydantic models to mark `patient` and `assignment` as optional, and added optional chaining (`s.patient?.id`) across React components.

---

### 🔮 What I'd Build Next

* **WebRTC Telehealth Video Consultations**: Direct peer-to-peer video rooms for online doctor appointments.
* **Automated PDF Prescription Generator**: Export completed prescriptions and hospital receipts directly as downloadable PDFs.
* **Real-time WebSockets Notifications**: Instant push alerts when insurance pre-authorizations are approved.

---

### 📜 License

Distributed under the MIT License.
