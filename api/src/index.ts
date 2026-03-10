import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { authMiddleware } from "./middleware/auth.js";
import { requireAdmin, requireClinicianOrAdmin } from "./middleware/requireRole.js";
import * as auth from "./routes/auth.js";
import * as me from "./routes/me.js";
import * as carePlans from "./routes/care-plans.js";
import * as home from "./routes/home.js";
import * as profile from "./routes/profile.js";
import * as notifications from "./routes/notifications.js";
import * as sponsorship from "./routes/sponsorship.js";
import * as admin from "./routes/admin.js";
import * as clinician from "./routes/clinician.js";
import * as clinicianPortal from "./routes/clinician-portal.js";
import * as appointments from "./routes/appointments.js";

const app = express();
const upload = multer({ dest: path.join(process.cwd(), "tmp-uploads") });

app.use(cors({ origin: process.env.CORS_ORIGIN ?? true, credentials: true }));
app.use(express.json());

const PORT = process.env.PORT ?? 4001;

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Sign in (for testing / API clients)
app.post("/api/auth/sign-in", (req, res, next) => auth.signIn(req, res).catch(next));

// Auth required for all below
app.use("/api/me", authMiddleware, (req, res) => me.getMe(req as Parameters<typeof me.getMe>[0], res));
app.use("/api/care-plans", authMiddleware, (req, res) => carePlans.listCarePlans(req as Parameters<typeof carePlans.listCarePlans>[0], res));

// Home
app.get("/api/home", authMiddleware, (req, res) => home.getHome(req as Parameters<typeof home.getHome>[0], res));
app.get("/api/home/profile", authMiddleware, (req, res) => home.getHomeProfile(req as Parameters<typeof home.getHomeProfile>[0], res));
app.get("/api/home/sponsored/:id", authMiddleware, (req, res) => home.getSponsoredPatient(req as Parameters<typeof home.getSponsoredPatient>[0], res));
app.get("/api/home/appointments", authMiddleware, (req, res) => home.getHomeAppointments(req as Parameters<typeof home.getHomeAppointments>[0], res));
app.get("/api/home/appointments/:id", authMiddleware, (req, res) => home.getHomeAppointmentById(req as Parameters<typeof home.getHomeAppointmentById>[0], res));

// Sponsorship
app.post("/api/sponsorship/consent-requests", authMiddleware, (req, res) => sponsorship.createConsentRequest(req as Parameters<typeof sponsorship.createConsentRequest>[0], res));
app.post("/api/sponsorship/accept", authMiddleware, (req, res) => sponsorship.acceptConsent(req as Parameters<typeof sponsorship.acceptConsent>[0], res));
app.post("/api/sponsorship/decline", authMiddleware, (req, res) => sponsorship.declineConsent(req as Parameters<typeof sponsorship.declineConsent>[0], res));

// Notifications
app.patch("/api/notifications/:id/read", authMiddleware, (req, res) => notifications.markRead(req as Parameters<typeof notifications.markRead>[0], res));
app.delete("/api/notifications", authMiddleware, (req, res) => notifications.clearAll(req as Parameters<typeof notifications.clearAll>[0], res));

// Profile
app.patch("/api/profile", authMiddleware, (req, res) => profile.updateProfile(req as Parameters<typeof profile.updateProfile>[0], res));
app.post("/api/profile/avatar", authMiddleware, upload.single("avatar"), (req, res) => profile.uploadAvatar(req as Parameters<typeof profile.uploadAvatar>[0], res));

// Admin (admin role required)
app.get("/api/admin/clinicians", authMiddleware, requireAdmin, (req, res) => admin.getClinicians(req as Parameters<typeof admin.getClinicians>[0], res));
app.get("/api/admin/pending-requests", authMiddleware, requireAdmin, (req, res) => admin.getPendingRequests(req as Parameters<typeof admin.getPendingRequests>[0], res));
app.post("/api/admin/approve", authMiddleware, requireAdmin, (req, res) => admin.approveRequest(req as Parameters<typeof admin.approveRequest>[0], res));
app.post("/api/admin/reject", authMiddleware, requireAdmin, (req, res) => admin.rejectRequest(req as Parameters<typeof admin.rejectRequest>[0], res));

// Clinician signup (no auth) - multipart: email, name, license_number, specialty, institution_or_clinic_name, license_image
app.post("/api/clinician/request", upload.fields([{ name: "license_image", maxCount: 1 }]), (req, res, next) => {
  const r = req as unknown as { files?: { license_image?: { path: string; originalname: string; mimetype: string; size: number }[] }; body?: Record<string, string>; file?: { path: string; originalname: string; mimetype: string; size: number } };
  const licenseFile = r.files?.license_image?.[0];
  if (licenseFile) r.file = licenseFile;
  r.body = (r.body ?? {}) as Record<string, string>;
  clinician.submitClinicianRequest(r as Parameters<typeof clinician.submitClinicianRequest>[0], res).catch(next);
});

// Clinician portal (clinician or admin)
app.get("/api/clinician-portal", authMiddleware, requireClinicianOrAdmin, (req, res) => clinicianPortal.getDashboard(req as Parameters<typeof clinicianPortal.getDashboard>[0], res));
app.get("/api/clinician-portal/appointments", authMiddleware, requireClinicianOrAdmin, (req, res) => clinicianPortal.getClinicianPortalAppointments(req as Parameters<typeof clinicianPortal.getClinicianPortalAppointments>[0], res));
app.get("/api/clinician-portal/appointments/:id", authMiddleware, requireClinicianOrAdmin, (req, res) => clinicianPortal.getClinicianPortalAppointmentById(req as Parameters<typeof clinicianPortal.getClinicianPortalAppointmentById>[0], res));
app.get("/api/clinician-portal/profile", authMiddleware, requireClinicianOrAdmin, (req, res) => clinicianPortal.getClinicianProfile(req as Parameters<typeof clinicianPortal.getClinicianProfile>[0], res));

// Appointments (clinician or admin)
app.post("/api/appointments", authMiddleware, requireClinicianOrAdmin, (req, res) => appointments.createAppointment(req as Parameters<typeof appointments.createAppointment>[0], res));
app.patch("/api/appointments/:id/status", authMiddleware, requireClinicianOrAdmin, (req, res) => appointments.updateAppointmentStatus(req as Parameters<typeof appointments.updateAppointmentStatus>[0], res));
app.patch("/api/appointments/:id/reschedule", authMiddleware, requireClinicianOrAdmin, (req, res) => appointments.rescheduleAppointment(req as Parameters<typeof appointments.rescheduleAppointment>[0], res));
app.post("/api/appointments/:id/notes", authMiddleware, requireClinicianOrAdmin, (req, res) => appointments.addNote(req as Parameters<typeof appointments.addNote>[0], res));
app.post("/api/appointments/:id/services", authMiddleware, requireClinicianOrAdmin, (req, res) => appointments.addService(req as Parameters<typeof appointments.addService>[0], res));
app.post("/api/appointments/:id/metrics", authMiddleware, requireClinicianOrAdmin, (req, res) => appointments.recordMetrics(req as Parameters<typeof appointments.recordMetrics>[0], res));

const basePort = Number(process.env.PORT) || 4001;
const maxTries = 10;

function tryListen(port: number): void {
  const server = app.listen(port, () => {
    console.log(`API server listening on http://localhost:${port}`);
  });
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE" && port - basePort < maxTries) {
      tryListen(port + 1);
    } else {
      console.error(err);
      process.exit(1);
    }
  });
}
tryListen(basePort);
