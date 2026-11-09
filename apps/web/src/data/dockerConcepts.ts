export interface DockerConcept {
  id: string;
  name: string;
  subtitle: string;
  category: "Foundations" | "Build & Cache" | "Storage & Volumes" | "Networking & Ingress" | "Lifecycle & Health" | "Security & Production";
  mentalModel: string;
  coreMechanism: string;
  keySyntax: {
    label: string;
    code: string;
    explanation: string;
  }[];
  productionCommands: {
    cmd: string;
    desc: string;
    level: "read" | "write" | "hazardous";
  }[];
  productionRules: string[];
  failureModes: {
    pitfall: string;
    impact: string;
    resolution: string;
  }[];
  realWorldScenario: {
    title: string;
    situation: string;
    investigation: string;
    fix: string;
  };
}

export const DOCKER_CONCEPTS: DockerConcept[] = [
  {
    id: "image-vs-containers",
    name: "1. Image vs Containers",
    subtitle: "Class Blueprint vs Living Linux Namespace Instance",
    category: "Foundations",
    mentalModel: "An Image is a compiled, immutable, read-only template composed of stacked UnionFS rootfs layers. A Container is a running Linux process wrapped in cgroups (resource limits) and namespaces (isolation: PID, NET, MNT, IPC, UTS) with a thin read-write scratch layer mounted on top.",
    coreMechanism: "When you execute `docker run`, the Docker daemon (dockerd) calls containerd, which instructs runc to configure kernel namespaces (clone flags `CLONE_NEWPID`, `CLONE_NEWNET`, etc.), attach cgroup constraints (`/sys/fs/cgroup/`), unpack the overlay2 image layers as read-only base directories, mount a copy-on-write (CoW) upperdir, and exec the entrypoint binary as PID 1 inside that isolated namespace.",
    keySyntax: [
      {
        label: "OCI Image Spec vs Runtime Container",
        code: `# Image Manifest (Digest: sha256:...):
Layer 1: base-os (ro)
Layer 2: runtime-binaries (ro)
Layer 3: app-code (ro)

# Container Runtime (Active Process):
Layer 4: [Container RW Layer] (Copy-on-Write upperdir)
Namespaces: [pid:1042 -> container-pid:1, net:veth9a1 -> eth0]
Cgroups:    [cpu.max=200000 100000, memory.max=1073741824]`,
        explanation: "Images are frozen bytes on disk. Modifying a file inside a running container writes exclusively to Layer 4 (upperdir). When the container is destroyed, Layer 4 is deleted instantly."
      }
    ],
    productionCommands: [
      { cmd: "docker images -a --digests", desc: "List all local images including intermediate layers and SHA256 digests", level: "read" },
      { cmd: "docker ps -a --format 'table {{.ID}}\\t{{.Image}}\\t{{.Status}}\\t{{.Size}}'", desc: "Inspect active/stopped containers and the disk consumption of their RW layer", level: "read" },
      { cmd: "docker diff <container_id>", desc: "Inspect filesystem mutations (Added, Changed, Deleted) made on the container RW upperdir", level: "read" },
      { cmd: "docker container prune -f", desc: "Purge all stopped containers to reclaim orphaned RW filesystem layers", level: "write" }
    ],
    productionRules: [
      "Containers must remain strictly ephemeral and disposable: if killing a container causes data loss, your architecture violates the 12-factor container rule.",
      "Never run stateful database writes to the container's CoW upperdir: write performance degrades drastically due to Overlay2 driver overhead compared to mounted block storage."
    ],
    failureModes: [
      {
        pitfall: "Treating containers like long-running pet VMs and applying manual patches inside via SSH/exec",
        impact: "Next deployment or node reschedule obliterates all manual hotfixes, causing silent regressions and configuration drift.",
        resolution: "Patch the Dockerfile, commit code, build an immutable image tag, push to registry, and redeploy."
      }
    ],
    realWorldScenario: {
      title: "The Phantom 500GB Disk Exhaustion from Ephemeral RW Layers",
      situation: "An e-commerce API running in Docker crashed with `ENOSPC: no space left on device` even though Postgres resided on a dedicated AWS RDS instance.",
      investigation: "`docker diff <api_id>` showed 15,000 files in `/tmp` added daily. A PDF report generator was rendering invoices to local disk instead of S3, filling the container's overlay2 RW layer until the host disk filled.",
      fix: "Streamed PDF generation directly to AWS S3 memory buffers and mounted `/tmp` as a `tmpfs` in-memory mount with a 128MB cap in docker-compose."
    }
  },
  {
    id: "dockerfile",
    name: "2. Dockerfile",
    subtitle: "Declarative Assembly Recipe for OCI Artifacts",
    category: "Foundations",
    mentalModel: "A Dockerfile is an executable sequence of instructions processed from top to bottom by BuildKit. Each instruction (`FROM`, `RUN`, `COPY`, `ENV`, `EXPOSE`, `ENTRYPOINT`, `CMD`) evaluates cache invalidation hashes and commits an immutable snapshot to the build graph.",
    coreMechanism: "BuildKit translates instructions into an LLB (Low-Level Builder) directed acyclic graph (DAG). Instructions with no dependency on previous outputs run concurrently. `ENTRYPOINT` defines the immutable executable binary, while `CMD` supplies default parameters that can be overridden at runtime by CLI arguments.",
    keySyntax: [
      {
        label: "Production Dockerfile Anatomy",
        code: `FROM node:20-bookworm-slim AS runner
WORKDIR /app
RUN groupadd --system --gid 1001 nodejs && \\
    useradd --system --uid 1001 nextjs
COPY --chown=nextjs:nodejs package.json pnpm-lock.yaml ./
ENV NODE_ENV=production PORT=3000
USER nextjs
EXPOSE 3000
ENTRYPOINT ["node"]
CMD ["dist/server.js"]`,
        explanation: "Always use exec JSON syntax [\"executable\", \"param1\"] for ENTRYPOINT and CMD so signals (SIGTERM, SIGINT) pass directly to the application without a shell wrapper intercepting them."
      }
    ],
    productionCommands: [
      { cmd: "DOCKER_BUILDKIT=1 docker build -t myapp:1.0.0 .", desc: "Build an image utilizing the parallel BuildKit DAG execution engine", level: "write" },
      { cmd: "docker build --no-cache --progress=plain -t myapp:debug .", desc: "Execute a clean deterministic build with full raw stdout for troubleshooting", level: "read" },
      { cmd: "docker history --human --format 'table {{.CreatedBy}}\\t{{.Size}}' myapp:1.0.0", desc: "Inspect layer-by-layer size contribution of each Dockerfile instruction", level: "read" }
    ],
    productionRules: [
      "Always favor the exec form [\"bin\", \"arg\"] over shell form (bin arg): shell form spawns `/bin/sh -c` which masks PID 1 and swallows SIGTERM signals.",
      "Order instructions by change frequency: static OS libraries first, dependency manifests second, code compilation third, runtime entrypoint last."
    ],
    failureModes: [
      {
        pitfall: "Using `ENTRYPOINT npm start` (shell syntax) in production Node.js containers",
        impact: "`sh` runs as PID 1. On `docker stop`, `SIGTERM` is sent to `sh`, which does not forward it to node. After a 10s timeout, Docker issues `SIGKILL`, abruptly dropping in-flight database transactions.",
        resolution: "Switch to `ENTRYPOINT [\"node\", \"server.js\"]` or use `dumb-init` / `tini` to properly handle and forward POSIX signals."
      }
    ],
    realWorldScenario: {
      title: "Broken Graceful Shutdown on Kubernetes Rolling Updates",
      situation: "Users experienced HTTP 502 Bad Gateway during zero-downtime rolling deploys of a payment processing service.",
      investigation: "The Dockerfile ended with `CMD npm run start`. When Kubernetes drained the pod, the container ignored the 30-second termination grace period because `/bin/sh` dropped the SIGTERM signal, causing Kubernetes to SIGKILL active Stripe webhooks.",
      fix: "Changed instruction to `ENTRYPOINT [\"dumb-init\", \"--\"]` and `CMD [\"node\", \"dist/main.js\"]`, enabling immediate SIGTERM reception and graceful drain of active connections."
    }
  },
  {
    id: "layers-and-caching",
    name: "3. Layers and Caching",
    subtitle: "Content-Addressable Hashing & Cache Invalidation",
    category: "Build & Cache",
    mentalModel: "Every `RUN`, `COPY`, and `ADD` line creates a new read-only filesystem layer identified by its content SHA256. If a layer's checksum and command match the cache, Docker reuses the existing layer snapshot. If any layer invalidates, EVERY subsequent layer must rebuild from scratch.",
    coreMechanism: "For `COPY` and `ADD`, BuildKit computes a checksum of the files on the host context. For `RUN`, it compares the literal command string against cached layers. Once a cache miss occurs, the build pipeline drops the cache and executes every following instruction in real-time.",
    keySyntax: [
      {
        label: "Anti-Pattern vs Cache-Optimized Order",
        code: `# ❌ ANTI-PATTERN: Invalidates cache on every single line of code edit
COPY . .
RUN npm install
RUN npm run build

# ✅ OPTIMIZED: Cache invalidates ONLY when dependencies change
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src/ ./src/
RUN pnpm run build`,
        explanation: "Separating package manifests from source files prevents downloading 400MB of node_modules every time a developer changes a single CSS class or comment."
      }
    ],
    productionCommands: [
      { cmd: "docker build --build-arg BUILDKIT_INLINE_CACHE=1 -t myrepo/app:latest .", desc: "Embed build cache metadata directly into the image to allow remote CI builders to reuse layers", level: "write" },
      { cmd: "docker build --cache-from myrepo/app:cache -t myrepo/app:latest .", desc: "Pull remote cache from external registry to avoid rebuilding static dependencies in CI pipelines", level: "read" },
      { cmd: "docker system df -v", desc: "Detailed breakdown of disk usage by image layers, build cache, and containers", level: "read" }
    ],
    productionRules: [
      "Combine consecutive RUN commands installing packages: `apt-get update && apt-get install -y pkg && rm -rf /var/lib/apt/lists/*` to keep the apt index out of the committed layer.",
      "Always configure a tight `.dockerignore` file: omitting `.git`, `node_modules`, and `dist` will bust build cache unexpectedly on local branch switches."
    ],
    failureModes: [
      {
        pitfall: "Running `apt-get update` on its own line followed by `apt-get install` on a subsequent line",
        impact: "`apt-get update` is cached permanently. When you later add a new package to `apt-get install`, Docker uses stale package lists, failing with 404 Not Found on outdated mirror repos.",
        resolution: "Always combine package manager update, install, and cache cleanup into a single atomic `RUN` instruction."
      }
    ],
    realWorldScenario: {
      title: "The 45-Minute CI Pipeline Caused by `.git` Cache Poisoning",
      situation: "A team's GitHub Actions build time skyrocketed from 2 minutes to 42 minutes for every pull request.",
      investigation: "The Dockerfile executed `COPY . .` before building Go binaries. Because `.git` was not ignored, every new commit hash altered the checksum of the copied directory, busting the cache on `RUN go mod download`.",
      fix: "Added `.git`, `.github`, and `test/` to `.dockerignore` and copied `go.mod` / `go.sum` independently before copying source files."
    }
  },
  {
    id: "multi-stage-build",
    name: "4. Multi-Stage Build",
    subtitle: "Ephemeral Compiler Enclosures & Lean Runtime Artifacts",
    category: "Build & Cache",
    mentalModel: "Multi-stage builds allow you to use distinct, disposable `FROM` stages for compilation, dependency vendoring, and security scanning, before copying only the compiled production binary into a stripped-down, minimal runtime stage.",
    coreMechanism: "BuildKit treats each stage as an isolated target in its dependency graph. Unreferenced intermediate stages (e.g., test runners or compiler SDKs) are automatically pruned from the final exported container image, stripping compilers, headers, and build tools like gcc, git, and python.",
    keySyntax: [
      {
        label: "Production Next.js Multi-Stage Dockerfile",
        code: `# Stage 1: Dependency resolution
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# Stage 2: Source compilation
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm build

# Stage 3: Lean production runtime (< 140MB vs 1.4GB)
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]`,
        explanation: "The compiler toolchains and node_modules remain trapped in intermediate stages; only standalone bundled output reaches the runner image."
      }
    ],
    productionCommands: [
      { cmd: "docker build --target builder -t myapp:dev .", desc: "Build only up to a specific intermediate stage (e.g. for running unit tests in CI)", level: "read" },
      { cmd: "docker image inspect myapp:latest --format '{{.Size}}'", desc: "Verify final image byte footprint after multi-stage compilation", level: "read" }
    ],
    productionRules: [
      "Never leave package managers, compilers (gcc, tsc, cargo), or test fixtures in the final production stage.",
      "Assign explicit names to every build stage (`FROM ... AS builder`) and copy strictly by name (`COPY --from=builder`)."
    ],
    failureModes: [
      {
        pitfall: "Copying all node_modules from the dev/build stage directly into the final stage",
        impact: "Image explodes in size (often > 1.2GB) and bundles dangerous devDependencies like TypeScript compilers, linters, and vulnerable testing libraries into production.",
        resolution: "Use framework standalone bundling (e.g., Next.js standalone output) or run `pnpm prune --prod` before copying."
      }
    ],
    realWorldScenario: {
      title: "Leaked SSH Deploy Keys in Production Image Layers",
      situation: "A security vulnerability assessment discovered a company's private GitHub deploy key inside their production Docker image on Docker Hub.",
      investigation: "The developer ran `COPY id_rsa /root/.ssh/` to clone a private repo, followed by `RUN rm -f /root/.ssh/id_rsa`. While the file was deleted in the upper layer, it remained permanently accessible in the historical underlying layer.",
      fix: "Switched to BuildKit SSH secret mounts (`RUN --mount=type=ssh git clone ...`) and multi-stage builds, ensuring SSH credentials never touch an image layer."
    }
  },
  {
    id: "docker-compose",
    name: "5. Docker Compose",
    subtitle: "Multi-Container Local Topology & Declarative Orchestration",
    category: "Lifecycle & Health",
    mentalModel: "Docker Compose is a declarative tool for defining and running multi-container Docker applications. A single YAML file defines service containers, software-defined networks, persistent volumes, environment configs, and startup dependency orders.",
    coreMechanism: "Compose evaluates `compose.yaml`, creates a default isolated bridge network named `<project>_default`, configures DNS resolution using service names as hostnames, instantiates declared named volumes, and executes container creation commands sequentially according to `depends_on` conditions.",
    keySyntax: [
      {
        label: "Production-Grade Compose Specification",
        code: `services:
  web:
    build:
      context: .
      target: runner
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:secret@db:5432/core
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: core
      POSTGRES_PASSWORD: secret
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:`,
        explanation: "Using `condition: service_healthy` guarantees that the web service will not boot until PostgreSQL has actually completed initialization and is accepting TCP connections."
      }
    ],
    productionCommands: [
      { cmd: "docker compose up -d --build", desc: "Rebuild out-of-date images and start all services detached in the background", level: "write" },
      { cmd: "docker compose ps --all", desc: "List all services, exit codes, health status, and mapped host ports", level: "read" },
      { cmd: "docker compose logs -f --tail=100 web", desc: "Tail the real-time logs of a specific service with a back-buffer of 100 lines", level: "read" },
      { cmd: "docker compose down -v", desc: "HAZARDOUS: Stop all containers, tear down networks, and delete all attached named volumes", level: "hazardous" }
    ],
    productionRules: [
      "Never use bare `depends_on: [\"db\"]` without a healthcheck condition: Docker will start the web container when the DB container launches, which is seconds before the DB accepts socket connections.",
      "Keep local developer environment overrides separated cleanly using `docker-compose.yml` and `docker-compose.override.yml`."
    ],
    failureModes: [
      {
        pitfall: "Accidentally running `docker compose down -v` on a staging or single-node production server",
        impact: "The `-v` flag violently wipes all declared named volumes (`pgdata`), erasing the entire PostgreSQL database permanently.",
        resolution: "Enforce permissions, create automated volume snapshots, and remove `-v` from deployment scripts."
      }
    ],
    realWorldScenario: {
      title: "The Boot-Crash Loop from Asynchronous Database Initialization",
      situation: "Every time developers ran `docker compose up`, the Node.js API crashed with `ECONNREFUSED 127.0.0.1:5432` and exited.",
      investigation: "The API container booted in 400ms, while PostgreSQL took 3.2 seconds to run its initial entrypoint scripts and bind to port 5432. The plain `depends_on` only waited for process start, not readiness.",
      fix: "Added a `pg_isready` healthcheck to the `db` service and configured `depends_on: db: condition: service_healthy` on the API service."
    }
  },
  {
    id: "volumes",
    name: "6. Volumes",
    subtitle: "Engine-Managed Persistent Host Storage",
    category: "Storage & Volumes",
    mentalModel: "Volumes are engine-managed directories stored on the host filesystem (`/var/lib/docker/volumes/` on Linux) completely decoupled from the container lifecycle. When a container dies, its volumes remain 100% intact.",
    coreMechanism: "Docker mounts a directory managed by the Docker storage driver directly into the container's mount namespace (`MNT`). Writes to a volume completely bypass the Overlay2 Copy-on-Write layer, delivering native disk I/O throughput directly to host storage.",
    keySyntax: [
      {
        label: "Named Volume vs Ephemeral Container Storage",
        code: `# Create a dedicated named volume with custom label
docker volume create --name pg_prod_data

# Mount to container:
docker run -d \\
  --name db \\
  -v pg_prod_data:/var/lib/postgresql/data:rw \\
  postgres:16-alpine

# Inspect host mountpoint:
docker volume inspect pg_prod_data
# Returns Mountpoint: "/var/lib/docker/volumes/pg_prod_data/_data"`,
        explanation: "Volumes are managed exclusively by Docker daemon permissions, keeping databases safe from accidental host file permission modifications."
      }
    ],
    productionCommands: [
      { cmd: "docker volume ls", desc: "List all managed persistent volumes on the current Docker host", level: "read" },
      { cmd: "docker volume inspect <volume_name>", desc: "Display the underlying absolute host filesystem path and driver options", level: "read" },
      { cmd: "docker volume prune", desc: "HAZARDOUS: Delete all unattached volumes not currently referenced by any container", level: "hazardous" }
    ],
    productionRules: [
      "Always use named volumes for databases (PostgreSQL, MySQL, Redis, MongoDB); never run database engines on the CoW filesystem.",
      "Be careful with `docker volume prune`: if a database container is temporarily stopped for maintenance, its volume is considered 'unattached' and will be permanently deleted."
    ],
    failureModes: [
      {
        pitfall: "Running `docker volume prune -f` during an automated nightly cleanup cron job",
        impact: "Any container stopped for rolling upgrades or backups loses its database volume instantly, resulting in catastrophic catastrophic data loss.",
        resolution: "Never run blind volume pruning in production. Tag volumes with metadata labels and use explicit volume deletion scripts."
      }
    ],
    realWorldScenario: {
      title: "The 80% Database Performance Penalty on Overlay2",
      situation: "A PostgreSQL database deployed in Docker exhibited abysmal write throughput (maxing out at 350 transactions/sec on NVMe drives).",
      investigation: "The developer had neglected to specify a volume mount. Every write to the database was traversing the Docker Overlay2 storage driver CoW copy mechanism, incurring massive CPU and memory lock overhead.",
      fix: "Attached a dedicated named volume `-v pg_data:/var/lib/postgresql/data`. Throughput jumped to 4,800 transactions/sec immediately."
    }
  },
  {
    id: "bind-mounts",
    name: "7. Bind Mounts",
    subtitle: "Direct Host Directory Passthrough & Hot Reloading",
    category: "Storage & Volumes",
    mentalModel: "A Bind Mount maps an exact, arbitrary file or directory on the host machine directly into the container filesystem (`host_path:container_path`). It does not rely on Docker's managed storage directory.",
    coreMechanism: "The Linux kernel mounts the host VFS node directly into the container's mount namespace. File permission checks (`chmod`, `chown`) mirror host UID/GID values. Any change on the host is instantly visible to the container and vice-versa, making it ideal for local source-code hot reload.",
    keySyntax: [
      {
        label: "Bind Mounts in Development vs Production",
        code: `# Local Development: Hot reload source code
services:
  web:
    image: node:20-alpine
    volumes:
      - ./src:/app/src:ro             # Read-only bind mount for security
      - ./package.json:/app/package.json
      - /app/node_modules             # Anonymous volume to preserve Linux binaries

# Single File Config Injection in Production:
docker run -d \\
  -v /etc/ssl/certs/api.crt:/certs/api.crt:ro \\
  nginx:alpine`,
        explanation: "Flagging bind mounts with `:ro` (read-only) prevents a compromised container process from modifying host configuration files or source code."
      }
    ],
    productionCommands: [
      { cmd: "docker run -it -v $(pwd):/workspace:ro alpine sh", desc: "Launch ephemeral shell with current host directory mounted as read-only workspace", level: "read" },
      { cmd: "docker inspect <container> --format '{{json .Mounts}}'", desc: "Inspect all active volume and bind mount specifications on a running container", level: "read" }
    ],
    productionRules: [
      "Never bind mount sensitive host directories (`/`, `/etc`, `/var/run/docker.sock`, `/proc`) into untrusted web application containers.",
      "Beware of file permissions on Linux hosts: files generated by a container running as root will be owned by root on the developer's host machine."
    ],
    failureModes: [
      {
        pitfall: "Bind-mounting the developer's entire project root (`.:/app`) on Windows/macOS without isolating `node_modules`",
        impact: "Host architecture binaries (e.g. Darwin ARM64) overwrite Linux x86_64 binaries in `node_modules`, causing `Error: Cannot find module` or native C++ addon segfaults.",
        resolution: "Mount an anonymous volume over `/app/node_modules` in docker-compose: `- /app/node_modules`."
      }
    ],
    realWorldScenario: {
      title: "Host File Hijack via Read-Write Bind Mount",
      situation: "A vulnerable Node.js application suffered a Path Traversal vulnerability (`../../`).",
      investigation: "Because the container had `-v /srv/app:/app:rw`, the attacker uploaded a malicious script that traversed into the host application directory and replaced the production entrypoint on the host filesystem.",
      fix: "Mounted application code as `:ro` (read-only) and directed all uploads to an isolated S3 bucket."
    }
  },
  {
    id: "networks",
    name: "8. Networks",
    subtitle: "Software-Defined Isolation: Bridge, Host, Overlay, None",
    category: "Networking & Ingress",
    mentalModel: "Docker networks create virtual software switches that connect containers. By default, containers exist on isolated bridge networks, reachable only by explicit port mappings or internal DNS names.",
    coreMechanism: "Docker utilizes Linux network namespaces, `veth` pairs, and `iptables` NAT tables. On a bridge network, each container receives a private IP (e.g. `172.18.0.4`) and an internal DNS resolver at `127.0.0.11`. On `--network host`, the container shares the host's raw network namespace with zero isolation. Overlay networks span multiple hosts using VXLAN tunnels.",
    keySyntax: [
      {
        label: "Docker Network Modes",
        code: `# 1. User-Defined Bridge (Automatic Internal DNS Resolution)
docker network create --driver bridge app-net
docker run -d --net app-net --name api backend-image
docker run -d --net app-net --name web frontend-image # "web" can reach "http://api:8080"

# 2. Host Network (Zero NAT overhead, shares host ports directly)
docker run -d --network host nginx:alpine

# 3. None (Complete network air-gap isolation)
docker run -d --network none crypto-signer`,
        explanation: "The default `bridge` network does NOT provide automatic service DNS discovery. You MUST create a custom user-defined bridge network to enable DNS resolution by container name."
      }
    ],
    productionCommands: [
      { cmd: "docker network ls", desc: "List all local software-defined networks and their drivers", level: "read" },
      { cmd: "docker network inspect <net_name>", desc: "Display connected containers, their internal IP addresses, and gateway subnet", level: "read" },
      { cmd: "docker network connect <net_name> <container>", desc: "Dynamically attach a running container to a secondary network interface", level: "write" }
    ],
    productionRules: [
      "Never deploy multi-container systems on the default `bridge` network: create user-defined networks to enable automatic service-name DNS resolution.",
      "Isolate backend tiers: databases should reside on a private internal network with no external ingress, reachable only by the API service."
    ],
    failureModes: [
      {
        pitfall: "Deploying two services on the default bridge network and attempting to connect via `http://backend:8080`",
        impact: "Connection fails with `getaddrinfo ENOTFOUND backend` because Docker disables embedded DNS on the default bridge.",
        resolution: "Create a named network `docker network create my-net` and attach both containers."
      }
    ],
    realWorldScenario: {
      title: "Port Conflict Panic on `--network host`",
      situation: "An engineer switched all microservices to `--network host` to 'improve performance'.",
      investigation: "Two microservices bound to port 8080 crashed immediately with `EADDRINUSE`. Furthermore, the internal Redis cache was unintentionally exposed to the public Internet on `0.0.0.0:6379`.",
      fix: "Restored isolated bridge networks with explicit reverse-proxy ingress and internal DNS routing."
    }
  },
  {
    id: "port-mapping",
    name: "9. Port Mapping",
    subtitle: "Host Ingress DNAT vs Internal EXPOSE Metadata",
    category: "Networking & Ingress",
    mentalModel: "`EXPOSE` in a Dockerfile is merely documentation for human operators. `-p host_port:container_port` is an active kernel `iptables` DNAT rule that routes external traffic from the host network into the container's private interface.",
    coreMechanism: "When `-p 8080:80` is specified, Docker manipulates the Linux `PREROUTING` and `DOCKER` iptables chains. Packets arriving at the host on port 8080 are rewritten (DNAT) to the container's internal IP (e.g., `172.17.0.2:80`). Docker binds to `0.0.0.0` by default, which dangerously bypasses standard UFW/firewall rules on Linux hosts.",
    keySyntax: [
      {
        label: "Secure Port Binding Syntax",
        code: `# ❌ DANGEROUS: Binds to 0.0.0.0 on all public interfaces (bypasses UFW!)
docker run -p 5432:5432 postgres

# ✅ SECURE: Binds exclusively to host loopback interface (localhost only)
docker run -p 127.0.0.1:5432:5432 postgres

# Specific Host Interface Binding:
docker run -p 10.0.0.15:80:8080 nginx`,
        explanation: "Specifying `127.0.0.1:5432:5432` prevents external Internet scanners from connecting to internal database ports."
      }
    ],
    productionCommands: [
      { cmd: "docker port <container_id>", desc: "Display all active public-to-private port translations for a container", level: "read" },
      { cmd: "iptables -t nat -L DOCKER -n -v", desc: "Inspect low-level Linux kernel DNAT packet translation rules created by Docker", level: "read" }
    ],
    productionRules: [
      "Never publish database or cache ports to `0.0.0.0`: bind exclusively to `127.0.0.1` or rely strictly on internal Docker networks without port publishing.",
      "Remember that Docker bypasses standard UFW (Uncomplicated Firewall) rules on Ubuntu because it injects rules before UFW in the `PREROUTING` table."
    ],
    failureModes: [
      {
        pitfall: "Publishing Redis with `-p 6379:6379` assuming UFW will block external traffic",
        impact: "Docker inserts iptables rules before UFW. Shodan and automated bots connect directly to Redis, install crypto-miners, and exfiltrate data.",
        resolution: "Bind to localhost `-p 127.0.0.1:6379:6379` or configure Docker with `--iptables=false` / DOCKER-USER chain."
      }
    ],
    realWorldScenario: {
      title: "Ransomware Wipeout of an Unprotected Elasticsearch Cluster",
      situation: "A company's production Elasticsearch cluster was wiped clean overnight and replaced with a ransom note.",
      investigation: "The container was started with `-p 9200:9200`. The sysadmin had enabled UFW to allow only port 443, but Docker's NAT rules routed port 9200 around UFW directly from the public Internet.",
      fix: "Bound Elasticsearch exclusively to internal Docker networks and removed the `-p` host port publication."
    }
  },
  {
    id: "environment-variables",
    name: "10. Environment Variables",
    subtitle: "Configuration Injection: Build-Args vs Runtime Envs",
    category: "Lifecycle & Health",
    mentalModel: "Build-args (`ARG`) exist strictly during image construction and are permanently baked into layer metadata. Environment variables (`ENV` / `-e` / `env_file`) are injected dynamically into the container process table at runtime.",
    coreMechanism: "BuildKit evaluates `ARG` during `docker build --build-arg`. When a container runs, the engine populates the process environment (`/proc/1/environ`) with variables declared in `docker run -e` or `env_file`. Secret envs should never be committed to Dockerfiles.",
    keySyntax: [
      {
        label: "ARG vs ENV Lifecycle Matrix",
        code: `# Dockerfile:
ARG APP_VERSION=1.0.0     # Available ONLY during build time
ENV NODE_ENV=production   # Baked into image; default for runtime

# Runtime override:
docker run -d \\
  --env-file .env.production \\
  -e DATABASE_URL="postgres://..." \\
  myapp:latest`,
        explanation: "Never pass production database passwords or API keys as ARG: they are saved as plain text in the image history inspect output."
      }
    ],
    productionCommands: [
      { cmd: "docker exec <container> env", desc: "Display all active environment variables inside the living container process", level: "read" },
      { cmd: "docker inspect <image_name> --format '{{json .Config.Env}}'", desc: "Inspect default static environment variables baked into the image metadata", level: "read" }
    ],
    productionRules: [
      "Never put secrets (passwords, JWT secrets, private keys) in `ARG` or `ENV` in a Dockerfile: use Docker secrets or runtime environment files.",
      "Always exclude `.env*` files in your `.dockerignore` to prevent accidental inclusion in the image build context."
    ],
    failureModes: [
      {
        pitfall: "Passing AWS access keys via `ARG AWS_SECRET_KEY` during `docker build`",
        impact: "Anyone with read access to the image can run `docker history --no-trunc` and read the plaintext AWS secret key.",
        resolution: "Use BuildKit secrets mount: `RUN --mount=type=secret,id=aws_creds ...`."
      }
    ],
    realWorldScenario: {
      title: "Hardcoded Staging URL Leaked to Production",
      situation: "A mobile API began directing production user logins to an internal staging server after a Friday deployment.",
      investigation: "The Dockerfile contained `ENV API_URL=https://staging.internal`. The production deployment script forgot to pass `-e API_URL=https://api.domain.com`, so the container fell back to the baked-in default.",
      fix: "Removed default environment values from the Dockerfile and mandated startup validation scripts that crash the container immediately if required env vars are omitted."
    }
  },
  {
    id: "healthcheck",
    name: "11. Healthcheck",
    subtitle: "Application Liveness & Automatic Engine Self-Healing",
    category: "Lifecycle & Health",
    mentalModel: "A process may be running in Linux while completely frozen (deadlocked, out of DB connections, or trapped in an infinite loop). A Healthcheck executes an internal probe to verify actual operational liveness.",
    coreMechanism: "The Docker daemon executes the declared command inside the container namespace at regular intervals. It tracks the return code (0: healthy, 1: unhealthy, 2: reserved). If probes fail `retries` times consecutively, the container status transitions from `healthy` to `unhealthy`, alerting orchestrators.",
    keySyntax: [
      {
        label: "Dockerfile & Compose Healthcheck Directives",
        code: `# In Dockerfile:
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# In Docker Compose:
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
  interval: 10s
  timeout: 3s
  retries: 3
  start_period: 15s`,
        explanation: "`start_period` provides an initialization bootstrap window during which failing probes do not count against the retry threshold."
      }
    ],
    productionCommands: [
      { cmd: "docker inspect <container> --format '{{json .State.Health}}'", desc: "Inspect health check exit codes, failure count, and raw command output", level: "read" },
      { cmd: "docker ps --filter 'health=unhealthy'", desc: "Query and list all containers on the host that are currently failing health probes", level: "read" }
    ],
    productionRules: [
      "Keep healthcheck endpoints lightweight: do not run heavy database queries or external API calls inside a 10-second health probe.",
      "Ensure utility binaries (`curl` or `wget`) are present in the image if used in the healthcheck, or use native language probe scripts (e.g. `node healthcheck.js`)."
    ],
    failureModes: [
      {
        pitfall: "Executing `SELECT COUNT(*) FROM users` inside an SQL healthcheck every 5 seconds",
        impact: "Under heavy load, the healthcheck query competes for table locks, times out, marks the database unhealthy, and triggers an infinite restart cascade.",
        resolution: "Use a dedicated lightweight probe such as `SELECT 1` or `pg_isready`."
      }
    ],
    realWorldScenario: {
      title: "Zombie Node.js Event Loop Hangs Silently for 14 Hours",
      situation: "An API container stopped responding to incoming HTTP traffic, returning 504 gateway timeouts, but `docker ps` reported status `Up 4 days`.",
      investigation: "The Node.js event loop had deadlocked on a regex catastrophic backtracking bug. Because the process had not exited, Docker did not restart it.",
      fix: "Implemented an HTTP `/health` probe with `autoheal` container supervisor to automatically restart containers when health transitions to `unhealthy`."
    }
  },
  {
    id: "registries",
    name: "12. Registries",
    subtitle: "Artifact Distribution: Docker Hub, GHCR, AWS ECR",
    category: "Security & Production",
    mentalModel: "A Container Registry is a content-addressable storage service that hosts and distributes OCI-compliant image manifests, layer tarballs, and cryptographic signatures.",
    coreMechanism: "When you execute `docker push`, the engine queries the registry API (v2 specification). It uploads only the missing layer blobs (deduplicating across images) and commits the signed JSON manifest pointing to those layer digests. Authentication uses bearer tokens stored locally in `~/.docker/config.json`.",
    keySyntax: [
      {
        label: "Registry Operations & Multi-Architecture Target",
        code: `# Authenticate to GitHub Container Registry (GHCR)
echo $GH_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag image to target registry
docker tag myapp:1.0.0 ghcr.io/org/myapp:1.0.0

# Push multi-arch (ARM64 + AMD64) manifest
docker buildx build --platform linux/amd64,linux/arm64 \\
  -t ghcr.io/org/myapp:1.0.0 --push .`,
        explanation: "Buildx compiles cross-platform images and pushes an OCI Index manifest linking ARM64 (Apple Silicon, AWS Graviton) and AMD64 (x86_64) binaries."
      }
    ],
    productionCommands: [
      { cmd: "docker login <registry_url>", desc: "Authenticate host daemon to private OCI registry via secure stdin token", level: "write" },
      { cmd: "docker pull <image>@sha256:<digest>", desc: "Pull an image by its immutable cryptographic SHA256 digest rather than a mutable tag", level: "read" },
      { cmd: "docker logout <registry_url>", desc: "Wipe cached credentials from ~/.docker/config.json", level: "write" }
    ],
    productionRules: [
      "Never store plain text passwords in `~/.docker/config.json`: use credential helpers (`docker-credential-osxkeychain`, `pass`, or `secretservice`).",
      "Always configure registry retention policies to automatically prune untagged image manifests and keep storage costs bounded."
    ],
    failureModes: [
      {
        pitfall: "Committing `~/.docker/config.json` containing base64 registry auth strings to a public Git repo",
        impact: "Attackers gain write access to your production container registry and inject malware or backdoors into your production images.",
        resolution: "Use ephemeral short-lived IAM roles (e.g. AWS ECR login via `aws ecr get-login-password`) and enforce MFA."
      }
    ],
    realWorldScenario: {
      title: "Docker Hub Anonymous Rate Limiting Blocks Production Autoscaler",
      situation: "During Black Friday traffic, an AWS auto-scaling group failed to launch new instances with `toomanyrequests: You have reached your unauthenticated pull rate limit`.",
      investigation: "The Kubernetes deployment was pulling `node:20-alpine` directly from Docker Hub without credentials. Docker Hub enforced a 100 pulls per 6 hours limit on unauthenticated AWS public IPs.",
      fix: "Mirrored all base images to a private AWS ECR registry and configured production deployments to pull strictly from internal infrastructure."
    }
  },
  {
    id: "image-tagging",
    name: "13. Image Tagging & Triggers",
    subtitle: "SemVer vs Git SHA vs Immutable Content Digests",
    category: "Security & Production",
    mentalModel: "Image tags (like `:latest` or `:1.0.0`) are mutable pointers that can be moved at any time. Content Digests (`@sha256:...`) are cryptographically immutable hashes of the image manifest. If you care about reproducibility, never trust mutable tags in production.",
    coreMechanism: "A tag is merely an alias in the registry manifest list. When someone pushes with an existing tag, the pointer moves to the new manifest. In contrast, the SHA256 digest is calculated from the byte stream of the manifest JSON; it is mathematically impossible to change the image contents without altering the digest.",
    keySyntax: [
      {
        label: "Production Tagging Strategy",
        code: `# ❌ ANTI-PATTERN: Mutable, non-deterministic, impossible to roll back safely
docker push myorg/api:latest

# ⚠️ ACCEPTABLE: Semantic Versioning (good for library consumers)
docker push myorg/api:v2.4.1

# ✅ RECOMMENDED: Git Commit SHA + Build Number
docker push myorg/api:git-7f8a92b-build-142

# 🔒 MAXIMUM PARANOIA: Pinning to Cryptographic Digest in Kubernetes
image: myorg/api@sha256:d512a875a6c38210359b...`,
        explanation: "Pinning by digest guarantees that every Kubernetes worker node pulls the identical byte-for-byte image, even if someone overwrites the tag in the registry."
      }
    ],
    productionCommands: [
      { cmd: "docker images --digests", desc: "List local images showing their associated SHA256 cryptographic digests", level: "read" },
      { cmd: "docker manifest inspect <image>:<tag>", desc: "Inspect the remote registry manifest to check supported architectures and layer digests", level: "read" }
    ],
    productionRules: [
      "Banish `:latest` from all production deployment manifests, Kubernetes YAMLs, and Docker Compose files.",
      "Tag production images with the short Git commit SHA (`git rev-parse --short HEAD`) to maintain an unbroken audit trail from running container to source code."
    ],
    failureModes: [
      {
        pitfall: "Deploying `image: backend:latest` across a 20-node Kubernetes cluster",
        impact: "Half the nodes have the old cached `latest`, while newly scaled nodes pull the new `latest`, resulting in a split-brain production system running two different codebases concurrently.",
        resolution: "Enforce immutable tags based on commit SHAs and set `imagePullPolicy: IfNotPresent`."
      }
    ],
    realWorldScenario: {
      title: "The Split-Brain Database Migration from `:latest` Tag Mutation",
      situation: "Users reported intermittent 500 errors. 3 out of 10 API pods were crashing with SQL missing column errors.",
      investigation: "A developer pushed an updated image with the tag `:latest`. Newly spawned autoscaling pods pulled the new code (expecting the new schema), while older pods were still running code that was incompatible.",
      fix: "Banned the `:latest` tag in CI/CD pipeline linters and mandated Git commit SHA tagging."
    }
  },
  {
    id: "slim-images",
    name: "14. Slim Images",
    subtitle: "Alpine vs Distroless vs Debian-Slim Trade-Offs",
    category: "Build & Cache",
    mentalModel: "Smaller images reduce network transfer times, speed up autoscaling spin-up latency, and drastically shrink the attack surface by eliminating unnecessary binaries (like curl, bash, python, or gcc) that attackers exploit during container escape attacks.",
    coreMechanism: "Alpine uses `musl libc` and `busybox` (~5MB base). Debian-slim uses `glibc` with pruned packages (~50MB). Google Distroless contains strictly the runtime (e.g., node or java) and glibc dependencies with zero package managers, shells, or coreutils (~25MB).",
    keySyntax: [
      {
        label: "Image Footprint & Security Comparison",
        code: `# 1. Ubuntu Full: 220MB (Full OS, shell, python, apt, high CVE count)
FROM ubuntu:22.04

# 2. Debian Slim: 75MB (glibc, apt, shell, full POSIX compatibility)
FROM debian:bookworm-slim

# 3. Alpine: 7MB (musl libc, busybox, apk; beware of C-bindings in Node/Python)
FROM alpine:3.19

# 4. Distroless: 25MB (NO SHELL, NO PACKAGE MANAGER, minimum attack surface)
FROM gcr.io/distroless/nodejs20-debian12
COPY --from=builder /app /app
CMD ["server.js"]`,
        explanation: "Distroless images have no `/bin/sh`. Even if an attacker achieves Remote Code Execution (RCE) in your app, they cannot spawn a reverse shell or download tools using curl."
      }
    ],
    productionCommands: [
      { cmd: "docker images --format 'table {{.Repository}}\\t{{.Tag}}\\t{{.Size}}'", desc: "Compare image sizes across different base distribution choices", level: "read" },
      { cmd: "docker run --rm -it alpine:latest sh", desc: "Launch minimal Alpine shell to test package availability and behavior", level: "read" }
    ],
    productionRules: [
      "Use Debian-slim when your application depends on complex native C/C++ bindings (Prisma, Sharp, NumPy) to avoid musl libc memory allocator bugs.",
      "Use Distroless for high-security production microservices where interactive shell access is forbidden by compliance standards."
    ],
    failureModes: [
      {
        pitfall: "Using Alpine Linux with Node.js/Prisma in high-concurrency microservices",
        impact: "Alpine's musl libc memory allocator exhibits severe performance degradation and memory fragmentation under high multithreaded loads compared to glibc.",
        resolution: "Switch from `node:alpine` to `node:bookworm-slim` for predictable memory performance."
      }
    ],
    realWorldScenario: {
      title: "Alpine musl DNS Query Timeout Cripples Microservices",
      situation: "An API experiencing 2,000 req/sec began dropping 15% of outgoing requests to an internal auth service with DNS timeout errors.",
      investigation: "Alpine's musl libc does not support parallel DNS lookups and handles `resolv.conf` timeouts differently than glibc, triggering intermittent 5-second DNS delays on Kubernetes.",
      fix: "Migrated the base image to `node:20-bookworm-slim`, instantly eliminating DNS query latency spikes."
    }
  },
  {
    id: "security-scanning",
    name: "15. Security Scanning",
    subtitle: "CVE Detection, Non-Root Users & Read-Only Rootfs",
    category: "Security & Production",
    mentalModel: "By default, a container runs as `root` (UID 0). If an application vulnerability allows an attacker to break out of the container namespace, they possess root privileges on the host kernel. Security hardening enforces non-root execution, vulnerability scanning, and immutable filesystems.",
    coreMechanism: "The `USER 10001:10001` directive drops root capabilities (`CAP_SYS_ADMIN`, `CAP_NET_ADMIN`). Trivy or Docker Scout scans the image manifest against the National Vulnerability Database (NVD). Running with `--read-only` prevents malware from writing executable payloads to `/tmp` or `/bin`.",
    keySyntax: [
      {
        label: "Production Hardening Directives",
        code: `# Dockerfile Security Checklist:
# 1. Run as unprivileged system user
RUN groupadd -g 10001 appgroup && \\
    useradd -u 10001 -g appgroup -s /sbin/nologin appuser
USER 10001:10001

# Runtime Security Lockdown:
docker run -d \\
  --security-opt=no-new-privileges:true \\
  --cap-drop=ALL \\
  --cap-add=NET_BIND_SERVICE \\
  --read-only \\
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \\
  myapp:hardened`,
        explanation: "`--cap-drop=ALL` strips all Linux kernel capabilities from the process, disabling raw sockets, chown, and root privilege escalation."
      }
    ],
    productionCommands: [
      { cmd: "docker scout cves <image_name>", desc: "Scan container image for Common Vulnerabilities and Exposures (CVEs) using Docker Scout", level: "read" },
      { cmd: "trivy image --severity HIGH,CRITICAL <image_name>", desc: "Audit image layers for high-severity OS and language dependency vulnerabilities", level: "read" },
      { cmd: "docker run --rm -it <image> id", desc: "Verify container execution UID and GID to confirm non-root enforcement", level: "read" }
    ],
    productionRules: [
      "Never run containers as root (UID 0) in production: declare `USER <uid>:<gid>` in the Dockerfile.",
      "Add `--security-opt=no-new-privileges:true` to prevent child processes from elevating privileges via setuid binaries."
    ],
    failureModes: [
      {
        pitfall: "Running a public-facing API container as default root with `--privileged` enabled",
        impact: "An attacker exploiting an RCE vulnerability gains full root access to the host machine, mounts the host root disk, and compromises the entire cluster.",
        resolution: "Run as non-root user and never use `--privileged` in production."
      }
    ],
    realWorldScenario: {
      title: "Container Breakout Prevented by Non-Root & Dropped Capabilities",
      situation: "An unpatched vulnerability in an image-processing library (ImageMagick) allowed arbitrary command execution via crafted image uploads.",
      investigation: "The attacker uploaded an exploit payload attempting to overwrite `/bin/sh` and install a persistent rootkit. Because the container ran as `USER 1001` with `--read-only`, the write failed with `Read-only file system` and the attack was neutralized.",
      fix: "The combination of read-only rootfs and dropped capabilities successfully prevented host compromise."
    }
  },
  {
    id: "resource-limits",
    name: "16. Resource Limits",
    subtitle: "Cgroup CPU Throttling & Out-Of-Memory (OOM) Termination",
    category: "Lifecycle & Health",
    mentalModel: "Unconstrained containers are 'noisy neighbors' that can consume 100% of host CPU and memory, causing the Linux kernel to crash or kill critical host daemons. Cgroups (control groups) enforce strict hardware ceilings.",
    coreMechanism: "Memory limits write to `/sys/fs/cgroup/memory.max`. When a container exceeds this threshold, the kernel's OOM Killer triggers and terminates the container with exit code 137. CPU limits (`--cpus=1.5`) write to `cpu.max` via Completely Fair Scheduler (CFS) quotas, throttling CPU cycles without killing the process.",
    keySyntax: [
      {
        label: "Resource Allocation Syntax",
        code: `# Docker CLI Limits:
docker run -d \\
  --name worker \\
  --memory="512m" \\
  --memory-reservation="256m" \\
  --memory-swap="512m" \\           # Disables swap; hard kill on 512MB
  --cpus="1.5" \\                   # Max 1.5 CPU cores
  myapp:latest

# Docker Compose Specification:
deploy:
  resources:
    limits:
      cpus: '2.0'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M`,
        explanation: "Setting `--memory-swap` equal to `--memory` prevents the container from thrashing host swap disk space when it runs out of RAM."
      }
    ],
    productionCommands: [
      { cmd: "docker stats --no-stream", desc: "Live snapshot of CPU %, memory usage, limit ceilings, and network I/O per container", level: "read" },
      { cmd: "docker inspect <container> --format '{{.State.OOMKilled}}'", desc: "Inspect whether a container was killed by the kernel Out-Of-Memory Killer", level: "read" }
    ],
    productionRules: [
      "Always set memory limits: a single memory leak in an unconstrained container will bring down the entire host operating system.",
      "Exit code 137 always indicates an abrupt termination by SIGKILL (128 + 9), most commonly an OOM kill due to exceeding cgroup memory limits."
    ],
    failureModes: [
      {
        pitfall: "Deploying a Node.js or Java app with a 512MB Docker memory limit without tuning runtime heap flags",
        impact: "The JVM or V8 engine sees 64GB of host RAM, allocates a 4GB heap, and is instantly terminated by the kernel with Exit Code 137.",
        resolution: "Set Node.js `--max-old-space-size=400` or use modern JVM flags (`-XX:+UseContainerSupport`)."
      }
    ],
    realWorldScenario: {
      title: "The Silent Node Exporter Death Caused by an Unbounded Memory Leak",
      situation: "An entire production Docker host stopped reporting Prometheus metrics and became unresponsive to SSH.",
      investigation: "A customer-facing analytics container had no memory limit. When a customer requested a massive CSV export, the container consumed 31GB of host RAM, triggering the Linux kernel OOM killer to terminate the `sshd` and `dockerd` host processes.",
      fix: "Configured mandatory memory limits (`--memory=2g`) across all containers in the cluster."
    }
  },
  {
    id: "container-logs",
    name: "17. Container Logs",
    subtitle: "STDOUT/STDERR Streams & Log Rotation Drivers",
    category: "Lifecycle & Health",
    mentalModel: "Applications in containers must never manage their own log files or rotate files on disk. They must write plain logs directly to STDOUT and STDERR. The Docker engine captures these streams via logging drivers and manages persistence.",
    coreMechanism: "The container process outputs to file descriptors 1 (stdout) and 2 (stderr). The container runtime multiplexes these streams into `/var/lib/docker/containers/<id>/<id>-json.log`. Without log rotation configured, these JSON log files grow unbounded until host storage is completely consumed.",
    keySyntax: [
      {
        label: "Production Log Driver & Rotation Configuration",
        code: `# In /etc/docker/daemon.json (Host-wide policy):
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "50m",
    "max-file": "3"
  }
}

# Per-Container Compose Configuration:
services:
  web:
    image: myapp:latest
    logging:
      driver: "json-file"
      options:
        max-size: "20m"
        max-file: "5"`,
        explanation: "Configuring `max-size` and `max-file` caps log storage per container to 100MB (5 x 20MB), automatically rotating and deleting old logs."
      }
    ],
    productionCommands: [
      { cmd: "docker logs -f --tail=50 --timestamps <container>", desc: "Stream live logs with timestamps and initial 50-line lookback buffer", level: "read" },
      { cmd: "docker logs <container> --since=15m", desc: "Filter container logs emitted within the last 15 minutes", level: "read" },
      { cmd: "truncate -s 0 /var/lib/docker/containers/*/*-json.log", desc: "HAZARDOUS: Instantly truncate bloated log files on an emergency full disk", level: "hazardous" }
    ],
    productionRules: [
      "Always write logs to `stdout`/`stderr`: never write logs to internal files inside the container filesystem.",
      "Always configure log rotation (`max-size` and `max-file`) in `daemon.json` on every production server."
    ],
    failureModes: [
      {
        pitfall: "Running Docker with default logging on a server for 6 months without `daemon.json` log rotation",
        impact: "A noisy debug-level service generates an 80GB `-json.log` file, filling the root partition and freezing all databases.",
        resolution: "Configure `max-size: 50m` and `max-file: 3` in `/etc/docker/daemon.json`."
      }
    ],
    realWorldScenario: {
      title: "Disk Fill 100% from Unrotated JSON Logs during DDoS Attack",
      situation: "During an HTTP flood attack, an Nginx reverse-proxy server crashed with zero disk space remaining.",
      investigation: "The access log was streaming to stdout, and Docker was writing every line to JSON disk without rotation. The log file reached 120GB in 4 hours.",
      fix: "Configured `max-size: 100m` with `max-file: 3` and integrated vector/fluentbit to ship logs off-host to a centralized logging cluster."
    }
  },
  {
    id: "exec-and-debugging",
    name: "18. Exec and Debugging",
    subtitle: "Live Namespace Inspection & Ephemeral Diagnostic Tools",
    category: "Foundations",
    mentalModel: "`docker exec` does not SSH into a container. It instructs the kernel to spawn a new process inside the exact existing namespaces (MNT, PID, NET) of the target running container.",
    coreMechanism: "The `runc exec` command uses the `setns()` Linux syscall to attach the calling terminal to the cgroups and namespaces of the container process. For slim or Distroless containers lacking `/bin/sh`, ephemeral debug containers or `nsenter` allow host-level inspection.",
    keySyntax: [
      {
        label: "Production Debugging Techniques",
        code: `# 1. Standard Interactive Shell
docker exec -it <container_id> /bin/sh

# 2. Execute command as root in an unprivileged container (emergencies)
docker exec -u 0 -it <container_id> id

# 3. Debugging a Distroless Container (No shell inside!)
# Use host nsenter to enter container network namespace:
PID=$(docker inspect -f '{{.State.Pid}}' <container_id>)
nsenter -t $PID -n tcpdump -i eth0 -nn port 80

# 4. Copy diagnostic files out of a crashed container
docker cp <container_id>:/app/heapdump.heapsnapshot ./`,
        explanation: "`nsenter` allows you to attach host tools (like tcpdump, strace, or ss) directly into the container's network namespace without installing anything inside the container."
      }
    ],
    productionCommands: [
      { cmd: "docker exec -it <container> /bin/sh", desc: "Open an interactive pseudo-TTY shell inside a running container", level: "read" },
      { cmd: "docker inspect <container>", desc: "Output complete low-level JSON configuration, network IPs, and state of a container", level: "read" },
      { cmd: "docker top <container>", desc: "Display running host processes associated with the container namespace", level: "read" }
    ],
    productionRules: [
      "Never install debugging tools (`curl`, `vim`, `net-tools`) into production images: use `nsenter` or ephemeral debugging sidecars.",
      "Do not leave long-running `docker exec` sessions open: they can consume file descriptors and mask zombie processes."
    ],
    failureModes: [
      {
        pitfall: "Running `apt-get install` inside a live production container via `docker exec` to debug an issue",
        impact: "Modifies the container RW layer, creating configuration drift. The next restart or deployment wipes the changes, making bug reproduction impossible.",
        resolution: "Debug via read-only inspection commands or reproduce inside an isolated staging environment."
      }
    ],
    realWorldScenario: {
      title: "Troubleshooting a Silent Network Drop in a Distroless Node App",
      situation: "A Distroless production container was failing outbound HTTPS calls, but had no shell, curl, or ping inside.",
      investigation: "The engineer extracted the container PID with `docker inspect -f '{{.State.Pid}}'`, then ran `nsenter -t $PID -n ss -tulpn`. The connection was hanging in `SYN_SENT` due to an expired egress firewall rule.",
      fix: "Updated the cloud security group rule without restarting the container or compromising its slim security architecture."
    }
  },
  {
    id: "rootless-containers",
    name: "19. Rootless Containers",
    subtitle: "User Namespaces & Unprivileged Daemon Operation",
    category: "Security & Production",
    mentalModel: "Standard Docker daemons run as root on the host. In Rootless mode, both the Docker daemon (`dockerd`) and the containers run inside a user namespace as an ordinary unprivileged host user.",
    coreMechanism: "Rootless Docker uses `newuidmap` and `newgidmap` to map a range of subordinate UIDs (e.g. UIDs 100000-165535 in `/etc/subuid`) to UID 0 inside the user namespace. Even if a process achieves a complete container breakout, it lands on the host as an unprivileged UID with zero root access to host devices or kernel modules.",
    keySyntax: [
      {
        label: "Rootless Architecture & Configuration",
        code: `# Inspect Subordinate UID allocations on host:
cat /etc/subuid
# Output: ubuntu:100000:65536

# Start Rootless Docker daemon for current user:
dockerd-rootless-setuptool.sh install

# Export user socket:
export DOCKER_HOST=unix:///run/user/1000/docker.sock

# Container process maps to UID 100000 on host:
docker run -d nginx:alpine
ps aux | grep nginx
# Host sees process owned by UID 100000, NOT root!`,
        explanation: "In rootless mode, UID 0 inside the container is cryptographically mapped to an unprivileged high UID on the host, nullifying container breakout exploits."
      }
    ],
    productionCommands: [
      { cmd: "docker info --format '{{.SecurityOptions}}'", desc: "Inspect whether rootless mode and user namespaces are active on the host daemon", level: "read" },
      { cmd: "dockerd-rootless-setuptool.sh check", desc: "Validate kernel dependencies and user namespace readiness for rootless operation", level: "read" }
    ],
    productionRules: [
      "Adopt rootless containers or Podman in shared multi-tenant enterprise environments where host root access is prohibited.",
      "Remember that rootless containers cannot bind to privileged host ports (< 1024) without configuring `sysctl net.ipv4.ip_unprivileged_port_start=80`."
    ],
    failureModes: [
      {
        pitfall: "Attempting to bind a rootless container to host port 80 or 443 without configuring kernel sysctls",
        impact: "Container crashes on startup with `bind: permission denied` because unprivileged users cannot bind ports below 1024.",
        resolution: "Bind to port 8080/8443 on the host, or run `sysctl -w net.ipv4.ip_unprivileged_port_start=80`."
      }
    ],
    realWorldScenario: {
      title: "Zero-Day Kernel Exploit Contained by User Namespaces",
      situation: "A zero-day Linux kernel privilege escalation exploit was executed inside a container via an unpatched graphics driver vulnerability.",
      investigation: "The attacker gained UID 0 inside the container, but because the daemon was running in rootless mode, the host kernel mapped this to UID 100000. When the exploit attempted to rewrite host `/etc/shadow`, the kernel returned `EACCES: Permission Denied`.",
      fix: "The host remained entirely uncompromised due to rootless isolation."
    }
  },
  {
    id: "best-practices",
    name: "20. Best Practices",
    subtitle: "The 10 Commandments of Production Containerization",
    category: "Security & Production",
    mentalModel: "Production containerization is governed by strict engineering discipline: 1 process per container, immutable infrastructure, graceful shutdown handling, deterministic builds, and minimal attack surfaces.",
    coreMechanism: "A production container adheres to the Single Responsibility Principle. It receives configuration from the environment, streams logs to stdout, runs unprivileged, initiates PID 1 signal supervisors (`tini`), and exits gracefully within 30 seconds upon receiving SIGTERM.",
    keySyntax: [
      {
        label: "The Production Checklist & Anti-Pattern Matrix",
        code: `# 1. Single Responsibility: 1 Process per container (Never run systemd, cron, & app together)
# 2. Immutable Infrastructure: Never modify containers live in production
# 3. Signal Handling: Use tini or dumb-init for PID 1 signal forwarding:
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]

# 4. Mandatory .dockerignore:
.git
node_modules
*.log
.env*
coverage/
dist/

# 5. Non-Root Execution: USER 1001:1001
# 6. Read-Only Root Filesystem: --read-only
# 7. Explicit Resource Ceilings: --memory and --cpus
# 8. Deterministic Build: Copy lockfiles & use --frozen-lockfile
# 9. Healthcheck with Start Period: Avoid flapping restarts
# 10. Immutable Tags: Git Commit SHA digests, NEVER :latest`,
        explanation: "Following these 10 rules ensures that containers operate deterministically across local development, staging environments, and high-concurrency cloud production clusters."
      }
    ],
    productionCommands: [
      { cmd: "docker run --init alpine sh", desc: "Launch container with Docker's built-in lightweight init process (tini) as PID 1", level: "read" },
      { cmd: "docker system prune --all --volumes -f", desc: "HAZARDOUS: Completely purge all unused containers, images, networks, and volumes", level: "hazardous" }
    ],
    productionRules: [
      "Never run more than one main service per container: do not bundle Nginx, Node.js, and Redis into a single monolithic Docker image.",
      "Always design containers to terminate cleanly within 10-30 seconds upon receiving SIGTERM."
    ],
    failureModes: [
      {
        pitfall: "Running a Node.js or Python app directly as PID 1 without an init system or proper signal handling",
        impact: "Zombie child processes (e.g. spawned child processes or database pools) accumulate in the process table, eventually exhausting host PID capacity and freezing the server.",
        resolution: "Use `ENTRYPOINT [\"/sbin/tini\", \"--\"]` or pass `--init` to `docker run`."
      }
    ],
    realWorldScenario: {
      title: "The Cascade Failure of a 3-in-1 Monolithic Container",
      situation: "A legacy company bundled Nginx, PHP-FPM, and Cron into a single Docker image using a custom bash startup script.",
      investigation: "When PHP-FPM crashed, the bash script kept running, so Docker considered the container healthy and continued routing traffic to Nginx, returning 502 Bad Gateway to 100% of customers.",
      fix: "Decoupled into 3 distinct, single-purpose containers in Docker Compose: an Nginx proxy container, a PHP-FPM worker container, and a dedicated Cron runner, each with independent healthchecks."
    }
  }
];

