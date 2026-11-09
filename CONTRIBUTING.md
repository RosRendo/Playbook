# 🤝 Contributing to Product Shipping OS

Thank you for your interest in contributing to **Product Shipping OS**! 

Our mission is to help developers worldwide stop getting trapped in endless backend customizations and actually **ship software products to real users**.

---

## 🧭 Core Contribution Principles

Before submitting a Pull Request, please ensure your contribution adheres to our core philosophy:

1. **Pragmatic Simplicity Over Academic Purity**:
   - We prefer boring, managed technologies that ship fast over complex distributed setups.
   - Do not propose microservices, Kubernetes, or multi-cloud abstractions for Level 1 MVP.
2. **Vertical Slices, Never Horizontal Layers**:
   - Any feature guide or template must connect UI + Validation + API + DB + Tests in one cohesive path.
3. **Evidence-Based Scaling**:
   - Solutions must solve real, measured bottlenecks, not hypothetical scale problems.
4. **Idempotency & Security First**:
   - Any payment or webhook integration must implement signature verification and idempotency deduplication.

---

## 🛠️ How to Add a New Provider (Payments, Auth, Storage)

We welcome community adapters and documentation for local payment gateways and backend services around the world (e.g., Midtrans for Indonesia, Xendit for SE Asia, Paystack for Africa, Mercado Pago for Latin America).

To add a provider:
1. Update `05_PAYMENTS_AND_BILLING.md` with the provider's legal model (Gateway vs. Merchant of Record), supported countries, and currency rules.
2. Provide a verified webhook verification code snippet with cryptographic signature checks.
3. Provide an idempotency handling pattern using the `processed_webhooks` table.
4. Update the `ship-pay` skill in `.agents/skills/ship-pay/SKILL.md`.

---

## 🪄 How to Propose a New Skill

Each skill in `.agents/skills/` must:
1. Have valid YAML frontmatter (`name`, `description`).
2. Clearly define:
   - What user trigger commands it responds to (e.g., `/ship-xxx`).
   - What files it reads.
   - What files it writes.
   - Strict **Exit Conditions** (how the AI knows when the task is done).

---

## 🔄 Pull Request Workflow

1. **Fork the Repository** and create your branch from `main`:
   ```bash
   git checkout -b feature/add-midtrans-payment
   ```
2. **Make your changes** following our markdown guidelines and code formatting standards.
3. **Commit with a descriptive message**:
   ```bash
   git commit -m "feat(payments): add Midtrans QRIS webhook integration guide"
   ```
4. **Push to your fork** and submit a Pull Request.

---

## 📜 Code of Conduct

Be kind, constructive, and pragmatic. We are a community of builders focused on helping each other ship!
