# 18: DOCKER & CONTAINERIZATION ENGINEERING PLAYBOOK

> **The 20 Architectural Pillars of Production Container Engineering**  
> *From Linux Namespaces & Cgroups to Multi-Stage BuildKit DAGs, Rootless Isolation, and High-Concurrency OOM Survival.*

---

## Architecture Matrix: The 20 Pillars

| # | Pillar | Category | Primary Focus | Production Threat / Anti-Pattern |
|---|--------|----------|---------------|----------------------------------|
| **01** | **Image vs Containers** | Foundations | Immutable rootfs layers vs running namespace processes | Modifying container upperdir directly (ephemeral data loss) |
| **02** | **Dockerfile** | Foundations | Declarative instruction set for OCI images | Using shell form `CMD` (swallows SIGTERM, breaks graceful drain) |
| **03** | **Layers and Caching** | Build & Cache | Content-addressable SHA256 layer reusability | Busting cache by copying entire source directory before lockfile |
| **04** | **Multi-Stage Build** | Build & Cache | Ephemeral compiler stages & lean runtime targets | Bundling compilers, headers, and devDependencies into production |
| **05** | **Docker Compose** | Orchestration | Declarative local multi-container topology | Relying on unconditioned `depends_on` (race conditions on startup) |
| **06** | **Volumes** | Storage | Host engine-managed storage bypassing Overlay2 CoW | Running high-write databases directly on the CoW filesystem |
| **07** | **Bind Mounts** | Storage | Direct host filesystem passthrough | Mounting untrusted directories as read-write, risking host file overwrite |
| **08** | **Networks** | Networking | Isolated software-defined bridge/host/overlay | Default bridge without service DNS resolution |
| **09** | **Port Mapping** | Networking | Kernel iptables DNAT rules vs internal `EXPOSE` | Binding to `0.0.0.0` and bypassing host UFW firewall rules |
| **10** | **Environment Variables** | Lifecycle | `ARG` (build time) vs `ENV` (runtime process table) | Inadvertently baking API secrets into immutable image history via `ARG` |
| **11** | **Healthcheck** | Lifecycle | Liveness validation & automated restart triggers | Heavy healthcheck queries locking database tables every 5s |
| **12** | **Registries** | Security | OCI artifact distribution (Hub, GHCR, ECR) | Storing base64 registry auth tokens in plain text in git repos |
| **13** | **Image Tagging & Triggers** | Security | Git commit SHAs & SHA256 digests vs mutable `:latest` | Split-brain cluster deployments from mutable `:latest` tag overwrites |
| **14** | **Slim Images** | Build & Cache | Alpine vs Debian-slim vs Google Distroless | Alpine musl libc DNS query drops and memory fragmentation in Node/Go |
| **15** | **Security Scanning** | Security | CVE scanning, non-root users, `--read-only` rootfs | Running as UID 0 (root) enabling container breakout to host kernel |
| **16** | **Resource Limits** | Lifecycle | Cgroups memory ceilings & CFS CPU throttling | Unconstrained memory leaks triggering Linux kernel OOM host panic |
| **17** | **Container Logs** | Lifecycle | STDOUT/STDERR capture & json-file log rotation | Unbounded container log files consuming 100% of host disk storage |
| **18** | **Exec and Debugging** | Operations | Live `setns()` inspection & host `nsenter` sidecars | Installing debug packages via apt inside live production containers |
| **19** | **Rootless Containers** | Security | User namespaces (`userns-remap`) & UID mapping | Privilege escalation exploits inheriting host root permissions |
| **20** | **Best Practices** | Production Discipline | 1 process per container, `.dockerignore`, tini init | Zombie PID 1 leaks and multi-service monolithic failure cascades |

---

## Detailed Architectural Breakdown

### 1. Image vs Containers
- **Mental Model**: An Image is a frozen, read-only class blueprint comprised of stacked UnionFS rootfs layers. A Container is an instantiated running Linux process constrained by cgroups and isolated by kernel namespaces (`PID`, `NET`, `MNT`, `IPC`, `UTS`) with an ephemeral Read-Write (RW) upperdir mounted on top.
- **Under-the-Hood**: When executing `docker run`, dockerd triggers containerd/runc. It creates an Overlay2 mount combining lower read-only image layers with a new writable upperdir. Any file modified inside the container is copied up to this thin layer. When the container is destroyed (`docker rm`), the upperdir is purged permanently.
- **Production Rule**: Containers must be strictly ephemeral. If a container cannot be terminated at any moment without data loss, the design violates 12-factor architecture.

---

### 2. Dockerfile
- **Mental Model**: A declarative assembly recipe evaluated by BuildKit to create OCI artifacts. Instructions (`FROM`, `RUN`, `COPY`, `ENV`, `ENTRYPOINT`, `CMD`) form an execution DAG (Directed Acyclic Graph).
- **Under-the-Hood**: Always use the **exec JSON form** (`["node", "server.js"]`) instead of the shell form (`node server.js`). The shell form automatically prepends `/bin/sh -c`, turning the shell into PID 1. The shell drops incoming POSIX signals (`SIGTERM`), preventing your application from shutting down gracefully and draining active database connections.

---

### 3. Layers and Caching
- **Mental Model**: Each instruction (`RUN`, `COPY`, `ADD`) generates a content-addressable layer identified by its SHA256 digest. If a layer's checksum matches local cache, Docker reuses it. Once a cache miss occurs, all subsequent layers must rebuild from scratch.
- **Under-the-Hood**: Optimize layer order based on change frequency:
  1. Base operating system (`FROM node:20-bookworm-slim`)
  2. System libraries (`RUN apt-get update && apt-get install -y ...`)
  3. Package manifests (`COPY package.json pnpm-lock.yaml ./`)
  4. Dependency installation (`RUN pnpm install --frozen-lockfile`)
  5. Application source code (`COPY . .`)
  6. Build step (`RUN pnpm run build`)

---

### 4. Multi-Stage Build
- **Mental Model**: Isolate build dependencies, compiler toolchains (gcc, python, tsc), and secrets in temporary build stages. Copy only the minified, compiled production artifact into a clean, minimal runtime stage.
- **Under-the-Hood**: BuildKit prunes unreferenced intermediate stages from the final image manifest. This reduces image size from ~1.5GB down to <120MB, eliminating build tools and drastically shrinking the CVE attack surface.

---

### 5. Docker Compose
- **Mental Model**: Declarative orchestration for multi-container local environments. Creates software-defined networks, sets up internal DNS resolution using service names (e.g. `postgres://db:5432`), and mounts persistent volumes.
- **Under-the-Hood**: Never use bare `depends_on: ["db"]`. Process launch is not service readiness. Always combine with healthchecks:
  ```yaml
  depends_on:
    db:
      condition: service_healthy
  ```

---

### 6. Volumes
- **Mental Model**: Engine-managed persistent storage directories (`/var/lib/docker/volumes/<vol>/_data` on Linux) completely detached from the container lifecycle.
- **Under-the-Hood**: Volumes bypass the Overlay2 Copy-on-Write storage driver, delivering raw disk I/O performance. Databases (Postgres, MySQL, Redis, MongoDB) must always run on named volumes; writing to the container CoW layer incurs severe write latency degradation.

---

### 7. Bind Mounts
- **Mental Model**: Direct host filesystem path passthrough into the container (`/host/path:/container/path`). Ideal for local development source code hot-reloading.
- **Under-the-Hood**: In production, if mounting host files (e.g. SSL certificates or config files), always append the `:ro` (read-only) flag to prevent a compromised container from modifying host files.

---

### 8. Networks
- **Mental Model**: Software-defined virtual switches connecting containers:
  - **Bridge (User-defined)**: Isolated virtual switch with automatic container-name DNS resolution.
  - **Host (`--network host`)**: Shares the host's raw network namespace (zero isolation, highest throughput).
  - **Overlay**: Multi-host VXLAN networking for Swarm / Kubernetes.
  - **None**: Air-gapped container with loopback only.
- **Under-the-Hood**: The default Docker bridge (`bridge`) does **not** provide embedded DNS resolution. Always create a user-defined bridge network for multi-service communication.

---

### 9. Port Mapping
- **Mental Model**: `EXPOSE` is merely human documentation. `-p host_port:container_port` creates Linux kernel `iptables` DNAT rules that forward incoming host traffic into the container's private IP.
- **Critical Warning**: Docker inserts DNAT rules into the `PREROUTING` chain, **bypassing Ubuntu UFW firewall rules**. Binding with `-p 5432:5432` exposes Postgres to the entire public Internet even if UFW has blocked port 5432. Always bind to localhost explicitly: `-p 127.0.0.1:5432:5432`.

---

### 10. Environment Variables
- **Mental Model**:
  - `ARG`: Build-time only. Injected via `--build-arg`. Baked into image history (never put secrets here).
  - `ENV`: Baked into image metadata as runtime defaults.
  - `--env-file` / `-e`: Injected into the living process environment (`/proc/1/environ`) at runtime.

---

### 11. Healthcheck
- **Mental Model**: A process may stay alive while deadlocked or unable to serve traffic. A healthcheck executes a periodic internal diagnostic command (`CMD curl -f http://localhost:3000/health || exit 1`).
- **Under-the-Hood**: The Docker daemon monitors return codes. If probes fail consecutively past the `retries` limit, the container transitions to `unhealthy`, allowing orchestrators or auto-healing supervisors to restart it.

---

### 12. Registries
- **Mental Model**: Content-addressable storage services (Docker Hub, GitHub Container Registry, AWS ECR) distributing OCI image manifests, layer tarballs, and cryptographic signatures.
- **Under-the-Hood**: Docker deduplicates layer uploads across images. When pushing a multi-architecture image (AMD64 + ARM64), Buildx uploads an OCI manifest list (Index) pointing to platform-specific image manifests.

---

### 13. Image Tagging & Triggers
- **Mental Model**: Tags (like `:latest` or `:v1.0.0`) are mutable pointers. Cryptographic digests (`@sha256:...`) are immutable hashes.
- **Production Standard**: Banish `:latest` in production. Tag images with the short Git commit SHA (`git rev-parse --short HEAD`) to maintain an unbroken audit trail from code commit to running container.

---

### 14. Slim Images
- **Comparison**:
  - **Ubuntu/Debian full**: ~200MB, full package managers, large attack surface.
  - **Debian-slim**: ~75MB, glibc, excellent POSIX compatibility for native C-bindings (Prisma, Sharp).
  - **Alpine**: ~7MB, musl libc, tiny, but beware of musl DNS concurrency and memory fragmentation under load.
  - **Distroless**: ~25MB, runtime only, no shell, no package manager (maximum security).

---

### 15. Security Scanning
- **Checklist**:
  1. Never run as root (UID 0): declare `USER 10001:10001`.
  2. Drop Linux capabilities: `--cap-drop=ALL --cap-add=NET_BIND_SERVICE`.
  3. Prevent privilege escalation: `--security-opt=no-new-privileges:true`.
  4. Make root filesystem read-only: `--read-only --tmpfs /tmp:rw,noexec,nosuid,size=64m`.
  5. Continuous scanning: integrate `trivy` or `docker scout` in CI pipelines.

---

### 16. Resource Limits
- **Mental Model**: Unconstrained containers consume all available host RAM and CPU, triggering kernel panics or killing host daemons.
- **Under-the-Hood**:
  - `--memory="1g"`: Enforces cgroup `memory.max`. Exceeding this triggers the Linux OOM Killer, terminating the container with **Exit Code 137**.
  - `--cpus="1.5"`: Uses Linux CFS (Completely Fair Scheduler) quotas to throttle CPU without killing the container.

---

### 17. Container Logs
- **Mental Model**: Containers should never manage their own log files. Applications must stream plain JSON logs to `STDOUT` and `STDERR`.
- **Under-the-Hood**: The Docker daemon writes these streams to `/var/lib/docker/containers/<id>/<id>-json.log`. Always configure log rotation in `/etc/docker/daemon.json` (`"max-size": "50m"`, `"max-file": "3"`) to prevent unrotated logs from filling host disks.

---

### 18. Exec and Debugging
- **Mental Model**: `docker exec` does not SSH into a container; it uses the Linux `setns()` syscall to spawn a process inside the running container's existing namespaces.
- **Distroless Debugging**: For containers with no shell (`/bin/sh`), inspect from the host using `nsenter`:
  ```bash
  PID=$(docker inspect -f '{{.State.Pid}}' <container_id>)
  nsenter -t $PID -n tcpdump -i eth0 -nn
  ```

---

### 19. Rootless Containers
- **Mental Model**: Running the Docker daemon and containers inside user namespaces (`userns-remap`) as an ordinary non-root host user.
- **Under-the-Hood**: Maps UID 0 inside the container to an unprivileged subordinate UID (e.g. 100000) on the host. If an attacker exploits a container breakout vulnerability, they land on the host as an unprivileged user without root privileges.

---

### 20. Best Practices
- **The 10 Commandments**:
  1. Single Responsibility: 1 process per container.
  2. Never patch containers live; redeploy immutable image versions.
  3. Use `tini` or `dumb-init` as PID 1 to ensure POSIX signals are forwarded and zombie processes reaped.
  4. Maintain a strict `.dockerignore` file (`.git`, `node_modules`, `.env*`).
  5. Run as unprivileged user (`USER 10001:10001`).
  6. Enforce read-only root filesystems (`--read-only`).
  7. Declare explicit memory and CPU limits (`--memory`, `--cpus`).
  8. Pin deterministic dependencies with lockfiles.
  9. Configure healthchecks with appropriate `start_period`.
  10. Pin images by immutable commit SHA digests, never `:latest`.

