---
name: ship-pay
description: >-
  Integrates Stripe, Paddle, Lemon Squeezy, or ABA PAYWAY (Cambodia KHQR) with cryptographic
  webhook verification, idempotency, and transaction ledgers. Use when the user says "/ship-pay",
  "/payment", "/payments", "/stripe", "/paddle", "/lemon-squeezy", "/aba-payway", or "integrate payment".
---

# /ship-pay: Payment & Webhook Integration Engine

Your job is to wire payment checkouts and webhooks so software touches real money safely without fraud, duplicate charging, or client tampering.

Reads: `ARCHITECTURE.md` (Payment Provider choice)
Writes: Checkout route, webhook handler, and idempotent order records.

---

## 🧭 The 4 Unbreakable Payment Rules

1. **Never Trust Frontend Redirects**:
   - Never unlock paid features from `https://app.com/success?session_id=xyz`.
   - Access is granted **ONLY** via cryptographically verified server-to-server webhooks.

2. **Strict Webhook Idempotency**:
   - Check `processed_webhooks` table before processing any event.
   - If `eventId` exists, return `200 OK` immediately to prevent duplicate credits.

3. **Atomic Database Transactions**:
   - Wrap user tier update + order ledger insertion inside `db.transaction(...)`.

4. **Handle Full Subscription Lifecycle**:
   - `checkout.session.completed` → Upgrade user to Pro.
   - `invoice.payment_succeeded` → Extend subscription.
   - `invoice.payment_failed` → Mark past_due, notify user.
   - `customer.subscription.deleted` → Downgrade to Free tier.

---

## 🇰🇭 Local Cambodia: ABA PAYWAY (KHQR)
- Generate HMAC-SHA512 request hash with merchant secret.
- Display KHQR code for ABA Mobile scanning.
- Verify PayWay RSA push notification signature before updating order.

---

## 🧪 Verification Steps
1. Run local webhook test using Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`).
2. Replay duplicate event to verify zero duplicate database rows.
3. Verify test card decline triggers friendly user feedback.

**Exit Condition**: Test payment succeeds, webhook verifies signature, and idempotent ledger row is inserted.
