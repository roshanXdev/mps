import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { paymentRequestsTable } from "@workspace/db";

const router = Router();

// POST /payment-requests — submit payment request
router.post("/payment-requests", async (req, res) => {
  const { name, phone, utrNumber } = req.body;

  if (!name || !phone || !utrNumber) {
    res.status(400).json({ error: "Name, phone, and UTR number are required" });
    return;
  }

  if (!/^\d{10}$/.test(phone)) {
    res.status(400).json({ error: "Phone must be a 10-digit number" });
    return;
  }

  try {
    // Check if phone already submitted
    const existing = await db
      .select()
      .from(paymentRequestsTable)
      .where(eq(paymentRequestsTable.phone, phone))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({
        error:
          "A payment request for this phone number already exists. Check your status on the verify page.",
      });
      return;
    }

    const [inserted] = await db
      .insert(paymentRequestsTable)
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
    req.log.error({ err }, "Failed to submit payment request");
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /payment-requests/check — check payment status by phone
router.get("/payment-requests/check", async (req, res) => {
  const phone = req.query.phone as string;

  if (!phone) {
    res.status(400).json({ error: "Phone number is required" });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(paymentRequestsTable)
      .where(eq(paymentRequestsTable.phone, phone))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: "No payment request found for this phone number" });
      return;
    }

    const pr = rows[0];
    res.json({
      status: pr.status,
      name: pr.name,
      phone: pr.phone,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to check payment status");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
