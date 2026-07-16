import { Router } from "express";
import { eq, count } from "drizzle-orm";
import path from "path";
import fs from "fs";
import { db } from "@workspace/db";
import { paymentRequestsTable, assignmentsTable } from "@workspace/db";

const router = Router();
const UPLOADS_DIR = path.resolve(process.cwd(), "uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Admin auth middleware
function requireAdmin(req: any, res: any, next: any) {
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

// POST /admin/login
router.post("/admin/login", (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || "ignou@admin2024";
  if (password !== adminPassword) {
    res.status(401).json({ error: "गलत पासवर्ड। Invalid password." });
    return;
  }
  res.json({ token: adminPassword, message: "Login successful" });
});

// GET /admin/payment-requests
router.get("/admin/payment-requests", requireAdmin, async (req, res) => {
  const statusFilter = req.query.status as string | undefined;

  try {
    let query = db.select().from(paymentRequestsTable);
    let rows;
    if (
      statusFilter &&
      ["pending", "approved", "rejected"].includes(statusFilter)
    ) {
      rows = await db
        .select()
        .from(paymentRequestsTable)
        .where(eq(paymentRequestsTable.status, statusFilter as any))
        .orderBy(paymentRequestsTable.createdAt);
    } else {
      rows = await db
        .select()
        .from(paymentRequestsTable)
        .orderBy(paymentRequestsTable.createdAt);
    }

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
    req.log.error({ err }, "Failed to list payment requests");
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /admin/payment-requests/:id/approve
router.patch(
  "/admin/payment-requests/:id/approve",
  requireAdmin,
  async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const [updated] = await db
        .update(paymentRequestsTable)
        .set({ status: "approved", updatedAt: new Date() })
        .where(eq(paymentRequestsTable.id, id))
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
      req.log.error({ err }, "Failed to approve payment request");
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /admin/payment-requests/:id/reject
router.patch(
  "/admin/payment-requests/:id/reject",
  requireAdmin,
  async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const [updated] = await db
        .update(paymentRequestsTable)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(paymentRequestsTable.id, id))
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
      req.log.error({ err }, "Failed to reject payment request");
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// POST /admin/assignments — upload assignment with base64 file
router.post("/admin/assignments", requireAdmin, async (req, res) => {
  const { title, description, subject, year, fileName, fileData } = req.body;

  if (!title || !subject || !year || !fileName || !fileData) {
    res
      .status(400)
      .json({ error: "Title, subject, year, fileName, and fileData are required" });
    return;
  }

  try {
    // Decode base64 and save to disk
    const buffer = Buffer.from(fileData, "base64");
    const safeFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const filePath = path.join(UPLOADS_DIR, safeFileName);
    fs.writeFileSync(filePath, buffer);

    const [inserted] = await db
      .insert(assignmentsTable)
      .values({
        title: title.trim(),
        description: description?.trim() || null,
        subject: subject.trim(),
        year: year.trim(),
        fileName: fileName,
        filePath: safeFileName,
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
    req.log.error({ err }, "Failed to create assignment");
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /admin/assignments/:id
router.delete("/admin/assignments/:id", requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const [deleted] = await db
      .delete(assignmentsTable)
      .where(eq(assignmentsTable.id, id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Assignment not found" });
      return;
    }

    // Delete file from disk
    const filePath = path.join(UPLOADS_DIR, deleted.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "Assignment deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete assignment");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/stats
router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const [totalPaymentsRow] = await db
      .select({ count: count() })
      .from(paymentRequestsTable);
    const [pendingRow] = await db
      .select({ count: count() })
      .from(paymentRequestsTable)
      .where(eq(paymentRequestsTable.status, "pending"));
    const [approvedRow] = await db
      .select({ count: count() })
      .from(paymentRequestsTable)
      .where(eq(paymentRequestsTable.status, "approved"));
    const [rejectedRow] = await db
      .select({ count: count() })
      .from(paymentRequestsTable)
      .where(eq(paymentRequestsTable.status, "rejected"));
    const [totalAssignmentsRow] = await db
      .select({ count: count() })
      .from(assignmentsTable);

    res.json({
      totalPayments: Number(totalPaymentsRow.count),
      pendingPayments: Number(pendingRow.count),
      approvedPayments: Number(approvedRow.count),
      rejectedPayments: Number(rejectedRow.count),
      totalAssignments: Number(totalAssignmentsRow.count),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
