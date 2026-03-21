import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { authMiddleware } from "./middleware/auth.js";
import {
  requireAdmin,
  requireClinicianOrAdmin,
} from "./middleware/requireRole.js";
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
import * as stripe from "./routes/stripe.js";

const app = express();
const upload = multer({ dest: path.join(process.cwd(), "tmp-uploads") });

app.use(cors({ origin: process.env.CORS_ORIGIN ?? true, credentials: true }));

// Stripe webhook must receive raw body for signature verification (before express.json())
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => stripe.handleStripeWebhook(req, res).catch(next),
);
app.use(express.json());

// Simple request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;

  res.on("finish", () => {
    const duration = Date.now() - start;
    // Example: GET /api/home 200 - 12ms
    console.log(`${method} ${originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
});

const PORT = process.env.PORT ?? 4001;

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Auth (no auth middleware)
app.post("/api/auth/sign-in", (req, res, next) =>
  auth.signIn(req, res).catch(next),
);
app.post("/api/auth/sign-up", (req, res, next) =>
  auth.signUpRoute(req, res).catch(next),
);
app.post("/api/auth/send-otp", (req, res, next) =>
  auth.sendOtpRoute(req, res).catch(next),
);
app.post("/api/auth/verify-otp", (req, res, next) =>
  auth.verifyOtpRoute(req, res).catch(next),
);

// Auth required for all below
app.use("/api/me", authMiddleware, (req, res, next) =>
  me.getMe(req as Parameters<typeof me.getMe>[0], res).catch(next),
);
app.use("/api/care-plans", authMiddleware, (req, res, next) =>
  carePlans
    .listCarePlans(req as Parameters<typeof carePlans.listCarePlans>[0], res)
    .catch(next),
);

// Home
app.get("/api/home", authMiddleware, (req, res, next) =>
  home.getHome(req as Parameters<typeof home.getHome>[0], res).catch(next),
);
app.get("/api/home/profile", authMiddleware, (req, res, next) =>
  home
    .getHomeProfile(req as Parameters<typeof home.getHomeProfile>[0], res)
    .catch(next),
);
app.get("/api/home/sponsored/:id", authMiddleware, (req, res, next) =>
  home
    .getSponsoredPatient(
      req as Parameters<typeof home.getSponsoredPatient>[0],
      res,
    )
    .catch(next),
);
app.get("/api/home/appointments", authMiddleware, (req, res, next) =>
  home
    .getHomeAppointments(
      req as Parameters<typeof home.getHomeAppointments>[0],
      res,
    )
    .catch(next),
);
app.get("/api/home/appointments/:id", authMiddleware, (req, res, next) =>
  home
    .getHomeAppointmentById(
      req as Parameters<typeof home.getHomeAppointmentById>[0],
      res,
    )
    .catch(next),
);

// Sponsorship
app.post(
  "/api/sponsorship/create-payment",
  authMiddleware,
  (req: express.Request, res, next) =>
    stripe
      .createSponsorshipPayment(
        req as Parameters<typeof stripe.createSponsorshipPayment>[0],
        res,
      )
      .catch(next),
);
app.post("/api/stripe/portal", authMiddleware, (req, res, next) =>
  stripe
    .createCustomerPortalSession(
      req as Parameters<typeof stripe.createCustomerPortalSession>[0],
      res,
    )
    .catch(next),
);
app.post(
  "/api/sponsorship/consent-requests",
  authMiddleware,
  (req, res, next) =>
    sponsorship
      .createConsentRequest(
        req as Parameters<typeof sponsorship.createConsentRequest>[0],
        res,
      )
      .catch(next),
);
app.post("/api/sponsorship/accept", authMiddleware, (req, res, next) =>
  sponsorship
    .acceptConsent(req as Parameters<typeof sponsorship.acceptConsent>[0], res)
    .catch(next),
);
app.post("/api/sponsorship/decline", authMiddleware, (req, res, next) =>
  sponsorship
    .declineConsent(
      req as Parameters<typeof sponsorship.declineConsent>[0],
      res,
    )
    .catch(next),
);
app.post("/api/sponsorship/end", authMiddleware, (req, res, next) =>
  sponsorship
    .endSponsorship(
      req as Parameters<typeof sponsorship.endSponsorship>[0],
      res,
    )
    .catch(next),
);

// Notifications
app.get("/api/notifications", authMiddleware, (req, res, next) =>
  notifications
    .listNotifications(
      req as Parameters<typeof notifications.listNotifications>[0],
      res,
    )
    .catch(next),
);
app.patch("/api/notifications/:id/read", authMiddleware, (req, res, next) =>
  notifications
    .markRead(req as Parameters<typeof notifications.markRead>[0], res)
    .catch(next),
);
app.delete("/api/notifications", authMiddleware, (req, res, next) =>
  notifications
    .clearAll(req as Parameters<typeof notifications.clearAll>[0], res)
    .catch(next),
);

// Profile
app.patch("/api/profile", authMiddleware, (req, res, next) =>
  profile
    .updateProfile(req as Parameters<typeof profile.updateProfile>[0], res)
    .catch(next),
);
app.post(
  "/api/profile/avatar",
  authMiddleware,
  upload.single("avatar"),
  (req, res, next) =>
    profile
      .uploadAvatar(req as Parameters<typeof profile.uploadAvatar>[0], res)
      .catch(next),
);
app.delete("/api/profile/avatar", authMiddleware, (req, res, next) =>
  profile
    .deleteAvatar(req as Parameters<typeof profile.deleteAvatar>[0], res)
    .catch(next),
);

// Admin (admin role required)
app.get(
  "/api/admin/clinicians",
  authMiddleware,
  requireAdmin,
  (req, res, next) =>
    admin
      .getClinicians(req as Parameters<typeof admin.getClinicians>[0], res)
      .catch(next),
);
app.get(
  "/api/admin/pending-requests",
  authMiddleware,
  requireAdmin,
  (req, res, next) =>
    admin
      .getPendingRequests(
        req as Parameters<typeof admin.getPendingRequests>[0],
        res,
      )
      .catch(next),
);
app.post("/api/admin/approve", authMiddleware, requireAdmin, (req, res, next) =>
  admin
    .approveRequest(req as Parameters<typeof admin.approveRequest>[0], res)
    .catch(next),
);
app.post("/api/admin/reject", authMiddleware, requireAdmin, (req, res, next) =>
  admin
    .rejectRequest(req as Parameters<typeof admin.rejectRequest>[0], res)
    .catch(next),
);

// Clinician signup (no auth) - multipart: email, name, license_number, specialty, institution_or_clinic_name, license_image
app.post(
  "/api/clinician/request",
  upload.fields([{ name: "license_image", maxCount: 1 }]),
  (req, res, next) => {
    const r = req as unknown as {
      files?: {
        license_image?: {
          path: string;
          originalname: string;
          mimetype: string;
          size: number;
        }[];
      };
      body?: Record<string, string>;
      file?: {
        path: string;
        originalname: string;
        mimetype: string;
        size: number;
      };
    };
    const licenseFile = r.files?.license_image?.[0];
    if (licenseFile) r.file = licenseFile;
    r.body = (r.body ?? {}) as Record<string, string>;
    clinician
      .submitClinicianRequest(
        r as Parameters<typeof clinician.submitClinicianRequest>[0],
        res,
      )
      .catch(next);
  },
);

// Clinician portal (clinician or admin)
app.get(
  "/api/clinician-portal",
  authMiddleware,
  requireClinicianOrAdmin,
  (req, res, next) =>
    clinicianPortal
      .getDashboard(
        req as Parameters<typeof clinicianPortal.getDashboard>[0],
        res,
      )
      .catch(next),
);
app.get(
  "/api/clinician-portal/appointments",
  authMiddleware,
  requireClinicianOrAdmin,
  (req, res, next) =>
    clinicianPortal
      .getClinicianPortalAppointments(
        req as Parameters<
          typeof clinicianPortal.getClinicianPortalAppointments
        >[0],
        res,
      )
      .catch(next),
);
app.get(
  "/api/clinician-portal/appointments/:id",
  authMiddleware,
  requireClinicianOrAdmin,
  (req, res, next) =>
    clinicianPortal
      .getClinicianPortalAppointmentById(
        req as Parameters<
          typeof clinicianPortal.getClinicianPortalAppointmentById
        >[0],
        res,
      )
      .catch(next),
);
app.get(
  "/api/clinician-portal/profile",
  authMiddleware,
  requireClinicianOrAdmin,
  (req, res, next) =>
    clinicianPortal
      .getClinicianProfile(
        req as Parameters<typeof clinicianPortal.getClinicianProfile>[0],
        res,
      )
      .catch(next),
);

// Appointments (clinician or admin)
app.post(
  "/api/appointments",
  authMiddleware,
  requireClinicianOrAdmin,
  (req, res, next) =>
    appointments
      .createAppointment(
        req as Parameters<typeof appointments.createAppointment>[0],
        res,
      )
      .catch(next),
);
app.patch(
  "/api/appointments/:id/status",
  authMiddleware,
  requireClinicianOrAdmin,
  (req, res, next) =>
    appointments
      .updateAppointmentStatus(
        req as Parameters<typeof appointments.updateAppointmentStatus>[0],
        res,
      )
      .catch(next),
);
app.patch(
  "/api/appointments/:id/reschedule",
  authMiddleware,
  requireClinicianOrAdmin,
  (req, res, next) =>
    appointments
      .rescheduleAppointment(
        req as Parameters<typeof appointments.rescheduleAppointment>[0],
        res,
      )
      .catch(next),
);
app.post(
  "/api/appointments/:id/notes",
  authMiddleware,
  requireClinicianOrAdmin,
  (req, res, next) =>
    appointments
      .addNote(req as Parameters<typeof appointments.addNote>[0], res)
      .catch(next),
);
app.post(
  "/api/appointments/:id/services",
  authMiddleware,
  requireClinicianOrAdmin,
  (req, res, next) =>
    appointments
      .addService(req as Parameters<typeof appointments.addService>[0], res)
      .catch(next),
);
app.post(
  "/api/appointments/:id/metrics",
  authMiddleware,
  requireClinicianOrAdmin,
  (req, res, next) =>
    appointments
      .recordMetrics(
        req as Parameters<typeof appointments.recordMetrics>[0],
        res,
      )
      .catch(next),
);

// 404 handler for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }
  return next();
});

// Central error handler
app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction,
  ) => {
    const status = (err as { status?: number }).status ?? 500;
    const message =
      (err as { message?: string }).message ?? "Internal server error";

    console.error(`Error handling ${req.method} ${req.originalUrl}:`, err);

    if (res.headersSent) {
      return;
    }

    if (status >= 500) {
      res.status(status).json({ error: "Internal server error" });
    } else {
      res.status(status).json({ error: message });
    }
  },
);

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
