export interface TechCommand {
  cmd: string;
  desc: string;
  level: "read" | "write" | "hazardous";
}

export interface TechStackDetail {
  id: string;
  name: string;
  tagline: string;
  category: "Framework" | "Database" | "Cache & Queue" | "Infra & DevOps" | "Security & Edge" | "Payments" | "Testing";
  tier: "mvp" | "prod" | "enterprise";
  concept: string;
  whyChosen: string;
  alternativesCompared: string;
  stepByStep: string[];
  commands: TechCommand[];
  quickSetup: {
    language: string;
    code: string;
    description: string;
  };
  productionRules: string[];
  pitfalls: string[];
  whenToReplace: string;
}

export const TECH_STACK_DETAILS: Record<string, TechStackDetail> = {
  nextjs: {
    id: "nextjs",
    name: "Next.js 14 (App Router)",
    tagline: "React Fullstack Monolith & Hybrid SSR Engine",
    category: "Framework",
    tier: "mvp",
    concept: "Unified client and server runtime. Server Components render initial HTML on the host Node.js process with direct database access, streaming React payload over HTTP without exposing API keys to the browser. Server Actions handle RPC mutations securely with automatic cache revalidation.",
    whyChosen: "Single deployment artifact for client and server. Eliminates cross-origin CORS debugging, frontend-backend version desyncs, and duplicate domain management.",
    alternativesCompared: "Over separate React SPA + Express API: Avoids 2 hosting bills, 2 CI pipelines, and manual cookie synchronization.",
    stepByStep: [
      "Initialize project: 'pnpm create next-app@14 my-app --typescript --tailwind --app'.",
      "Configure src/app directory with layout.tsx, page.tsx, and loading.tsx Suspense boundaries.",
      "Create server action mutations in separate 'actions.ts' files marked with 'use server'.",
      "Validate all mutation inputs with Zod schemas before triggering database queries.",
      "Build and verify production output: 'pnpm build && pnpm start'."
    ],
    commands: [
      { cmd: "pnpm dev", desc: "Launches local Turbopack/Webpack development server on port :3000.", level: "read" },
      { cmd: "pnpm build", desc: "Compiles TypeScript, optimizes bundles, and pre-renders static routes.", level: "write" },
      { cmd: "pnpm start", desc: "Runs optimized Node.js production server process on port :3000.", level: "read" }
    ],
    quickSetup: {
      language: "bash",
      code: "pnpm create next-app@14 my-app --typescript --tailwind --app --no-src-dir",
      description: "Initializes App Router scaffold with TypeScript and standard Tailwind spacing scale."
    },
    productionRules: [
      "Keep Server Actions strictly in separate actions.ts files with 'use server' directives.",
      "Validate all action inputs with Zod schemas before querying the database.",
      "Never fetch data inside client components when Suspense streaming on the server is possible."
    ],
    pitfalls: [
      "Client bundle bloat from accidentally importing Node.js native libraries (fs, crypto) in 'use client' files.",
      "Waterfall fetches caused by chaining sequential awaits in nested server components without Promise.all()."
    ],
    whenToReplace: "Keep through MVP and Production. Only extract independent backend microservices if frontend and backend teams exceed 15 engineers with conflicting release cadences."
  },
  postgres: {
    id: "postgres",
    name: "PostgreSQL 16",
    tagline: "ACID Relational Storage Engine with JSONB & Full-Text Search",
    category: "Database",
    tier: "mvp",
    concept: "Rock-solid relational database engine enforcing ACID transactional guarantees (Atomicity, Consistency, Isolation, Durability). Tables maintain strict foreign keys with cascading deletions, while JSONB columns offer flexible schemaless attribute storage without abandoning relational integrity.",
    whyChosen: "The industry standard relational database. Robust transactions, foreign keys, JSONB for schemaless flexibility, and bulletproof reliability under concurrent writes.",
    alternativesCompared: "Over MongoDB: Prevents data corruption and orphan records with relational foreign key cascades. Replaces MongoDB document queries with PostgreSQL native JSONB.",
    stepByStep: [
      "Provision PostgreSQL instance via Docker Compose (or managed Supabase / Neon).",
      "Define entities with strict constraints (NOT NULL, UNIQUE, FOREIGN KEY with ON DELETE CASCADE).",
      "Add B-tree indexes on foreign keys (userId, orgId) and filtered columns.",
      "Configure connection pool limits and statement timeouts (statement_timeout = '10s').",
      "Schedule automated nightly database dumps: 'pg_dump -Fc' to offsite storage."
    ],
    commands: [
      { cmd: "docker exec -it postgres_container psql -U postgres -d app_db", desc: "Opens interactive PostgreSQL CLI terminal.", level: "read" },
      { cmd: "docker exec -it postgres_container psql -U postgres -c 'SELECT pid, query, state, age(clock_timestamp(), query_start) FROM pg_stat_activity WHERE state != \\'idle\\';'", desc: "Audits currently running queries and connection locks.", level: "read" },
      { cmd: "pg_dump -U postgres -h localhost -d app_db -F c -b -v -f backup.dump", desc: "Creates compressed transactional binary backup of entire database.", level: "read" },
      { cmd: "dropdb -U postgres app_db", desc: "HAZARDOUS: Irrevocably destroys specified database and all tables.", level: "hazardous" }
    ],
    quickSetup: {
      language: "yaml",
      code: `postgres:
  image: postgres:16-alpine
  restart: unless-stopped
  environment:
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: \${DB_PASSWORD}
    POSTGRES_DB: app_db
  volumes:
    - postgres_data:/var/lib/postgresql/data
  # Do NOT expose port 5432 to public host; bind internally only`,
      description: "Minimal Docker Compose service definition with persistent named volume."
    },
    productionRules: [
      "Always create indexes on foreign keys (userId, orgId) and columns filtered with WHERE or ORDER BY.",
      "Never expose port 5432 to the public internet (0.0.0.0:5432). Bind to 127.0.0.1 or private Docker bridge.",
      "Enforce statement_timeout = '10s' to prevent runaway unindexed queries from locking database connections."
    ],
    pitfalls: [
      "Sequential table scans (Seq Scan) crashing CPU at >50k rows due to missing composite indexes.",
      "Running out of connection slots during serverless traffic spikes without a connection pooler."
    ],
    whenToReplace: "Add PgBouncer when connections exceed 100. Add Read Replica when read CPU exceeds 75%. Never abandon Postgres for NoSQL."
  },
  prisma: {
    id: "prisma",
    name: "Prisma ORM",
    tagline: "Type-Safe Database Client & Declarative Migrations",
    category: "Database",
    tier: "mvp",
    concept: "Declarative schema-first database abstraction. You define models in schema.prisma, and the CLI compiles them into deterministic SQL migration scripts while generating custom, strongly typed TypeScript client methods tailored to your schema.",
    whyChosen: "End-to-end type safety from SQL schema to frontend props. Autocompletes queries, auto-generates TypeScript types, and creates repeatable SQL migration files.",
    alternativesCompared: "Over raw SQL strings or TypeORM: Eliminates runtime SQL typos and outdated types. Provides deterministic schema migration tracking in Git.",
    stepByStep: [
      "Install dependencies: 'pnpm add @prisma/client && pnpm add -D prisma'.",
      "Initialize schema: 'pnpm prisma init' and set DATABASE_URL in .env.",
      "Draft data models with relations and @index attributes in prisma/schema.prisma.",
      "Generate and apply local migration: 'npx prisma migrate dev --name init'.",
      "Deploy migrations in CI/CD pipeline: 'npx prisma migrate deploy'."
    ],
    commands: [
      { cmd: "npx prisma migrate dev --name <migration_name>", desc: "Generates new SQL migration and applies it to local database.", level: "write" },
      { cmd: "npx prisma migrate deploy", desc: "Applies pending migrations safely in staging/production without prompt.", level: "write" },
      { cmd: "npx prisma studio", desc: "Launches local visual GUI table browser on http://localhost:5555.", level: "read" },
      { cmd: "npx prisma migrate reset", desc: "HAZARDOUS: Drops database, re-applies all migrations, and runs seed script.", level: "hazardous" }
    ],
    quickSetup: {
      language: "bash",
      code: "pnpm add @prisma/client && pnpm add -D prisma\npnpm prisma init\npnpm prisma migrate dev --name init",
      description: "Install Prisma, scaffold schema.prisma, and run initial database migration."
    },
    productionRules: [
      "Always use 'npx prisma migrate dev' locally and 'npx prisma migrate deploy' in CI/CD (never run migrate dev in production).",
      "Always use select: { id: true, name: true } to return only required fields instead of querying whole rows.",
      "Avoid deep nested includes (include: { posts: { include: { comments: true } } }) which trigger heavy SQL JOIN waterfalls."
    ],
    pitfalls: [
      "The N+1 query problem when looping over records without batch includes.",
      "Accidentally leaking hashed password fields in queries by using unconstrained findMany()."
    ],
    whenToReplace: "If query latency is bottlenecked by Prisma client query engine overhead (>5,000 req/sec), introduce Drizzle ORM or Kysely for high-frequency queries."
  },
  redis: {
    id: "redis",
    name: "Redis 7 (Alpine)",
    tagline: "Sub-Millisecond In-Memory Cache, Rate Limiter & Message Broker",
    category: "Cache & Queue",
    tier: "prod",
    concept: "Single-threaded, in-memory key-value data structure store. Operates entirely in RAM with sub-millisecond execution times. Used for distributed cache keys with TTL, token bucket rate limiting, atomic counters, and BullMQ worker queue state.",
    whyChosen: "Fast in-memory operations (under 1ms). Handles distributed session locks, API rate-limiting token buckets, query caching, and BullMQ worker job queues.",
    alternativesCompared: "Over database polling or local Node.js Map(): Persists across container restarts and coordinates state across multiple scaled web processes.",
    stepByStep: [
      "Add Redis container to docker-compose.yml with 256MB memory cap and allkeys-lru eviction.",
      "Configure client library (ioredis) with automatic reconnect backoff.",
      "Wrap expensive, slow database queries with cache-aside pattern (check Redis -> query DB if miss -> set in Redis with 300s TTL).",
      "Implement sliding window rate limiting on public authentication routes.",
      "Mount persistent redis_data volume for append-only file (AOF) persistence."
    ],
    commands: [
      { cmd: "docker exec -it redis_container redis-cli ping", desc: "Verifies Redis daemon responds with PONG.", level: "read" },
      { cmd: "docker exec -it redis_container redis-cli info memory", desc: "Inspects RAM utilization, peak memory, and fragmentation ratio.", level: "read" },
      { cmd: "docker exec -it redis_container redis-cli monitor", desc: "Streams live real-time operations received by Redis server.", level: "read" },
      { cmd: "docker exec -it redis_container redis-cli flushall", desc: "HAZARDOUS: Instantly deletes all keys across all Redis databases.", level: "hazardous" }
    ],
    quickSetup: {
      language: "yaml",
      code: `redis:
  image: redis:7-alpine
  restart: unless-stopped
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru --requirepass \${REDIS_PASSWORD}
  volumes:
    - redis_data:/data`,
      description: "Docker Compose Redis container bounded to 256MB with LRU eviction policy."
    },
    productionRules: [
      "Always set maxmemory and maxmemory-policy (e.g. allkeys-lru) so Redis evicts old cache rather than crashing host memory.",
      "Always set an explicit TTL (Time-To-Live) on cached keys (e.g. EX 300 for 5 minutes).",
      "Never store large blobs (>1MB) in Redis; keep keys under 50KB to preserve sub-millisecond event loop responsiveness."
    ],
    pitfalls: [
      "Running 'KEYS *' in production which locks the single-threaded Redis process; use 'SCAN' instead.",
      "Storing persistent business data without database backup; Redis is a cache/queue, not your source of truth."
    ],
    whenToReplace: "Scale to Redis Cluster or AWS ElastiCache when memory requirements exceed 16GB or read operations exceed 100k ops/sec."
  },
  docker: {
    id: "docker",
    name: "Docker & Docker Compose",
    tagline: "Container Virtualization & Multi-Service Orchestration",
    category: "Infra & DevOps",
    tier: "mvp",
    concept: "Kernel-level namespace and cgroup process isolation. Packages application bytecode, Node.js runtime, OS libraries, and configurations into immutable image layers that execute identically on any Linux host.",
    whyChosen: "Ensures parity between development machine and Linux production VPS. Eliminates 'it works on my machine' errors by packaging Node.js, libraries, and OS runtime together.",
    alternativesCompared: "Over bare-metal Node scripts: Isolates system dependencies, enables clean 1-line rollbacks, and prevents database files from polluting host OS.",
    stepByStep: [
      "Write multi-stage Dockerfile (deps, builder, runner) based on node:20-alpine.",
      "Draft docker-compose.yml linking web app, postgres, and redis in a shared private bridge network.",
      "Mount named volumes for postgres_data to guarantee disk persistence.",
      "Add container healthcheck probes to prevent app startup before database is ready.",
      "Launch and verify containers in detached mode: 'docker compose up -d --build'."
    ],
    commands: [
      { cmd: "docker ps -a", desc: "Lists all running and stopped containers with uptime and port mappings.", level: "read" },
      { cmd: "docker logs -f --tail 100 <container_name>", desc: "Streams live output logs from specified container process.", level: "read" },
      { cmd: "docker compose up -d --build", desc: "Rebuilds images and starts container stack in background.", level: "write" },
      { cmd: "docker system prune -a --volumes", desc: "HAZARDOUS: Deletes all stopped containers, dangling images, and unnamed storage volumes.", level: "hazardous" }
    ],
    quickSetup: {
      language: "bash",
      code: "docker compose up -d --build\ndocker ps\ndocker logs -f --tail 50 app",
      description: "Build images, launch containers in background, verify process status, and tail logs."
    },
    productionRules: [
      "Always run container processes under a non-root user (e.g. node or nextjs) inside the Dockerfile.",
      "Use multi-stage Docker builds to keep production images lightweight (<150MB).",
      "Mount persistent data (PostgreSQL, uploads) exclusively into named Docker volumes or bind mounts."
    ],
    pitfalls: [
      "Forgetting to mount a persistent volume for the database container, causing total data loss on docker compose down.",
      "Disk exhaustion caused by dangling build images and unrotated container log files."
    ],
    whenToReplace: "Stay with Docker Compose up to 30,000 DAU on a single VPS. Migrate to AWS ECS Fargate or Kubernetes only when multi-region node auto-scaling is strictly mandatory."
  },
  nginx: {
    id: "nginx",
    name: "Nginx Reverse Proxy",
    tagline: "High-Performance Edge Ingress, SSL Termination & Rate Limiter",
    category: "Infra & DevOps",
    tier: "mvp",
    concept: "Asynchronous event-driven web server and reverse proxy. Sits on the public network edge handling ports 80 and 443, terminating TLS cryptographic handshakes, handling client connection timeouts, and forwarding clean HTTP traffic to internal Docker ports.",
    whyChosen: "Protects application runtimes from slow-client attacks, terminates TLS 1.3 certificates cleanly, proxies port 443 into local Docker containers, and handles Gzip compression.",
    alternativesCompared: "Over binding Node.js directly to port 80/443: Avoids running Node as root, handles thousands of concurrent idle sockets without CPU spikes.",
    stepByStep: [
      "Install Nginx on host Linux VPS: 'sudo apt install nginx -y'.",
      "Create virtual host file in /etc/nginx/sites-available/app.conf.",
      "Configure proxy_pass to http://127.0.0.1:3000 with Host and X-Forwarded headers.",
      "Test configuration syntax: 'sudo nginx -t'.",
      "Issue automated TLS certificate via Certbot: 'sudo certbot --nginx -d yourdomain.com'."
    ],
    commands: [
      { cmd: "sudo nginx -t", desc: "Validates Nginx configuration files for syntax errors without restarting.", level: "read" },
      { cmd: "sudo systemctl reload nginx", desc: "Gracefully reloads configuration without dropping active HTTP connections.", level: "write" },
      { cmd: "sudo journalctl -u nginx -n 50 --no-pager", desc: "Reads the 50 most recent systemd logs for the Nginx daemon.", level: "read" }
    ],
    quickSetup: {
      language: "nginx",
      code: `server {
    listen 443 ssl http2;
    server_name app.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/app.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`,
      description: "Production virtual host routing external port 443 into local Docker port 3000."
    },
    productionRules: [
      "Always test syntax with 'sudo nginx -t' before running 'sudo systemctl reload nginx'.",
      "Set client_max_body_size (e.g. 10M) to prevent memory exhaustion from oversized file uploads.",
      "Forward X-Forwarded-For and X-Forwarded-Proto headers so backend apps know the real client IP and HTTPS protocol."
    ],
    pitfalls: [
      "Hardcoding backend container IP addresses that change on restart instead of proxying to 127.0.0.1:PORT.",
      "Missing proxy headers causing Next.js to believe requests are insecure HTTP and triggering infinite redirect loops."
    ],
    whenToReplace: "Introduce Cloudflare Anycast CDN in front of Nginx at Level 2; replace Nginx with AWS Application Load Balancer (ALB) at Level 3."
  },
  cloudflare: {
    id: "cloudflare",
    name: "Cloudflare (Anycast CDN & WAF)",
    tagline: "Global Edge DNS, DDoS Mitigation, Bot Shield & SSL Gateway",
    category: "Security & Edge",
    tier: "prod",
    concept: "Distributed Anycast reverse proxy network operating across 300+ global cities. Incoming DNS lookups and HTTP packets route to the geographically nearest Cloudflare edge node, which terminates SSL, filters volumetric DDoS floods, executes WAF rules, and proxies legitimate traffic to your origin VPS.",
    whyChosen: "Absorbs malicious volumetric DDoS attacks at edge nodes before packets ever touch your origin server IP. Provides free global DNS propagation and automatic edge SSL.",
    alternativesCompared: "Over bare DNS registrar records: Masks origin server IP address from direct port scanners and caches static assets globally for free.",
    stepByStep: [
      "Add domain to Cloudflare dashboard and change nameservers at registrar.",
      "Create proxied (Orange Cloud) A Record pointing root (@) and subdomains to server IPv4.",
      "Set SSL/TLS encryption mode to 'Full (strict)'.",
      "Configure Web Application Firewall (WAF) rate limiting on authentication routes (/api/auth/*).",
      "Verify origin server IP is hidden from global DNS scans."
    ],
    commands: [
      { cmd: "dig +short yourdomain.com", desc: "Confirms domain resolves to Cloudflare Anycast edge IP (origin hidden).", level: "read" },
      { cmd: "curl -Iv https://yourdomain.com", desc: "Verifies HTTP/3 edge TLS termination and cf-ray tracking headers.", level: "read" }
    ],
    quickSetup: {
      language: "bash",
      code: "# Point domain nameservers at registrar:\n# 1. ns1.cloudflare.com\n# 2. ns2.cloudflare.com\n# Set SSL/TLS encryption mode to 'Full (strict)'",
      description: "Set nameservers and configure strict end-to-end SSL encryption."
    },
    productionRules: [
      "Always set SSL/TLS mode to 'Full (strict)' to avoid man-in-the-middle sniffing between Cloudflare and your origin VPS.",
      "Keep origin server IP address private; never create unproxied (DNS-only) A records pointing to the same server.",
      "Configure rate-limiting rules (e.g., max 10 requests per 10s on /api/auth/* endpoints) to stop credential stuffing."
    ],
    pitfalls: [
      "Setting SSL mode to 'Flexible', which causes infinite redirect loops (301 HTTP -> HTTPS -> HTTP).",
      "Caching dynamic API responses by configuring over-aggressive wild-card cache rules."
    ],
    whenToReplace: "Never replace. Cloudflare scales effortlessly from $0/month free tier to Fortune 500 Enterprise."
  },
  stripe: {
    id: "stripe",
    name: "Stripe & Webhook Engine",
    tagline: "Global Payment Processing, Checkout Sessions & Subscriptions",
    category: "Payments",
    tier: "prod",
    concept: "Financial transaction pipeline. Your server creates signed Checkout Sessions via REST API; users input card data directly into Stripe's PCI-certified iframe; Stripe asynchronously dispatches cryptographic HMAC-signed webhook events to your backend to confirm authorization and subscription status.",
    whyChosen: "The global developer standard for checkout flows, PCI-compliant card tokenization, multi-currency invoicing, and customer billing portals.",
    alternativesCompared: "Over custom merchant gateways: Offloads PCI compliance liability entirely, supports Apple Pay/Google Pay out of the box, and handles customer self-serve cancellations.",
    stepByStep: [
      "Configure Stripe dashboard and store STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in .env.",
      "Create server-side checkout session route handler returning Stripe hosted URL.",
      "Create webhook receiver route (/api/webhooks/stripe) capturing unparsed raw request buffer.",
      "Verify cryptographic HMAC signature using 'stripe.webhooks.constructEvent()'.",
      "Check database WebhookEvents table to guarantee idempotent execution before updating accounts."
    ],
    commands: [
      { cmd: "stripe listen --forward-to localhost:3000/api/webhooks/stripe", desc: "Streams Stripe test webhooks directly to your local development server.", level: "read" },
      { cmd: "stripe trigger payment_intent.succeeded", desc: "Emulates successful payment webhook event for testing.", level: "read" }
    ],
    quickSetup: {
      language: "typescript",
      code: `const event = stripe.webhooks.constructEvent(
  rawBody,
  signatureHeader,
  process.env.STRIPE_WEBHOOK_SECRET!
);
// Enforce idempotency: check if event.id was already processed`,
      description: "Cryptographic HMAC webhook signature verification in Next.js route handler."
    },
    productionRules: [
      "Always capture raw unparsed request buffer (not parsed JSON) for cryptographic HMAC signature verification.",
      "Check an internal WebhookEvents database table before processing any event to ensure idempotency.",
      "Never unlock paid customer features on client-side success redirects; only unlock state via verified webhook."
    ],
    pitfalls: [
      "Failing to handle duplicate webhook delivery, causing customers to be credited or invoiced twice.",
      "Failing to verify webhook signature, leaving routes open to forged payload spoofing."
    ],
    whenToReplace: "In regions like Southeast Asia / Cambodia, complement Stripe with local banking rails like ABA PAYWAY (KHQR); for merchant of record tax compliance, use Lemon Squeezy or Paddle."
  },
  bullmq: {
    id: "bullmq",
    name: "BullMQ & Redis Queues",
    tagline: "Persistent Asynchronous Background Job Processing",
    category: "Cache & Queue",
    tier: "prod",
    concept: "Persistent FIFO and delayed message queue engine built on Redis streams. Web processes produce job records into Redis in <2ms, while background worker processes consume jobs concurrently, executing retries with exponential backoff without slowing down customer HTTP requests.",
    whyChosen: "Decouples slow tasks (email dispatch, video rendering, webhook relays, invoice generation) from the HTTP request-response cycle so user API calls return in <50ms.",
    alternativesCompared: "Over in-process setTimeout(): Survives server restarts, automatically retries failed jobs with exponential backoff, and tracks execution history.",
    stepByStep: [
      "Install BullMQ: 'pnpm add bullmq ioredis'.",
      "Define Redis connection configuration with maxRetriesPerRequest: null.",
      "Instantiate Queue instance in web application to enqueue jobs with payload and retry parameters.",
      "Create dedicated worker process (worker.ts) listening to the queue.",
      "Supervise worker execution via Docker container or systemd daemon."
    ],
    commands: [
      { cmd: "pnpm exec ts-node src/workers/email.worker.ts", desc: "Starts worker process locally to consume queue jobs.", level: "read" },
      { cmd: "docker exec -it redis_container redis-cli keys 'bull:*'", desc: "Inspects active BullMQ queue keys and metadata in Redis.", level: "read" }
    ],
    quickSetup: {
      language: "typescript",
      code: `import { Queue, Worker } from 'bullmq';

const emailQueue = new Queue('emails', { connection: redisConfig });
await emailQueue.add('welcome-email', { userId: '123' }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });`,
      description: "Producer enqueueing job with 3 automated retry attempts."
    },
    productionRules: [
      "All job processors must be idempotent: executing the same job twice must produce the exact same outcome.",
      "Configure dead-letter queues (failed job listeners) and alert via Slack/Sentry when retries are exhausted.",
      "Run worker processes in a separate container from the web server so heavy jobs never steal CPU from web requests."
    ],
    pitfalls: [
      "Passing huge database objects in job payload instead of just passing the record ID (e.g. { orderId: '123' }).",
      "Workers crashing silently without process supervisor (Docker or PM2) to restart them."
    ],
    whenToReplace: "Scale BullMQ across multiple worker instances as queue depth increases; migrate to AWS SQS / Kafka only at enterprise data pipeline scale."
  },
  typescript: {
    id: "typescript",
    name: "TypeScript 5",
    tagline: "Static Type Enforcement & Living Architecture Contracts",
    category: "Framework",
    tier: "mvp",
    concept: "Syntactic superset of JavaScript adding static type annotations. Types are erased at compile time, outputting standard JavaScript, while the compiler prevents runtime crashes, guarantees object shapes across function boundaries, and acts as living documentation.",
    whyChosen: "Catches 80% of silly runtime errors (e.g. 'cannot read properties of undefined') at compile time before code reaches production servers.",
    alternativesCompared: "Over plain JavaScript: Eliminates manual runtime type-checking guards and enables safe refactoring across hundreds of files.",
    stepByStep: [
      "Install TypeScript: 'pnpm add -D typescript @types/node @types/react'.",
      "Configure tsconfig.json with strict: true and modern moduleResolution ('bundler').",
      "Define domain interfaces for database entities, API payloads, and component props.",
      "Share DTO types between server actions and frontend client components.",
      "Enforce type check in CI pipeline: 'pnpm tsc --noEmit'."
    ],
    commands: [
      { cmd: "pnpm tsc --noEmit", desc: "Runs full project static type check across all files without emitting JS.", level: "read" },
      { cmd: "pnpm tsc --watch", desc: "Runs type checker in background with incremental rebuilds.", level: "read" }
    ],
    quickSetup: {
      language: "json",
      code: `{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "target": "ES2022",
    "moduleResolution": "bundler"
  }
}`,
      description: "tsconfig.json with strict type checking enabled."
    },
    productionRules: [
      "Never use 'any'. Use 'unknown' and narrow with type guards or Zod schemas.",
      "Share data transfer object (DTO) interfaces between server actions and client views.",
      "Enable 'strict: true' from day one; retrofitting strict mode into loose codebases is agonizing."
    ],
    pitfalls: [
      "Type assertions (as Type) that bypass compiler safety and hide actual runtime null pointer errors.",
      "Overly complicated generic types that slow down IDE compile times without adding real safety."
    ],
    whenToReplace: "Never replace. Standard for all modern fullstack engineering."
  },
  tailwind: {
    id: "tailwind",
    name: "Tailwind CSS 3/4",
    tagline: "Utility-First Styling & Strict Design Token Enforcement",
    category: "Framework",
    tier: "mvp",
    concept: "Compiler that scans source code templates for utility classes and generates a minimal, deduplicated CSS stylesheet. Constrains design to fixed tokens (4px spacing scale, fixed color palettes) directly in markup.",
    whyChosen: "Enforces a disciplined 4px spacing scale and fixed typography ladder. Prevents CSS file bloat by purging unused styles into a tiny ~15KB production bundle.",
    alternativesCompared: "Over traditional CSS files or CSS-in-JS (styled-components): Eliminates naming fatigue (wrapper-inner-box-v2) and zero runtime CSS parser overhead.",
    stepByStep: [
      "Install packages: 'pnpm add -D tailwindcss postcss autoprefixer'.",
      "Initialize configuration: 'npx tailwindcss init -p'.",
      "Define semantic CSS variables (--surface-panel, --border-subtle) in global CSS.",
      "Configure content paths in tailwind.config.js to scan all TSX components.",
      "Verify production CSS bundle size is under 30KB during 'pnpm build'."
    ],
    commands: [
      { cmd: "npx tailwindcss -i ./src/app/globals.css -o ./dist/output.css --minify", desc: "Compiles and minifies standalone production CSS bundle.", level: "write" }
    ],
    quickSetup: {
      language: "bash",
      code: "pnpm add -D tailwindcss postcss autoprefixer\nnpx tailwindcss init -p",
      description: "Scaffold Tailwind CSS and PostCSS configuration."
    },
    productionRules: [
      "Stick strictly to standard spacing values (p-2, p-4, p-6, gap-3); never use arbitrary inline values like p-[17px].",
      "Keep custom colors defined as semantic CSS variables (--surface-panel, --border-subtle) in global CSS.",
      "Extract repeating component patterns (buttons, inputs) into React components, not @apply classes."
    ],
    pitfalls: [
      "Writing 50-class long strings without component abstraction, destroying readability.",
      "Mixing conflicting margin and padding utilities causing layout shift across breakpoints."
    ],
    whenToReplace: "Never replace. Modern industry standard for web and React Native (NativeWind) interfaces."
  },
  vitest: {
    id: "vitest",
    name: "Vitest & Playwright",
    tagline: "Fast Integration Testing & End-to-End Browser Automation",
    category: "Testing",
    tier: "prod",
    concept: "Dual-tier testing pyramid. Vitest executes sub-second unit and database integration tests in Node.js using Vite's fast transformation engine. Playwright drives real Chromium, Firefox, and WebKit browser sessions in headless mode to test real user journeys (Sign In -> Checkout -> Core Loop).",
    whyChosen: "Vitest runs TypeScript unit and integration tests instantly using Vite. Playwright automates real browser sessions to guarantee checkout and auth journeys never break.",
    alternativesCompared: "Over Jest: 10x faster startup, zero configuration for TypeScript/ESM, and shared Vite pipeline.",
    stepByStep: [
      "Install Vitest and Playwright: 'pnpm add -D vitest @playwright/test'.",
      "Create vitest.config.ts with alias paths matching tsconfig.",
      "Write integration tests validating database mutations and server actions.",
      "Write 1 Playwright E2E smoke test verifying the core happy path.",
      "Add test step to GitHub Actions CI to block pull request merges on failure."
    ],
    commands: [
      { cmd: "pnpm vitest run", desc: "Executes unit and integration test suites once with summary report.", level: "read" },
      { cmd: "pnpm vitest", desc: "Runs Vitest in interactive watch mode for instant test feedback on save.", level: "read" },
      { cmd: "pnpm playwright test", desc: "Runs headless end-to-end browser tests across Chromium, Firefox, and WebKit.", level: "read" },
      { cmd: "pnpm playwright show-report", desc: "Opens interactive visual HTML report showing browser test traces.", level: "read" }
    ],
    quickSetup: {
      language: "bash",
      code: "pnpm add -D vitest @playwright/test\npnpm vitest run\npnpm playwright test",
      description: "Install and execute test suites."
    },
    productionRules: [
      "Focus testing on integration boundaries (server actions, DB mutations, webhooks) rather than trivial UI button renders.",
      "Write 1 Playwright end-to-end smoke test verifying the happy path: Sign In -> Checkout -> Core Action.",
      "Run test suites in GitHub Actions on every pull request before merging to main."
    ],
    pitfalls: [
      "Writing hundreds of brittle unit tests mocking internal functions that break during every minor refactoring.",
      "Skipping database integration tests, leaving SQL query syntax errors undetected."
    ],
    whenToReplace: "Never replace. High-speed testing foundation for production confidence."
  },
  linux: {
    id: "linux",
    name: "Ubuntu Linux & UFW Firewall",
    tagline: "Hardened Operating System & Kernel Packet Filter",
    category: "Infra & DevOps",
    tier: "mvp",
    concept: "Host operating environment and network security gate. Linux kernel isolates processes and manages hardware threads, while UFW (Uncomplicated Firewall) manipulates iptables/nftables to drop all incoming TCP/UDP packets except on explicitly authorized ingress ports (SSH:22, HTTP:80, HTTPS:443).",
    whyChosen: "Reliable, minimal server operating system. UFW (Uncomplicated Firewall) blocks unauthorized inbound traffic at the Linux kernel level.",
    alternativesCompared: "Over managed PaaS lock-in: Gives you full control over CPU, memory, Docker runtimes, and predictable $5-$20/mo flat pricing.",
    stepByStep: [
      "Deploy Ubuntu 24.04 LTS VPS instance on Hetzner or DigitalOcean.",
      "Create non-root administrative user with sudo rights; configure SSH public key.",
      "Configure UFW rules: allow 22 (SSH), 80 (HTTP), 443 (HTTPS) only.",
      "Enable firewall: 'sudo ufw enable' and verify status.",
      "Configure automated daily security updates: 'sudo apt install unattended-upgrades'."
    ],
    commands: [
      { cmd: "sudo ufw status verbose", desc: "Audits active firewall rules and incoming port restrictions.", level: "read" },
      { cmd: "sudo ufw allow 80/tcp && sudo ufw allow 443/tcp", desc: "Opens public HTTP and HTTPS ports for web traffic.", level: "write" },
      { cmd: "ss -tuln", desc: "Inspects all listening TCP/UDP sockets and bound IP addresses.", level: "read" },
      { cmd: "sudo ufw disable", desc: "HAZARDOUS: Disables host firewall, exposing all internal ports to the internet.", level: "hazardous" }
    ],
    quickSetup: {
      language: "bash",
      code: "sudo ufw default deny incoming\nsudo ufw default allow outgoing\nsudo ufw allow 22/tcp\nsudo ufw allow 80/tcp\nsudo ufw allow 443/tcp\nsudo ufw enable",
      description: "Harden host firewall: allow SSH, HTTP, and HTTPS only. Block all other ports."
    },
    productionRules: [
      "Disable password authentication in /etc/ssh/sshd_config; use SSH public keys exclusively.",
      "Never run user application processes directly as root.",
      "Set up automatic security patches with unattended-upgrades."
    ],
    pitfalls: [
      "Enabling UFW before allowing port 22/tcp, permanently locking yourself out of the VPS.",
      "Leaving PostgreSQL (5432) or Redis (6379) exposed to public interfaces."
    ],
    whenToReplace: "Scale from single VPS to multi-node managed instances (AWS/Hetzner Cloud) when memory needs exceed 64GB."
  },
  supabase: {
    id: "supabase",
    name: "Supabase",
    tagline: "Managed PostgreSQL, Row-Level Security & S3 Storage",
    category: "Database",
    tier: "mvp",
    concept: "Managed developer platform built directly on native PostgreSQL. Bundles PgBouncer connection pooling, GoTrue JWT authentication, automated daily backups, and PostgREST API generation with fine-grained Row-Level Security (RLS) policies.",
    whyChosen: "Instant managed PostgreSQL with built-in connection pooling, automated nightly backups, file storage, and Row-Level Security without managing database servers.",
    alternativesCompared: "Over self-hosted Postgres on Day 1: Eliminates database server maintenance, automated backup scripting, and disk provisioning.",
    stepByStep: [
      "Create Supabase project in closest geographic region to your users.",
      "Copy connection pooling string (port :6543) into DATABASE_URL.",
      "Apply migrations using Prisma or Supabase CLI: 'npx supabase db push'.",
      "Enable Row-Level Security (RLS) on all public tables with tenant isolation policies.",
      "Configure automated daily backup schedule."
    ],
    commands: [
      { cmd: "npx supabase status", desc: "Inspects local or remote Supabase services and container health.", level: "read" },
      { cmd: "npx supabase db push", desc: "Applies local migration scripts to remote Supabase project.", level: "write" }
    ],
    quickSetup: {
      language: "bash",
      code: "DATABASE_URL=\"postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true\"",
      description: "Direct connection string with transaction pooler enabled."
    },
    productionRules: [
      "Always use the pooled connection port (:6543 or pgbouncer=true) for serverless Next.js functions.",
      "Enable Row-Level Security (RLS) on all public-facing tables.",
      "Export manual SQL dump backups before running destructive migrations."
    ],
    pitfalls: [
      "Exhausting direct connection pool limits by using port 5432 from serverless functions.",
      "Leaving RLS disabled while exposing tables via Supabase client."
    ],
    whenToReplace: "Self-host PostgreSQL with Docker Compose when cloud bandwidth costs exceed budget or data residency laws require on-premise servers."
  },
  zod: {
    id: "zod",
    name: "Zod Schema Validation",
    tagline: "TypeScript-First Runtime Input & Boundary Validation",
    category: "Framework",
    tier: "mvp",
    concept: "Runtime validation library with static type inference. Acts as a strict gatekeeper at network boundaries (HTTP requests, URL params, environment variables), converting unvalidated untyped external inputs into verified, type-safe TypeScript objects.",
    whyChosen: "Guarantees that external user input matches internal TypeScript types at runtime. Automatically infers TypeScript types from schemas with zero code duplication.",
    alternativesCompared: "Over manual if/else checks or Joi: Integrates seamlessly with TypeScript and React Hook Form with unified error messages.",
    stepByStep: [
      "Install Zod: 'pnpm add zod'.",
      "Define schemas for API requests, forms, and environment variables.",
      "Infer TypeScript types automatically using 'z.infer<typeof Schema>'.",
      "Validate mutation inputs in server actions using 'schema.safeParse(data)'.",
      "Return structured error messages to client components on validation failure."
    ],
    commands: [
      { cmd: "pnpm test", desc: "Executes test suite validating Zod schema constraints and edge cases.", level: "read" }
    ],
    quickSetup: {
      language: "typescript",
      code: `import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["user", "admin"]).default("user"),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;`,
      description: "Define runtime schema and infer static TypeScript type."
    },
    productionRules: [
      "Parse and validate every incoming Server Action or API request before passing data to ORM.",
      "Use safeParse() instead of parse() to avoid unhandled try/catch exceptions.",
      "Define centralized env.ts schema to validate process.env variables at boot."
    ],
    pitfalls: [
      "Assuming TypeScript types protect runtime data without Zod validation at network boundaries.",
      "Writing overly complex regexes inside Zod schemas that cause ReDoS bottlenecks."
    ],
    whenToReplace: "Never replace. Standard validation layer across modern TypeScript stacks."
  },
  letsencrypt: {
    id: "letsencrypt",
    name: "Let's Encrypt & Certbot",
    tagline: "Free Automated TLS 1.3 Cryptographic Certificates",
    category: "Security & Edge",
    tier: "mvp",
    concept: "Non-profit open Certificate Authority (CA). Certbot client initiates ACME protocol HTTP-01 challenges, answering automated cryptographic proofs to verify domain control and obtaining valid X.509 SSL certificates signed by ISRG Root X1.",
    whyChosen: "Free, automated SSL/TLS certificate issuance. Eliminates expensive commercial SSL fees and automatically renews certificates before expiration via cron/systemd.",
    alternativesCompared: "Over commercial certificates ($100-$300/yr): Zero financial cost and fully automated ACME protocol renewals.",
    stepByStep: [
      "Install Certbot and Nginx plugin: 'sudo apt install certbot python3-certbot-nginx -y'.",
      "Ensure domain DNS points to VPS and port 80/tcp is open in UFW firewall.",
      "Run Certbot with Nginx plugin: 'sudo certbot --nginx -d yourdomain.com'.",
      "Verify automatic renewal timer: 'sudo systemctl status certbot.timer'.",
      "Simulate dry-run certificate renewal: 'sudo certbot renew --dry-run'."
    ],
    commands: [
      { cmd: "sudo certbot certificates", desc: "Displays all installed SSL certificates, domains, and expiry dates.", level: "read" },
      { cmd: "sudo certbot renew --dry-run", desc: "Simulates certificate renewal without modifying live production certs.", level: "read" },
      { cmd: "sudo certbot renew --force-renewal", desc: "Forces immediate renewal of all certificates regardless of expiry.", level: "write" }
    ],
    quickSetup: {
      language: "bash",
      code: "sudo apt install certbot python3-certbot-nginx -y\nsudo certbot --nginx -d yourdomain.com -d app.yourdomain.com",
      description: "Obtains SSL certificate and configures Nginx virtual host automatically."
    },
    productionRules: [
      "Always test automatic renewal with 'sudo certbot renew --dry-run'.",
      "Ensure port 80/tcp is open in firewall during ACME HTTP-01 challenge verification.",
      "Enforce TLS 1.2 and 1.3 only; disable obsolete SSLv3, TLS 1.0, and TLS 1.1."
    ],
    pitfalls: [
      "Blocking port 80 in firewall, causing Certbot automated renewal to fail silently after 90 days.",
      "Exceeding Let's Encrypt rate limits (50 certificates per registered domain per week) during local testing."
    ],
    whenToReplace: "Use Cloudflare Universal Edge SSL at Level 2 for automatic edge TLS without managing origin ACME challenges."
  },
  systemd: {
    id: "systemd",
    name: "Systemd & Journalctl",
    tagline: "Linux Service Supervisor & Centralized Kernel Logger",
    category: "Infra & DevOps",
    tier: "mvp",
    concept: "Linux system and service manager (PID 1). Controls daemon initialization, manages cgroup process hierarchies, restarts crashed background processes automatically upon failure, and captures unified binary log journals via journald.",
    whyChosen: "The fundamental Linux process supervisor. Boots Docker and Nginx automatically on system reboots, restarts crashed daemons, and captures standard output logs.",
    alternativesCompared: "Over manual nohup or screen sessions: Provides automatic failure restarts, cgroup memory limits, and structured log rotation.",
    stepByStep: [
      "Audit active systemd services: 'systemctl list-units --type=service --state=running'.",
      "Enable Docker and Nginx to auto-start on boot: 'sudo systemctl enable docker nginx'.",
      "Configure log retention size (SystemMaxUse=500M) in /etc/systemd/journald.conf.",
      "Inspect real-time log streams using journalctl with '--no-pager'.",
      "Create custom service unit files in /etc/systemd/system/ for standalone workers."
    ],
    commands: [
      { cmd: "sudo systemctl status <service_name>", desc: "Checks runtime health, active PID, memory, and recent logs of a daemon.", level: "read" },
      { cmd: "sudo systemctl restart <service_name>", desc: "Stops and restarts specified system service.", level: "write" },
      { cmd: "sudo journalctl -u <service_name> -f", desc: "Streams live output logs from specified system service.", level: "read" },
      { cmd: "sudo journalctl --vacuum-size=200M", desc: "Trims archived journald logs to free disk space.", level: "write" }
    ],
    quickSetup: {
      language: "bash",
      code: "sudo systemctl status docker\nsudo systemctl restart nginx\nsudo journalctl -u nginx -n 50 --no-pager",
      description: "Inspect daemon state, reload services, and stream recent service logs."
    },
    productionRules: [
      "Always enable vital services to survive reboots: 'sudo systemctl enable docker nginx'.",
      "Configure log retention in /etc/systemd/journald.conf (SystemMaxUse=500M) to prevent disk fills.",
      "Use '--no-pager' when scripting journalctl commands to avoid hanging automated CLI scripts."
    ],
    pitfalls: [
      "Ignoring journald log files until the host disk fills to 100%, crashing database writes.",
      "Restarting system services blindly during outages before reading journal logs."
    ],
    whenToReplace: "Remains active on every Linux host beneath container runtimes."
  }
};
