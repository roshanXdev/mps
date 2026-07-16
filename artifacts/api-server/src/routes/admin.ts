import { Router } from "express";
import { eq, count } from "drizzle-orm";
import { db } from "@workspace/db";
import { paymentRequestsTable, assignmentsTable } from "@workspace/db";

const router = Router();

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
    const validStatuses = ["pending", "approved", "rejected"];
    const rows =
      statusFilter && validStatuses.includes(statusFilter)
        ? await db
            .select()
            .from(paymentRequestsTable)
            .where(
              eq(
                paymentRequestsTable.status,
                statusFilter as "pending" | "approved" | "rejected"
              )
            )
            .orderBy(paymentRequestsTable.createdAt)
        : await db
            .select()
            .from(paymentRequestsTable)
            .orderBy(paymentRequestsTable.createdAt);

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

// POST /admin/assignments — stores file as base64 in DB (no filesystem)
router.post("/admin/assignments", requireAdmin, async (req, res) => {
  const { title, description, subject, year, fileName, fileData } = req.body;

  if (!title || !subject || !year || !fileName || !fileData) {
    res
      .status(400)
      .json({ error: "title, subject, year, fileName, and fileData are required" });
    return;
  }

  try {
    const [inserted] = await db
      .insert(assignmentsTable)
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

    res.json({ message: "Assignment deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete assignment");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/stats
router.get("/admin/stats", requireAdmin, async (req, res) => {
  try {
    const [[total], [pending], [approved], [rejected], [totalA]] =
      await Promise.all([
        db.select({ count: count() }).from(paymentRequestsTable),
        db
          .select({ count: count() })
          .from(paymentRequestsTable)
          .where(eq(paymentRequestsTable.status, "pending")),
        db
          .select({ count: count() })
          .from(paymentRequestsTable)
          .where(eq(paymentRequestsTable.status, "approved")),
        db
          .select({ count: count() })
          .from(paymentRequestsTable)
          .where(eq(paymentRequestsTable.status, "rejected")),
        db.select({ count: count() }).from(assignmentsTable),
      ]);

    res.json({
      totalPayments: Number(total.count),
      pendingPayments: Number(pending.count),
      approvedPayments: Number(approved.count),
      rejectedPayments: Number(rejected.count),
      totalAssignments: Number(totalA.count),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get admin stats");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
