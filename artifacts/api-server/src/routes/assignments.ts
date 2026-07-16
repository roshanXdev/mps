import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { assignmentsTable, paymentRequestsTable } from "@workspace/db";

const router = Router();

// GET /assignments — list all assignments (public metadata, no file content)
router.get("/assignments", async (req, res) => {
  try {
    const assignments = await db
      .select({
        id: assignmentsTable.id,
        title: assignmentsTable.title,
        description: assignmentsTable.description,
        subject: assignmentsTable.subject,
        year: assignmentsTable.year,
        fileName: assignmentsTable.fileName,
        createdAt: assignmentsTable.createdAt,
      })
      .from(assignmentsTable)
      .orderBy(assignmentsTable.createdAt);

    res.json(
      assignments.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list assignments");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /assignments/:id/download — download assignment (requires approved payment)
router.get("/assignments/:id/download", async (req, res) => {
  const id = parseInt(req.params.id);
  const phone = req.query.phone as string;

  if (!phone) {
    res.status(400).json({ error: "Phone number required" });
    return;
  }

  try {
    const paymentRows = await db
      .select()
      .from(paymentRequestsTable)
      .where(eq(paymentRequestsTable.phone, phone))
      .limit(1);

    if (paymentRows.length === 0 || paymentRows[0].status !== "approved") {
      res.status(402).json({ error: "Payment required or not yet approved" });
      return;
    }

    const rows = await db
      .select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.id, id))
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
    req.log.error({ err }, "Failed to download assignment");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
