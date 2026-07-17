// @ts-nocheck
/**
 * Vercel Serverless API — Self-contained Express app.
 * All assignment files are stored as base64 in PostgreSQL (no filesystem).
 * Deployed as a single Vercel function handling all /api/* routes.
 *
 * Required environment variables on Vercel:
 *   DATABASE_URL  — PostgreSQL connection string (e.g. Neon, Supabase, Railway)
 *   ADMIN_PASSWORD — Admin panel password (default: ignou@admin2024)
 */

import express from "express";
import cors from "cors";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, serial, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { eq, count } from "drizzle-orm";

// ─── Schema (inline to avoid workspace imports) ──────────────────────────────

const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "approved",
  "rejected",
]);

const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  subject: text("subject").notNull(),
  year: text("year").notNull(),
  fileName: text("file_name").notNull(),
  fileContent: text("file_content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const paymentRequests = pgTable("payment_requests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  utrNumber: text("utr_number").notNull(),
  status: paymentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Database ─────────────────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// ─── App setup ────────────────────────────────────────────────────────────────

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "50mb" }));

// ─── Admin auth middleware ─────────────────────────────────────────────────────

function requireAdmin(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const adminPassword = process.env.ADMIN_PASSWORD || "ignou@admin2024";
  if (token !== adminPassword) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// GET /api/assignments — public list (no file content)
app.get("/api/assignments", async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        description: assignments.description,
        subject: assignments.subject,
        year: assignments.year,
        fileName: assignments.fileName,
        createdAt: assignments.createdAt,
      })
      .from(assignments)
      .orderBy(assignments.createdAt);

    res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
  } catch (err) {
    console.error("listAssignments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/assignments/:id/download — requires approved payment
app.get("/api/assignments/:id/download", async (req, res) => {
  const id = parseInt(req.params.id);
  const phone = req.query.phone as string;

  if (!phone) {
    res.status(400).json({ error: "Phone number required" });
    return;
  }

  try {
    const payments = await db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.phone, phone))
      .limit(1);

    if (payments.length === 0 || payments[0].status !== "approved") {
      res.status(402).json({ error: "Payment required or not yet approved" });
      return;
    }

    const rows = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, id))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    const assignment = rows[0];
    const buffer = Buffer.from(assignment.fileContent, "base64");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${assignment.fileName}"`
    );
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", String(buffer.length));
    res.send(buffer);
  } catch (err) {
    console.error("downloadAssignment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/payment-requests — submit after UPI payment
app.post("/api/payment-requests", async (req, res) => {
  const { name, phone, utrNumber } = req.body as {
    name?: string;
    phone?: string;
    utrNumber?: string;
  };

  if (!name || !phone || !utrNumber) {
    res
      .status(400)
      .json({ error: "Name, phone, and UTR number are required" });
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    res.status(400).json({ error: "Phone must be a 10-digit number" });
    return;
  }

  try {
    const existing = await db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.phone, phone))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({
        error:
          "Payment request already exists for this phone. Check status on the verify page.",
      });
      return;
    }

    const [inserted] = await db
      .insert(paymentRequests)
      .values({ name: name.trim(), phone: phone.trim(), utrNumber: utrNumber.trim() })
      .returning();

    res.status(201).json({
      id: inserted.id,
      name: inserted.name,
      phone: inserted.phone,
      utrNumber: inserted.utrNumber,
      status: inserted.status,
      createdAt: inserted.createdAt.toISOString(),
      updatedAt: inserted.updatedAt.toISOString(),
    });
  } catch (err) {
    console.error("submitPaymentRequest error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/payment-requests/check?phone=...
app.get("/api/payment-requests/check", async (req, res) => {
  const phone = req.query.phone as string;

  if (!phone) {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(paymentRequests)
      .where(eq(paymentRequests.phone, phone))
      .limit(1);

    if (rows.length === 0) {
      res
        .status(404)
        .json({ error: "No payment request found for this phone number" });
      return;
    }

    const pr = rows[0];
    res.json({ status: pr.status, name: pr.name, phone: pr.phone });
  } catch (err) {
    console.error("checkPaymentStatus error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/login
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD || "ignou@admin2024";
  if (password !== adminPassword) {
    res.status(401).json({ error: "गलत पासवर्ड। Invalid password." });
    return;
  }
  res.json({ token: adminPassword, message: "Login successful" });
});

// GET /api/admin/payment-requests
app.get("/api/admin/payment-requests", requireAdmin, async (req, res) => {
  const statusFilter = req.query.status as string | undefined;

  try {
    const validStatuses = ["pending", "approved", "rejected"];
    const rows =
      statusFilter && validStatuses.includes(statusFilter)
        ? await db
            .select()
            .from(paymentRequests)
            .where(
              eq(paymentRequests.status, statusFilter as "pending" | "approved" | "rejected")
            )
            .orderBy(paymentRequests.createdAt)
        : await db
            .select()
            .from(paymentRequests)
            .orderBy(paymentRequests.createdAt);

    res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        utrNumber: r.utrNumber,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))
    );
  } catch (err) {
    console.error("listPaymentRequests error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/payment-requests/:id/approve
app.patch(
  "/api/admin/payment-requests/:id/approve",
  requireAdmin,
  async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const [updated] = await db
        .update(paymentRequests)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(paymentRequests.id, id))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Payment request not found" });
        return;
      }

      res.json({
        id: updated.id,
        name: updated.name,
        phone: updated.phone,
        utrNumber: updated.utrNumber,
        status: updated.status,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
    } catch (err) {
      console.error("approvePaymentRequest error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /api/admin/payment-requests/:id/reject
app.patch(
  "/api/admin/payment-requests/:id/reject",
  requireAdmin,
  async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const [updated] = await db
        .update(paymentRequests)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(paymentRequests.id, id))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Payment request not found" });
        return;
      }

      res.json({
        id: updated.id,
        name: updated.name,
        phone: updated.phone,
        utrNumber: updated.utrNumber,
        status: updated.status,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      });
    } catch (err) {
      console.error("rejectPaymentRequest error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /api/admin/assignments — stores file as base64 in DB
app.post("/api/admin/assignments", requireAdmin, async (req, res) => {
  const { title, description, subject, year, fileName, fileData } =
    req.body as {
      title?: string;
      description?: string;
      subject?: string;
      year?: string;
      fileName?: string;
      fileData?: string;
    };

  if (!title || !subject || !year || !fileName || !fileData) {
    res
      .status(400)
      .json({ error: "title, subject, year, fileName, fileData are required" });
    return;
  }

  try {
    const [inserted] = await db
      .insert(assignments)
      .values({
        title: title.trim(),
        description: description?.trim() || null,
        subject: subject.trim(),
        year: year.trim(),
        fileName,
        fileContent: fileData,
      })
      .returning();

    res.status(201).json({
      id: inserted.id,
      title: inserted.title,
      description: inserted.description,
      subject: inserted.subject,
      year: inserted.year,
      fileName: inserted.fileName,
      createdAt: inserted.createdAt.toISOString(),
    });
  } catch (err) {
    console.error("createAssignment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/assignments/:id
app.delete("/api/admin/assignments/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [deleted] = await db
      .delete(assignments)
      .where(eq(assignments.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    res.json({ message: "Assignment deleted successfully" });
  } catch (err) {
    console.error("deleteAssignment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/stats
app.get("/api/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const [[total], [pending], [approved], [rejected], [totalA]] =
      await Promise.all([
        db.select({ count: count() }).from(paymentRequests),
        db
          .select({ count: count() })
          .from(paymentRequests)
          .where(eq(paymentRequests.status, "pending")),
        db
          .select({ count: count() })
          .from(paymentRequests)
          .where(eq(paymentRequests.status, "approved")),
        db
          .select({ count: count() })
          .from(paymentRequests)
          .where(eq(paymentRequests.status, "rejected")),
        db.select({ count: count() }).from(assignments),
      ]);

    res.json({
      totalPayments: Number(total.count),
      pendingPayments: Number(pending.count),
      approvedPayments: Number(approved.count),
      rejectedPayments: Number(rejected.count),
      totalAssignments: Number(totalA.count),
    });
  } catch (err) {
    console.error("getAdminStats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Vercel serverless function handler
export default async function handler(req, res) {
  await app(req, res);
}
