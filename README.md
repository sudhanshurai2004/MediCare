<p align="center">
  <h1 align="center">MediCare</h1>
</p>

<p align="center">
  Live hospital appointment platform — book a doctor, pay, and get clinic guidance in one place.
</p>

<p align="center">
  <a href="https://medi-care-iota-one.vercel.app/"><img src="https://img.shields.io/badge/Live_Demo-0f7a4a?style=for-the-badge" alt="Live demo" /></a>
  <a href="https://github.com/sudhanshurai2004/MediCare"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github" alt="GitHub" /></a>
  <a href="https://medicare-jxli.onrender.com/api/health"><img src="https://img.shields.io/badge/API-ok-0ea5e9?style=for-the-badge" alt="API health" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=111" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Tailwind-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
</p>

<p align="center">
  <img src="docs/screenshots/01-home.png" alt="MediCare homepage" width="920" />
</p>

---

## 🔗 Live Links

- **Frontend / Patient Site**: [https://medi-care-iota-one.vercel.app/](https://medi-care-iota-one.vercel.app/)
- **Admin Panel**: [https://medi-care-pf2r.vercel.app/](https://medi-care-pf2r.vercel.app/)
- **Backend API**: [https://medicare-jxli.onrender.com](https://medicare-jxli.onrender.com)
- **GitHub Repository**: [https://github.com/sudhanshurai2004/MediCare](https://github.com/sudhanshurai2004/MediCare)

---

## 🚀 Features

- **For Patients:** Browse available doctors, view specializations, and book appointments seamlessly.
- **For Doctors:** Dedicated login to view and manage upcoming appointments, and update profile/availability.
- **For Admins:** Manage doctors, specializations, and overall clinic activities through a separate admin dashboard.
- **Payments:** Support for both cash (at hospital) and online payments.

---

## 📸 Product Tour

### Find a Doctor
Search by name or specialization. Open their profile to see their fees, availability, and to book an appointment.
<p align="center">
  <img src="docs/screenshots/02-doctors.png" alt="Doctors directory" width="920" />
</p>

### Doctor Profile & Booking
Patient form and live booking summary.
<p align="center">
  <img src="docs/screenshots/08-doctor.png" alt="Doctor profile and appointment form" width="920" />
</p>

### Diagnostic Services
Book lab tests and diagnostic services with the same ease as booking a doctor.
<p align="center">
  <img src="docs/screenshots/03-services.png" alt="Diagnostic services" width="920" />
</p>

### Payments
Pay via cash at the hospital or online.
<p align="center">
  <img src="docs/screenshots/05-payments.png" alt="Payments page" width="920" />
</p>

### Doctor Login Dashboard
A dedicated panel for doctors to see their scheduled appointments and update their profile.
<p align="center">
  <img src="docs/screenshots/07-login.png" alt="Doctor login" width="920" />
</p>

---

## 💻 Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Lucide Icons, React Router
- **Admin:** React (Vite), Tailwind CSS
- **Backend:** Node.js, Express, MongoDB Atlas, Mongoose
- **Auth:** Clerk (Frontend), bcryptjs + JWT (Backend/Doctors)
- **Deployment:** Vercel (Frontend & Admin), Render (Backend API)

---

## 🛠️ Run Locally

### 1. Clone the repository
```bash
git clone https://github.com/sudhanshurai2004/MediCare.git
cd MediCare
```

### 2. Setup Environment Variables
Create `.env` files in `frontend`, `backend`, and `admin` directories by copying the `.env.example` files (if provided) and fill in the required keys (e.g., MongoDB URI, Clerk API keys).

### 3. Start Backend
```bash
cd backend
npm install
npm run dev
```
API runs on `http://localhost:4000`

### 4. Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

### 5. Start Admin
```bash
cd admin
npm install
npm run dev
```
Admin runs on `http://localhost:5174`

---

## 👤 Author

**Sudhanshu Rai**
- GitHub: [@sudhanshurai2004](https://github.com/sudhanshurai2004)
