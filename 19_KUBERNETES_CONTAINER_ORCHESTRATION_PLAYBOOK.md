# 19: KUBERNETES & CONTAINER ORCHESTRATION ENGINEERING PLAYBOOK

> **The 20 Architectural Pillars of Production Kubernetes Engineering**  
> *From Pod Namespaces & Ingress L7 Routing to StatefulSet Dedicated PVCs, HPA Stabilization, Least-Privilege RBAC, and CrashLoopBackOff Diagnostics.*

---

## Architecture Matrix: The 20 Pillars

| # | Pillar | Category | Primary Focus | Production Threat / Anti-Pattern |
|---|--------|----------|---------------|----------------------------------|
| **01** | **Pods** | Workloads & Pods | Atomic scheduling sandbox, pause container, shared IPC/NET | Deploying raw/naked Pods (never rescheduled if node dies) |
| **02** | **Deployments** | Workloads & Pods | Declarative rolling updates, desired state reconciliation | Missing readiness probes with `maxUnavailable: 100%` |
| **03** | **ReplicaSets** | Workloads & Pods | Self-healing pod population supervisor with label selectors | Overlapping label selectors causing controllers to fight |
| **04** | **Services** | Networking & Ingress | ClusterIP virtual IP, L4 discovery, EndpointSlices | Label selector typo producing empty endpoints (black hole) |
| **05** | **Ingress** | Networking & Ingress | L7 reverse proxy routing, host multiplexing, TLS | Deploying Ingress without Ingress Controller installed |
| **06** | **ConfigMaps** | Configuration & State | Decoupled 12-factor configuration & tmpfs projections | Expecting `envFrom` environment variables to auto-update live |
| **07** | **Secrets** | Configuration & State | Sensitive credentials, tmpfs mounts, KMS encryption | Treating base64 as encryption and committing YAML to Git |
| **08** | **Namespaces** | Cluster Admin & Security | Logical scoping, ResourceQuotas, tenant isolation | Assuming namespaces provide default network boundary security |
| **09** | **Volume and PVCs** | Configuration & State | CSI abstraction: PV, PVC, and dynamic StorageClasses | Attaching RWO volume across multiple nodes simultaneously |
| **10** | **StatefulSets** | Workloads & Pods | Stable ordinal identities, dedicated storage per replica | Using regular Deployments for consensus-driven databases |
| **11** | **DaemonSets** | Workloads & Pods | Node-local agents (CNI, monitoring, logging) on all nodes | Unbounded RAM requests starving worker nodes of application capacity |
| **12** | **Jobs and CronJob** | Lifecycle & Scaling | Run-to-completion batch workflows with concurrency guards | `concurrencyPolicy: Allow` cascading into multi-job DB lockups |
| **13** | **Liveness and Readiness** | Lifecycle & Scaling | Process restart vs load balancer removal vs startup grace | Checking DB ping in Liveness probe (causes cascading cluster restart) |
| **14** | **Resource and Requests** | Lifecycle & Scaling | Guaranteed scheduling vs hard limits & QoS classes | Omitting requests (QoS BestEffort) triggering node OOM eviction |
| **15** | **Autoscaling (HPA)** | Lifecycle & Scaling | Horizontal Pod Autoscaling, target metrics, cooldowns | Missing CPU requests preventing HPA from calculating metrics |
| **16** | **Rolling Updates** | Lifecycle & Scaling | `maxSurge`, `maxUnavailable`, preStop sleep hooks | Dropped connections during deploy due to missing preStop delay |
| **17** | **Helm** | Cluster Admin & Security | Package management, Go templates, atomic rollbacks | Manual `kubectl edit` causing three-way merge conflicts in CI |
| **18** | **Kubectl** | Cluster Admin & Security | API Gateway CLI, JSONPath filters, node drains | Context confusion running destructive commands against production |
| **19** | **RBAC** | Cluster Admin & Security | Roles, ClusterRoles, ServiceAccounts, least privilege | Granting `cluster-admin` to application default service accounts |
| **20** | **Troubleshooting Pods** | Troubleshooting | 5-step triage ladder: CrashLoopBackOff to Eviction | Blindly deleting pods without checking `kubectl logs --previous` |

---

## Detailed Architectural Breakdown

### 1. Pods
- **Mental Model**: A Pod is an atomic execution sandbox sharing a single Linux network namespace (IP, ports), IPC namespace, and volume mounts. A hidden `pause` container claims the namespaces via `CLONE_NEWNET`, and application/sidecar containers join via `setns()`.
- **Production Rule**: Never run standalone naked Pods; always wrap them in Deployments or StatefulSets to survive worker node reboots.

### 2. Deployments
- **Mental Model**: High-level declarative controllers that manage ReplicaSets to provide automated rolling updates and rollback checkpoints.
- **Production Spec**: Enforce `maxUnavailable: 0` and `maxSurge: 25%` to guarantee zero-downtime rolling deploys.

### 3. ReplicaSets
- **Mental Model**: Continuous reconciliation loop ensuring `actual_pods == desired_replicas` matching a set-based label selector. Managed declaratively by Deployments.

### 4. Services
- **Mental Model**: Stable Layer 4 virtual IP (ClusterIP) that load-balances across dynamic ephemeral Pod IPs. Populated via `EndpointSlices` and programmed into node kernel packet tables via `kube-proxy` (iptables or IPVS).
- **Core Triage**: If a service cannot be reached, check `kubectl get endpoints <svc_name>`. If `<none>`, verify that pod labels match the Service selector.

### 5. Ingress
- **Mental Model**: Layer 7 application gateway handling external HTTP/HTTPS routing, hostname multiplexing, path rewriting, and TLS termination before forwarding to internal ClusterIP Services.
- **Controller Requirement**: Ingress resources require an active controller (e.g. Ingress-NGINX, Traefik, AWS ALB Controller).

### 6. ConfigMaps
- **Mental Model**: Decoupled non-sensitive configuration injected as environment variables or mounted files. Mounted files update dynamically via kubelet sync, whereas environment variables require pod restarts.

### 7. Secrets
- **Mental Model**: Sensitive credentials stored as memory-backed tmpfs mounts inside pods.
- **Critical Security**: Standard Secret manifests are merely Base64-encoded. Production clusters must enable etcd envelope encryption (`--encryption-provider-config`) and sync credentials using External Secrets Operator.

### 8. Namespaces
- **Mental Model**: Logical tenancy partitions within a cluster.
- **Security Reality**: Namespaces do **not** isolate network traffic by default. Network isolation requires active `NetworkPolicy` resources (default-deny ingress).

### 9. Volumes and PVCs
- **Mental Model**: Storage decoupled from compute:
  - `StorageClass`: The dynamic disk factory (AWS gp3, Ceph, NFS).
  - `PersistentVolumeClaim (PVC)`: Developer's storage voucher.
  - `PersistentVolume (PV)`: The physical provisioned block storage.
- **Production Rule**: Set `reclaimPolicy: Retain` on production database storage classes.

### 10. StatefulSets
- **Mental Model**: Pods with stable identities (`db-0`, `db-1`), sequential startup/teardown order, and dedicated per-pod PVCs created via `volumeClaimTemplates`. Paired with Headless Services (`clusterIP: None`) for peer discovery.

### 11. DaemonSets
- **Mental Model**: Ensures exactly one pod copy runs across every worker node. Used for host log aggregators (Vector, Fluentd), host metric collectors (Node Exporter), and CNI mesh agents (Cilium, AWS VPC CNI).

### 12. Jobs and CronJob
- **Mental Model**: Batch run-to-completion tasks. CronJobs schedule Jobs periodically.
- **Production Guard**: Set `concurrencyPolicy: Forbid` and `activeDeadlineSeconds` on database backups and ETL pipelines to prevent zombie process accumulations.

### 13. Liveness and Readiness
- **Mental Model**:
  - **Startup Probe**: Gives slow applications (Java, migrations) time to boot without being killed.
  - **Liveness Probe**: Detects deadlocks and restarts the container. Never check external databases here!
  - **Readiness Probe**: Controls whether the pod receives live traffic via EndpointSlices.

### 14. Resource Requests and Limits
- **Mental Model**:
  - `requests`: Used by `kube-scheduler` to place pods on nodes.
  - `limits`: Enforced by Linux kernel cgroups (`cpu.max`, `memory.max`).
  - **QoS Classes**: `Guaranteed` (`requests == limits`), `Burstable`, `BestEffort`. During node memory pressure, BestEffort pods are evicted first.

### 15. Autoscaling (HPA)
- **Mental Model**: Adjusts replica count dynamically based on observed CPU/memory utilization or custom Prometheus metrics.
- **Stabilization**: Configure `stabilizationWindowSeconds: 300` on scale-down to prevent rapid flapping under bursty traffic.

### 16. Rolling Updates
- **Mental Model**: Incremental pod replacement.
- **Zero-Downtime Recipe**: Combine `maxUnavailable: 0` with a `preStop` sleep hook (`sleep 10`) to allow iptables and ingress upstreams to propagate before the app exits.

### 17. Helm
- **Mental Model**: Kubernetes package manager rendering parameterized Go templates from `values.yaml`.
- **Production Flag**: Always pass `--atomic --timeout 5m` in CI/CD pipelines to trigger automatic rollbacks on failed releases.

### 18. Kubectl
- **Mental Model**: Authenticated REST client communicating with the Kubernetes API server (`kube-apiserver`).
- **Core Operations**: `kubectl get`, `kubectl describe`, `kubectl logs`, `kubectl port-forward`, `kubectl drain`.

### 19. RBAC
- **Mental Model**: Role-Based Access Control regulating access to Kubernetes API endpoints.
- **Principle**: Grant least privilege; never bind `cluster-admin` to application default service accounts; disable `automountServiceAccountToken: false` where unneeded.

### 20. Troubleshooting Pods
- **5-Step Protocol**:
  1. `kubectl get pods -o wide` (status, node, restart count)
  2. `kubectl describe pod <name>` (lifecycle events)
  3. `kubectl logs <name> --previous` (crash logs)
  4. Inspect exit code (`137` = OOMKilled by SIGKILL)
  5. `kubectl debug` (inject ephemeral diagnostic container)

