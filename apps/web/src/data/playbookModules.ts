export interface TechItem {
  name: string;
  role: string;
  icon: string;
}

export interface PlaybookTopic {
  id: string;
  number: string;
  category: string;
  title: string;
  summary: string;
  what: string;
  why: string;
  when: string;
  howConnect: string;
  techStack?: TechItem[];
  aiPrompt: {
    title: string;
    prompt: string;
    notes: string;
  };
  setupSteps: string[];
  commands: {
    cmd: string;
    desc: string;
    level: "read" | "write" | "hazardous";
  }[];
  verify: string;
  commonErrors: {
    error: string;
    fix: string;
  }[];
  mvpVersion: string;
  prodVersion: string;
  enterpriseVersion: string;
  edgeCases?: string[];
  decisionRule?: string;
}

export const PLAYBOOK_MODULES: PlaybookTopic[] = [
  {
    id: "fundamentals",
    number: "00",
    category: "FOUNDATIONS",
    title: "Internet & Networking Fundamentals",
    summary: "How computers find each other across the globe: IP, DNS, Ports, and TLS.",
    what: "The physical and logical rules enabling a client browser in Tokyo to fetch bytes from a Linux VPS in Frankfurt.",
    why: "Without this mental model, every deploy feels like magic and every 502 Bad Gateway feels like an emergency.",
    when: "From Day 1 before purchasing domains or configuring cloud servers.",
    howConnect: "User Browser ──► DNS Resolver (IP lookup) ──► Server IP (Port 80/443) ──► Nginx Reverse Proxy ──► Docker Container (:3000).",
    techStack: [
      { name: "Cloudflare", role: "DNS & Anycast Edge", icon: "cloudflare" },
      { name: "Nginx", role: "Reverse Proxy & TLS Termination", icon: "nginx" },
      { name: "Ubuntu Linux", role: "Host OS & Network Stack", icon: "linux" },
      { name: "Let's Encrypt", role: "Automated ACME Certificates", icon: "letsencrypt" }
    ],
    aiPrompt: {
      title: "Networking & DNS Architect Prompt",
      prompt: `You are an expert Systems and Network Architect.

Design the end-to-end network topology for my application:
Domain: [INSERT DOMAIN e.g. app.example.com]
Target Host: [INSERT VPS e.g. Ubuntu 24.04 on Hetzner/DigitalOcean]

Specify:
1. Exact DNS records required (A Record, CNAME, TTL, Anycast proxy settings)
2. Linux UFW firewall rules (which ports are public vs strictly internal)
3. Nginx virtual host configuration routing port 443 into local Docker port :3000
4. Automated SSL/TLS issuance via Certbot ACME challenge
5. Verification sequence (commands to test DNS, firewall, and TLS handshake)

STRICT RULE: Do not expose database ports (5432) or Redis (6379) to the public interface.`,
      notes: "Use this prompt when connecting a new domain to a server or debugging connectivity."
    },
    setupSteps: [
      "Purchase domain from Cloudflare Registrar, Namecheap, or Porkbun.",
      "Provision VPS with a static Public IPv4 address (e.g. Hetzner, DigitalOcean, Linode).",
      "Create DNS 'A Record' pointing '@' and 'www' directly to the server IPv4.",
      "Verify global propagation with DNS propagation checkers."
    ],
    commands: [
      { cmd: "dig +short yourdomain.com", desc: "Checks what IP address global DNS resolves your domain to.", level: "read" },
      { cmd: "nslookup yourdomain.com", desc: "Local OS DNS lookup verifying domain routing.", level: "read" },
      { cmd: "curl -Iv https://yourdomain.com", desc: "Inspects TLS cryptographic handshake and HTTP headers.", level: "read" }
    ],
    verify: "Running 'curl -I https://yourdomain.com' returns 'HTTP/2 200' with valid SSL certificate issuer details.",
    commonErrors: [
      { error: "NXDOMAIN or timeout", fix: "A Record is missing or DNS nameservers have not finished propagating (can take up to 24h, usually 5 mins on Cloudflare)." },
      { error: "SSL_ERROR_NO_CYPHER_OVERLAP", fix: "SSL certificate is missing or Certbot failed. Verify port 80 is unblocked for ACME challenge." }
    ],
    mvpVersion: "Single A Record pointing to VPS IP or automatic Vercel DNS CNAME.",
    prodVersion: "Cloudflare Anycast Proxy (DDoS absorption, Web Application Firewall, edge TLS 1.3).",
    enterpriseVersion: "Multi-Region GeoDNS routing traffic to the closest datacenter with automated failover.",
    edgeCases: [
      "What if user's corporate ISP blocks custom ports? Always use standard 80 (HTTP) and 443 (HTTPS) externally.",
      "What if DNS nameservers go down? Use Anycast enterprise providers with 100% uptime SLA (Cloudflare/Route 53)."
    ],
    decisionRule: "Never expose non-standard ports (like :3000 or :5432) to the public internet. Terminate on 443 and proxy internally."
  },
  {
    id: "product-discovery",
    number: "01",
    category: "PRODUCT & PROMPTING",
    title: "Product Discovery, Prompts & The Kill List",
    summary: "Define target user, core loop, strict non-goals, and staged AI prompts.",
    what: "The boundary definition framework preventing scope creep and premature microservices.",
    why: "90% of solo dev projects fail because MVP requirements get mixed with enterprise complexity from Day 1.",
    when: "Before writing a single line of schema or frontend code.",
    howConnect: "Product Brief ──► Stage 1 AI Prompt ──► Scope Kill List ──► Technical Architect Prompt ──► 1 Core Vertical Slice.",
    techStack: [
      { name: "Markdown", role: "Executable PRD & Architecture Specs", icon: "markdown" },
      { name: "Claude / GPT", role: "Prompting Matrix & Concept Engine", icon: "terminal" },
      { name: "Git", role: "Version Control & Spec Discipline", icon: "github" }
    ],
    aiPrompt: {
      title: "Stage 1 Product Architect Brief Prompt",
      prompt: `Analyze this raw product idea: [INSERT PRODUCT IDEA HERE]

Define:
1. Target Customer Profile (who feels this daily operational pain?)
2. Core Problem & Unfair Alternative (how do they solve it right now with manual spreadsheets?)
3. Single Primary Journey (1 unbroken happy path from sign-in to core value)
4. MVP Scope & The Kill List (5 specific features strictly EXCLUDED from V1)
5. Validation Metric (the single verifiable metric proving commercial intent)

STRICT RULE: Do NOT generate code, schemas, or tech stack recommendations. Output the strategic functional brief only.`,
      notes: "Run this prompt before touching any code. It eliminates 80% of unnecessary feature bloat."
    },
    setupSteps: [
      "Write 1-sentence customer problem statement: WHO has this pain, HOW they solve it today, and WHY they pay.",
      "Draft the Kill List: List 5 features strictly forbidden in Version 1.",
      "Prompt the AI using Stage 1 Product Architect (no code generation allowed).",
      "Lock down the single primary user journey."
    ],
    commands: [
      { cmd: "pnpm web:dev", desc: "Launch development workstation on http://localhost:3005.", level: "read" }
    ],
    verify: "The product brief fits on 1 page and clearly answers: 'What is the ONE button the user presses to get value?'",
    commonErrors: [
      { error: "Prompting AI: 'Build me an entire SaaS app'", fix: "Constrain AI into 4 sequential stages (Product Architect -> Tech Architect -> Slice Builder -> Bug Fix)." },
      { error: "Building mobile app simultaneously", fix: "Cut native mobile from V1. Build high-polish responsive web first." }
    ],
    mvpVersion: "1 Core Vertical Slice: 1 form, 1 mutation, 1 payment button, zero secondary fluff.",
    prodVersion: "Telemetry-driven feature expansion based on PostHog funnel drop-off analytics.",
    enterpriseVersion: "Custom procurement review, SLA contracts, SOC2 compliance, audit log exports.",
    decisionRule: "If a feature is on the Kill List, reject it unconditionally until V1 has generated first revenue."
  },
  {
    id: "prd-user-flows",
    number: "02",
    category: "PRODUCT & PROMPTING",
    title: "PRD & 7 Mandatory UI States",
    summary: "Complete user journeys: Happy path, loading, error, empty, forbidden, and mobile.",
    what: "Systematic UI/UX state coverage ensuring production applications never crash on edge conditions.",
    why: "Amateur developers only design the happy path. Real apps fail when data is loading, empty, or forbidden.",
    when: "Designed before component implementation.",
    howConnect: "User Action ──► UI Loading Skeleton ──► Server Mutation ──► Success Toast / Error Feedback ──► Table Refetch.",
    techStack: [
      { name: "TypeScript", role: "Strict Domain Type Definitions", icon: "typescript" },
      { name: "Tailwind CSS", role: "7-State UI Layout System", icon: "tailwind" },
      { name: "Next.js", role: "SSR & Suspense Loading Boundaries", icon: "nextjs" },
      { name: "Zod", role: "Runtime Schema & Input Validation", icon: "zod" }
    ],
    aiPrompt: {
      title: "Frontend 7-State Component Prompt",
      prompt: `Implement the UI view for: [INSERT FEATURE NAME e.g. Customer Invoices List]

Requirements:
1. Tech Stack: Next.js 14 App Router, Tailwind CSS, Lucide icons.
2. Must implement all 7 mandatory UI states:
   - Initial Loading Skeleton (matching exact row dimensions)
   - Populated Success State (dense data table / list with tabular numbers)
   - Empty State (informative text + direct action button to create first item)
   - Server-side Error Banner (clear error code + retry button)
   - Client-side Form Validation Feedback (inline Zod field errors)
   - Mobile Viewport Reflow (clean card reflow on 375px screens)
   - Unauthorized / Forbidden Guard (session check with redirect to sign-in)

STRICT RULE: Do not use arbitrary custom padding. Use standard Tailwind 4px spacing scale.`,
      notes: "Guarantees zero blank screen errors when database is empty or network times out."
    },
    setupSteps: [
      "Map user journey: Landing -> Auth -> Onboarding -> Core Dashboard -> Action -> Value.",
      "For every view component, create test fixtures for all 7 UI states.",
      "Implement empty state illustration with direct call-to-action button.",
      "Verify mobile viewport layout on 375px width (iPhone standard)."
    ],
    commands: [
      { cmd: "pnpm test", desc: "Executes component integration and edge case validation tests.", level: "read" }
    ],
    verify: "All views render gracefully when database tables contain 0 rows (Empty state) or network is offline (Error state).",
    commonErrors: [
      { error: "White screen of death on initial load", fix: "Missing Suspense boundary or null check on nested API response object." },
      { error: "Unstyled error text breaking layout", fix: "Wrap all mutations in deterministic error banner components with retry buttons." }
    ],
    mvpVersion: "Single page dashboard with inline loading spinners and error alerts.",
    prodVersion: "Skeleton loaders with shimmer effects, optimistic UI updates, and undo toasts.",
    enterpriseVersion: "Contextual role-based view masking, custom 403 authorization drawers, and enterprise empty states."
  },
  {
    id: "architecture-tiers",
    number: "03",
    category: "ARCHITECTURE & TOPOLOGY",
    title: "Architecture Tiers: MVP to Enterprise",
    summary: "Level 1 Monolith vs Level 2 Decoupled Queue vs Level 3 Multi-AZ Cluster.",
    what: "The structural evolution of your backend topology as request volume and reliability requirements increase.",
    why: "Starting with enterprise architecture bankrupts solo founders; sticking to Level 1 at 100k users crashes servers.",
    when: "Choose Level 1 on Day 1. Upgrade only when telemetry proves sustained bottlenecks.",
    howConnect: "L1: Client ──► Next.js Monolith ──► Postgres.\nL2: Client ──► Nginx ──► API Cluster + BullMQ Worker ──► Postgres + Redis.\nL3: Client ──► Cloudflare ──► ALB ──► Multi-AZ ECS ──► Aurora Primary + Read Replicas.",
    techStack: [
      { name: "Next.js 14", role: "Fullstack App Router Monolith", icon: "nextjs" },
      { name: "PostgreSQL", role: "Primary Relational Storage", icon: "postgres" },
      { name: "Redis", role: "In-Memory Caching & Session Store", icon: "redis" },
      { name: "Docker", role: "Isolated Production Containers", icon: "docker" }
    ],
    aiPrompt: {
      title: "System Architecture Blueprint Prompt",
      prompt: `Act as a Principal Full-Stack Architect.

Evaluate my product requirements and propose the Tier Architecture:
Product: [INSERT PRODUCT TYPE e.g. B2B Booking Platform]
Expected Initial Throughput: [e.g. 500 daily bookings]

Specify:
1. Tier Selection: Justify Level 1 (Monolith) vs Level 2 (Queued) vs Level 3 (Enterprise)
2. Process boundaries: Web process, background job runner, caching layer
3. Data storage: Primary relational DB, in-memory cache, file object storage
4. Communication protocols: Server Actions, REST, Webhooks
5. Failure modes: What happens when the database connection pool is full?

STRICT RULE: Do NOT design microservices unless required by independent team velocity.`,
      notes: "Enforces lean monolith-first architecture and blocks premature cloud complexity."
    },
    setupSteps: [
      "Level 1: Deploy Next.js + PostgreSQL on single VPS with Docker Compose.",
      "Level 2: Add Redis container and BullMQ worker process for asynchronous emails/webhooks.",
      "Level 3: Migrate to managed AWS Aurora with read replica and Application Load Balancer."
    ],
    commands: [
      { cmd: "docker compose up -d --build", desc: "Launches the monolithic or multi-container architecture stack.", level: "write" },
      { cmd: "docker ps", desc: "Verifies health and port mapping of all architecture components.", level: "read" }
    ],
    verify: "Server responds to health check ping with <50ms latency under local load tests.",
    commonErrors: [
      { error: "Introducing microservices too early", fix: "Keep all modules in one repo (modular monolith). Break out services only when teams require independent deployment." },
      { error: "Connecting frontend directly to database without API layer", fix: "Always pass mutations through validated server actions or REST controllers." }
    ],
    mvpVersion: "Next.js monolith + Supabase or single-container PostgreSQL ($5–$15/mo).",
    prodVersion: "Dockerized API server + Redis cache + BullMQ worker + PostgreSQL ($50–$150/mo).",
    enterpriseVersion: "Multi-AZ Load Balancers + Read/Write DB split + Auto-scaling container fleet ($1,000+/mo)."
  },
  {
    id: "database-discipline",
    number: "04",
    category: "DATABASE & DATA INTEGRITY",
    title: "Database Discipline & JIT Schemas",
    summary: "PostgreSQL, Prisma/Drizzle, indexing rules, soft deletes, and migrations.",
    what: "Relational schema engineering that guarantees transactional integrity (ACID) and sub-10ms query performance.",
    why: "Database mistakes are the hardest to undo in production. Bad indexes crash CPUs; unvalidated foreign keys corrupt data.",
    when: "Schema designed Just-In-Time (JIT) for the active vertical slice.",
    howConnect: "Next.js Mutation ──► Prisma/Drizzle Client ──► Connection Pool (PgBouncer) ──► PostgreSQL Engine ──► Host Disk Volume.",
    techStack: [
      { name: "PostgreSQL 16", role: "ACID Relational Database Engine", icon: "postgres" },
      { name: "Prisma ORM", role: "Schema Migrations & Type Safety", icon: "prisma" },
      { name: "Supabase", role: "Managed Cloud Postgres & Storage", icon: "supabase" },
      { name: "Docker", role: "Local Isolated DB Container", icon: "docker" }
    ],
    aiPrompt: {
      title: "Database Schema & Migration Architect Prompt",
      prompt: `You are an expert PostgreSQL Database Administrator and ORM Specialist.

Design the minimal database schema for: [INSERT FEATURE e.g. User Subscriptions & Projects]
ORM: Prisma OR Drizzle (PostgreSQL dialect)

Requirements:
1. Entities: Keep total tables under 6. Include only required columns.
2. Integrity: Foreign keys with ON DELETE CASCADE or RESTRICT.
3. Indexes: Add indexes on all foreign keys and columns used in WHERE or ORDER BY filters.
4. Soft Deletes: Define deletedAt timestamp where legal retention applies.
5. Migration plan: Generate the exact SQL migration script.

STRICT RULE: Do NOT create speculative audit tables or premature multi-tenant sharding.`,
      notes: "Ensures clean schema migrations with zero dangling foreign keys."
    },
    setupSteps: [
      "Define entities with strict constraints (NOT NULL, UNIQUE, FOREIGN KEY ON DELETE CASCADE/RESTRICT).",
      "Add indexes on foreign keys and fields queried in WHERE/ORDER BY clauses.",
      "Apply migrations locally: 'npx prisma migrate dev'.",
      "Seed database with representative mock data to verify query plans."
    ],
    commands: [
      { cmd: "npx prisma migrate dev --name init", desc: "Generates and executes SQL migration against local database.", level: "write" },
      { cmd: "npx prisma studio", desc: "Opens interactive visual database browser on http://localhost:5555.", level: "read" },
      { cmd: "docker exec -it postgres_container psql -U postgres -c 'SELECT * FROM pg_stat_activity;'", desc: "Inspects active PostgreSQL query connections and locks.", level: "read" }
    ],
    verify: "Running 'EXPLAIN ANALYZE SELECT ...' shows Index Scan instead of Seq Scan (Sequential Scan).",
    commonErrors: [
      { error: "Creating 25 speculative tables in V1", fix: "Build JIT: Only create tables needed for the 1 active feature slice." },
      { error: "Connection exhaustion ('too many clients')", fix: "Deploy PgBouncer connection pooler or enable serverless connection limits." }
    ],
    mvpVersion: "Single PostgreSQL database with <6 core tables and automated nightly pg_dump.",
    prodVersion: "Connection pooling (PgBouncer) + Redis query cache + automated S3 dump backups.",
    enterpriseVersion: "Aurora Multi-AZ with read replicas, Point-In-Time-Recovery (PITR), and Row-Level Security (RLS)."
  },
  {
    id: "networking-cloud",
    number: "05",
    category: "NETWORKING & CLOUD",
    title: "Networking, Ports & Nginx Reverse Proxy",
    summary: "The packet highway: Domain, DNS, UFW Firewall, Port binding, and SSL.",
    what: "The routing pipeline that safely transports HTTP requests from the open internet into isolated Docker containers.",
    why: "Node.js and Next.js are not hardened web servers. Nginx shields them from slowloris attacks and terminates TLS.",
    when: "Configured during server provisioning before pointing production domains.",
    howConnect: "Internet ──► Port 80/443 ──► Linux UFW ──► Nginx Proxy ──► Docker Bridge (172.18.0.0/16) ──► Node.js :3000.",
    techStack: [
      { name: "Nginx", role: "Virtual Host & Header Forwarding", icon: "nginx" },
      { name: "Cloudflare", role: "DDoS Mitigation & Edge CDN", icon: "cloudflare" },
      { name: "Linux UFW", role: "Kernel Packet Filter / Firewall", icon: "linux" },
      { name: "Let's Encrypt", role: "TLS 1.3 Automatic Renewal", icon: "letsencrypt" }
    ],
    aiPrompt: {
      title: "Nginx Reverse Proxy & SSL Script Prompt",
      prompt: `Write a production-ready Nginx configuration and deployment script for:
Domain: [INSERT DOMAIN e.g. api.example.com]
Downstream App: Docker container listening on 127.0.0.1:3000

Requirements:
1. Redirect all HTTP (port 80) traffic to HTTPS (port 443).
2. Configure SSL ciphers using TLS 1.3 standards.
3. Proxy headers: X-Forwarded-For, X-Forwarded-Proto, Host, Upgrade, Connection.
4. Client body limits and Gzip compression settings.
5. Certbot non-interactive command to obtain and renew Let's Encrypt certificate.

Output the complete /etc/nginx/sites-available/app.conf file.`,
      notes: "Copies directly into your server configuration."
    },
    setupSteps: [
      "Configure Linux firewall (UFW): allow port 22 (SSH), port 80 (HTTP), port 443 (HTTPS).",
      "Install Nginx reverse proxy: 'sudo apt install nginx -y'.",
      "Configure Nginx virtual host with proxy_pass to http://127.0.0.1:3000.",
      "Run Certbot for free automatic Let's Encrypt SSL certificates."
    ],
    commands: [
      { cmd: "sudo ufw status verbose", desc: "Checks firewall status and open inbound ports.", level: "read" },
      { cmd: "sudo ufw allow 80/tcp && sudo ufw allow 443/tcp", desc: "Opens public HTTP and HTTPS ingress.", level: "write" },
      { cmd: "sudo nginx -t && sudo systemctl reload nginx", desc: "Validates Nginx config syntax and reloads daemon without downtime.", level: "write" },
      { cmd: "ss -tuln | grep -E ':(80|443|3000|5432)'", desc: "Audits listening network sockets on host interface.", level: "read" }
    ],
    verify: "Visiting 'https://yourdomain.com' loads your containerized application with a valid padlock icon in the browser URL bar.",
    commonErrors: [
      { error: "502 Bad Gateway", fix: "Nginx is running, but the downstream app container on :3000 is stopped or crashed. Check 'docker ps' and 'docker logs'." },
      { error: "Connection Refused", fix: "Firewall is blocking port 80/443 or Nginx service is stopped. Check 'sudo systemctl status nginx'." }
    ],
    mvpVersion: "Single Ubuntu VPS + Docker Compose + Host Nginx with Certbot.",
    prodVersion: "Cloudflare Anycast Proxy + Host Nginx + Private Docker Networks.",
    enterpriseVersion: "AWS Application Load Balancer (ALB) across multiple availability zones + AWS WAF rules."
  },
  {
    id: "linux-docker-devops",
    number: "06",
    category: "DEVOPS & SERVERS",
    title: "Linux & Docker Command Center",
    summary: "Host administration, container lifecycle, logs, and blast-radius safety badges.",
    what: "The operational commands used daily to deploy, inspect, restart, and maintain production Linux servers.",
    why: "Developers fear servers because running the wrong command (like rm -rf) can wipe disks. Categorizing commands by danger removes fear.",
    when: "Used during all deployment, maintenance, and triage sessions.",
    howConnect: "Developer Terminal ──► SSH Key (Port 22) ──► Ubuntu Host ──► Docker CLI ──► Container Runtimes.",
    techStack: [
      { name: "Docker", role: "Multi-Stage Container Runtime", icon: "docker" },
      { name: "Ubuntu Linux", role: "Production Host OS & Systemd", icon: "linux" },
      { name: "Bash", role: "Shell Scripting & Server Automation", icon: "bash" },
      { name: "GitHub Actions", role: "Automated Build & CI/CD", icon: "github" }
    ],
    aiPrompt: {
      title: "Production Dockerfile & Compose Prompt",
      prompt: `Generate a production-grade multi-stage Dockerfile and docker-compose.yml for:
App: Next.js 14 / NestJS full-stack app
Database: PostgreSQL 16
Cache: Redis Alpine

Requirements:
1. Multi-stage build (deps, builder, runner) using node:20-alpine to minimize image size (<150MB).
2. Non-root user: Run the process as non-root user (nextjs:nodejs) for security.
3. Named volumes: Mount PostgreSQL data to persistent named volume (postgres_data).
4. Healthchecks: Add healthcheck probes to verify database ready state before app starts.
5. Restart policies: unless-stopped.

Output Dockerfile and docker-compose.yml.`,
      notes: "Produces minimal, secure Docker containers that boot in seconds."
    },
    setupSteps: [
      "Configure SSH key-based authentication; disable password login in /etc/ssh/sshd_config.",
      "Install Docker Engine and Docker Compose V2 via official Docker apt repository.",
      "Create non-root administrative user with sudo privileges.",
      "Create /var/www/app directory with correct ownership (chown -R)."
    ],
    commands: [
      { cmd: "docker ps -a", desc: "Lists all running and terminated containers with uptime.", level: "read" },
      { cmd: "docker logs -f --tail 100 <container>", desc: "Streams live output logs from specified container.", level: "read" },
      { cmd: "docker compose up -d --build", desc: "Rebuilds images and starts container stack in background.", level: "write" },
      { cmd: "docker system prune -a --volumes", desc: "HAZARD: Deletes all stopped containers and unnamed storage volumes.", level: "hazardous" }
    ],
    verify: "'docker ps' lists all required containers (app, postgres, nginx) with status 'Up (healthy)'.",
    commonErrors: [
      { error: "Docker daemon not running ('Cannot connect to Docker daemon')", fix: "Run 'sudo systemctl start docker && sudo systemctl enable docker'." },
      { error: "No space left on device", fix: "Clean dangling images with 'docker image prune'. Check disk usage with 'df -h'." }
    ],
    mvpVersion: "Single docker-compose.yml running app + postgres with named volume mounts.",
    prodVersion: "Multi-stage Dockerfiles with non-root Alpine users and automated GitHub Actions deploy keys.",
    enterpriseVersion: "Infrastructure as Code (Terraform) + AWS ECS Fargate or Kubernetes cluster."
  },
  {
    id: "troubleshooting-triage",
    number: "07",
    category: "TRIAGE & INCIDENT RESPONSE",
    title: "Systematic Troubleshooting & Fault Tree",
    summary: "6-step diagnostic ladder: DNS -> Ping -> Ports -> Nginx -> Container -> Database.",
    what: "Deterministic incident triage protocol replacing frantic, random debugging with structured isolation.",
    why: "When an app goes down under customer pressure, panic leads to breaking working layers. A ladder isolates the exact fault in 2 minutes.",
    when: "Any time the application is unreachable, returning 500/502 errors, or failing health checks.",
    howConnect: "Test 1: DNS ──► Test 2: Host Ping ──► Test 3: Firewall/Ports ──► Test 4: Nginx ──► Test 5: Docker Container ──► Test 6: DB Socket.",
    techStack: [
      { name: "Systemd", role: "Linux Service & Daemon Supervisor", icon: "systemd" },
      { name: "Docker CLI", role: "Container Log Stream & Health", icon: "docker" },
      { name: "Linux Bash", role: "Kernel Diagnostics & Sockets", icon: "bash" },
      { name: "cURL", role: "HTTP Handshake & Port Prober", icon: "terminal" }
    ],
    aiPrompt: {
      title: "Surgical Incident Debugging Prompt",
      prompt: `Analyze this production failure stack trace: [PASTE TERMINAL / LOG ERROR]

Execute the Surgical Bug Isolation Protocol:
1. Root Cause: State WHY the failure occurred in 2 unambiguous sentences.
2. Layer Isolation: Identify whether the fault is DNS, OS Firewall, Nginx, Docker, Node Runtime, or DB Connection.
3. Minimal Safe Patch: Output the minimal code or configuration fix (<20 lines changed).
4. Verification Command: Provide the exact curl or test command to confirm the fix works.

STRICT RULE: Do not propose mass refactoring or changing unrelated libraries.`,
      notes: "Use this prompt during outages to get minimal, safe fixes without breaking working code."
    },
    setupSteps: [
      "Save the 6 diagnostic commands in your terminal shell profile.",
      "Configure external uptime monitoring (e.g. BetterStack, UptimeRobot) with webhook alerts.",
      "Ensure container logs retain timestamps for incident correlation."
    ],
    commands: [
      { cmd: "nslookup yourdomain.com", desc: "Step 1: Confirms DNS translates domain to valid IP.", level: "read" },
      { cmd: "ping -c 3 SERVER_IP", desc: "Step 2: Confirms host server is powered on and reachable.", level: "read" },
      { cmd: "sudo ufw status verbose", desc: "Step 3: Confirms ports 80 and 443 are allowed.", level: "read" },
      { cmd: "sudo nginx -t && sudo systemctl status nginx", desc: "Step 4: Confirms Nginx configuration and process health.", level: "read" },
      { cmd: "curl -I http://localhost:3000", desc: "Step 5: Confirms local application container responds.", level: "read" },
      { cmd: "docker exec -it app nc -zv postgres 5432", desc: "Step 6: Confirms backend can reach database socket.", level: "read" }
    ],
    verify: "All 6 diagnostic steps return positive assertions; HTTP health endpoint returns 200 OK.",
    commonErrors: [
      { error: "Restarting server before reading logs", fix: "Never reboot blindly. Inspect 'journalctl' and 'docker logs' first to capture the crash stack trace." }
    ],
    mvpVersion: "Manual execution of the 6-step diagnostic ladder via SSH.",
    prodVersion: "Automated health check endpoints with Sentry exception tracking and Slack alerts.",
    enterpriseVersion: "Full APM distributed tracing (Datadog/OpenTelemetry) with automated canary rollback."
  },
  {
    id: "payments-webhooks",
    number: "08",
    category: "BILLING & INTEGRATIONS",
    title: "Payments, Webhooks & Idempotency",
    summary: "Stripe, Lemon Squeezy, ABA PAYWAY (KHQR), cryptographic HMAC, and ledgers.",
    what: "The financial transaction engine handling checkout sessions, signature verification, and subscription state.",
    why: "Webhooks fail, retry, and arrive out of order. If you don't enforce idempotency, customers get double-charged or get free access.",
    when: "Integrated as soon as the core value loop is built.",
    howConnect: "Client Checkout ──► Payment Provider (Stripe/ABA) ──► Webhook POST ──► Raw Body HMAC Verification ──► Idempotency Table Check ──► DB Transaction.",
    techStack: [
      { name: "Stripe", role: "Checkout & Cryptographic Webhooks", icon: "stripe" },
      { name: "PostgreSQL", role: "Idempotent Transaction Ledger", icon: "postgres" },
      { name: "TypeScript", role: "Strict Webhook Event Payloads", icon: "typescript" },
      { name: "ABA PAYWAY", role: "Cambodia KHQR Banking Rails", icon: "bash" }
    ],
    aiPrompt: {
      title: "Idempotent Webhook Handler Prompt",
      prompt: `Implement an idempotent webhook handler in Next.js / NestJS for:
Provider: [Stripe OR ABA PAYWAY KHQR OR Lemon Squeezy]

Requirements:
1. Raw Body: Capture unparsed raw request buffer for cryptographic HMAC signature verification.
2. Idempotency Table: Check 'WebhookEvents' table for event.id before executing business logic.
3. Atomic Transaction: Wrap customer subscription status update and webhook event recording in a single database transaction.
4. Error Handling: Return HTTP 200 immediately if event already processed; return HTTP 400 on signature failure.
5. Replay Defense: Reject timestamps older than 5 minutes.

Output the complete route handler.`,
      notes: "Prevents duplicate charges, lost orders, and unauthenticated webhook spoofing."
    },
    setupSteps: [
      "Configure payment provider dashboard with webhook endpoint URL.",
      "Store STRIPE_WEBHOOK_SECRET or ABA_PAYWAY_KEY securely in environment variables.",
      "Preserve raw unparsed request buffer for cryptographic HMAC signature validation.",
      "Create WebhookEvents table to record event.id before executing business logic."
    ],
    commands: [
      { cmd: "stripe listen --forward-to localhost:3000/api/webhooks/stripe", desc: "Streams Stripe test webhooks directly to your local development server.", level: "read" },
      { cmd: "stripe trigger payment_intent.succeeded", desc: "Emulates successful payment webhook event for testing.", level: "read" }
    ],
    verify: "Simulating duplicate webhook payloads results in single database transaction execution (idempotent rejection on retry).",
    commonErrors: [
      { error: "Webhook signature verification failed", fix: "Body parser middleware parsed JSON before HMAC signature calculation. Webhook routes must consume raw request stream." },
      { error: "Granting access based on client-side redirect URL", fix: "Never unlock features on client redirect. Only unlock access when server receives verified webhook." }
    ],
    mvpVersion: "Stripe Checkout / Lemon Squeezy hosted page + single webhook receiver table.",
    prodVersion: "Idempotent event ledger + automated email receipts + customer billing portal.",
    enterpriseVersion: "Multi-currency invoicing, tax compliance (Stripe Tax), custom purchase orders, and annual invoicing."
  },
  {
    id: "scaling-debt",
    number: "09",
    category: "SCALE & ECONOMICS",
    title: "Scaling Ladder, Tech Debt & Cost Realities",
    summary: "Levels 1 to 8, problem-first optimization, technical debt tracker, and unit economics.",
    what: "The disciplined roadmap for scaling infrastructure based on empirical bottlenecks rather than speculative hype.",
    why: "Premature scaling burns founder capital and adds friction. Scaling only when telemetry demands it preserves runway.",
    when: "Evaluated periodically when request latency exceeds 100ms or CPU exceeds 75%.",
    howConnect: "Bottleneck Detected ──► Measure with Profiler ──► Apply Minimal Fix ──► Measure Again ──► Record in Debt Tracker.",
    techStack: [
      { name: "Redis", role: "Fast In-Memory Cache & Key Expiry", icon: "redis" },
      { name: "BullMQ", role: "Persistent Background Job Queue", icon: "bullmq" },
      { name: "Vitest", role: "Sub-Second Unit & Integration Tests", icon: "vitest" },
      { name: "Playwright", role: "End-to-End Browser Smoke Tests", icon: "playwright" }
    ],
    aiPrompt: {
      title: "Query Profiling & Bottleneck Optimization Prompt",
      prompt: `Analyze this PostgreSQL slow query log / EXPLAIN ANALYZE output:
[PASTE QUERY AND EXECUTION PLAN]

Provide:
1. Bottleneck Root Cause: Identify why the query is slow (Sequential Scan, missing composite index, N+1 query).
2. Minimal SQL Fix: Output the exact 'CREATE INDEX CONCURRENTLY' command.
3. Caching Decision: Does this query require Redis in-memory caching, or does the SQL index resolve the p95 latency (<20ms)?
4. Cost Impact: Calculate memory footprint of the new index.

STRICT RULE: Do not suggest rewriting in NoSQL or splitting database tables.`,
      notes: "Applies the scaling ladder: Fix indexes before adding Redis or replicas."
    },
    setupSteps: [
      "Track monthly infrastructure expenses: VPS hosting, database, email, storage, and domain.",
      "Calculate unit economics: Cost per active user, cost per 1,000 API requests.",
      "Maintain 3-tier technical debt log: acceptable MVP shortcut, refactor in V2, dangerous hazard.",
      "Review slow query telemetry weekly."
    ],
    commands: [
      { cmd: "top", desc: "Monitors real-time CPU, RAM, and process consumption on Linux host.", level: "read" },
      { cmd: "df -h", desc: "Inspects storage disk space utilization across partitions.", level: "read" },
      { cmd: "free -m", desc: "Audits available vs allocated system memory in megabytes.", level: "read" }
    ],
    verify: "Monthly infrastructure expenses represent <10% of monthly recurring software revenue.",
    commonErrors: [
      { error: "Migrating to Kubernetes with 50 users", fix: "Stay on single VPS until multi-node load balancing is strictly required by throughput." },
      { error: "Forgetting database backup testing", fix: "Automate test restores from backups quarterly to verify dump integrity." }
    ],
    mvpVersion: "Single server monolith costing $5–$15/month supporting up to 1,000 daily users.",
    prodVersion: "Decoupled workers and caching costing $50–$150/month supporting up to 50,000 users.",
    enterpriseVersion: "High-availability multi-region cluster costing $1,000+/month with 99.99% SLA."
  }
];
