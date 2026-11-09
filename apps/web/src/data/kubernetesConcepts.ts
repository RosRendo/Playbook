export interface KubernetesConcept {
  id: string;
  name: string;
  subtitle: string;
  category: "Workloads & Pods" | "Networking & Ingress" | "Configuration & State" | "Lifecycle & Scaling" | "Cluster Admin & Security" | "Troubleshooting";
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

export const KUBERNETES_CONCEPTS: KubernetesConcept[] = [
  {
    id: "pods",
    name: "1. Pods",
    subtitle: "The Atomic Scheduling Unit & Shared Linux Namespaces",
    category: "Workloads & Pods",
    mentalModel: "A Pod is not a single container. A Pod is a sandbox of one or more co-located containers that share the exact same Linux Network, IPC, and UTS namespaces, as well as shared volume mounts, bound to a single IP address.",
    coreMechanism: "The kubelet initiates a hidden `pause` container (`pause:3.9`) which claims kernel namespaces (`CLONE_NEWNET`, `CLONE_NEWIPC`). Application and sidecar containers then join the pause container's namespaces via `setns()`. All containers in a Pod talk to each other over `localhost` and share the same network lifecycle.",
    keySyntax: [
      {
        label: "Production Multi-Container Pod Anatomy",
        code: `apiVersion: v1
kind: Pod
metadata:
  name: payment-processor
  labels:
    app.kubernetes.io/name: payment
spec:
  restartPolicy: Always
  containers:
    - name: api
      image: registry.internal/payment:v2.1.0
      ports:
        - containerPort: 8080
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app
    - name: log-shipper # Sidecar pattern sharing localhost and volumes
      image: fluent/fluent-bit:2.2
      volumeMounts:
        - name: shared-logs
          mountPath: /var/log/app
  volumes:
    - name: shared-logs
      emptyDir: {}`,
        explanation: "The api and log-shipper containers share both the loopback network interface and the ephemeral emptyDir volume."
      }
    ],
    productionCommands: [
      { cmd: "kubectl get pods -o wide --show-labels", desc: "List pods showing node assignments, internal IPs, and metadata labels", level: "read" },
      { cmd: "kubectl describe pod <pod_name>", desc: "Inspect pod lifecycle transitions, container statuses, and controller events", level: "read" },
      { cmd: "kubectl delete pod <pod_name> --grace-period=0 --force", desc: "HAZARDOUS: Instantly evict pod bypassing graceful termination hooks", level: "hazardous" }
    ],
    productionRules: [
      "Never deploy standalone, naked Pods in production: naked Pods are not rescheduled if their host worker node dies. Always wrap Pods in a Deployment or StatefulSet.",
      "Reserve multi-container Pods strictly for tight co-dependencies (e.g. Envoy proxies, log forwarders, vault secret injectors)."
    ],
    failureModes: [
      {
        pitfall: "Deploying raw `kind: Pod` manifests directly to production clusters",
        impact: "When the underlying AWS EC2 worker node terminates or restarts, the Pod is terminated permanently and never recreated, resulting in an unrecovered outage.",
        resolution: "Wrap all Pod templates within a Deployment or DaemonSet controller."
      }
    ],
    realWorldScenario: {
      title: "Port Collision Panic inside a Multi-Container Pod",
      situation: "An API container crashed repeatedly on boot with `listen EADDRINUSE :::8080`.",
      investigation: "The developer had added an internal metrics sidecar container that was also configured to bind to port 8080. Because all containers in a Pod share the same network namespace and IP, ports cannot be reused across containers.",
      fix: "Reconfigured the metrics sidecar to bind to port 9090 on localhost."
    }
  },
  {
    id: "deployments",
    name: "2. Deployments",
    subtitle: "Declarative Application Upgrades & Desired-State Reconciliation",
    category: "Workloads & Pods",
    mentalModel: "A Deployment is a high-level declarative controller that manages ReplicaSets to enable automated rolling updates, rollbacks, and declarative state reconciliation without downtime.",
    coreMechanism: "The Deployment controller in `kube-controller-manager` continuously compares the cluster's current state with the desired state declared in `spec`. When the pod template changes (e.g., image tag update), the controller creates a new ReplicaSet, scales it up incrementally, and scales down the old ReplicaSet according to `maxSurge` and `maxUnavailable` quotas.",
    keySyntax: [
      {
        label: "Zero-Downtime Deployment Spec",
        code: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  labels:
    app: order-service
spec:
  replicas: 5
  revisionHistoryLimit: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0 # Zero downtime guarantee
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
        - name: app
          image: order-service:git-9a8b7c6
          ports:
            - containerPort: 3000`,
        explanation: "Setting `maxUnavailable: 0` guarantees that Kubernetes will never terminate an existing pod until a replacement pod is fully running and has passed its readiness probe."
      }
    ],
    productionCommands: [
      { cmd: "kubectl rollout status deployment/order-service", desc: "Watch live progression of pod creations and terminations during a rolling update", level: "read" },
      { cmd: "kubectl rollout history deployment/order-service", desc: "Inspect previous rollout revisions and associated change-cause annotations", level: "read" },
      { cmd: "kubectl rollout undo deployment/order-service --to-revision=2", desc: "Immediately revert to a specific previous known-good deployment revision", level: "write" }
    ],
    productionRules: [
      "Always set `revisionHistoryLimit: 5` or `10`: omitting this allows old ReplicaSets to pile up, bloating etcd database memory.",
      "Never mutate `spec.selector.matchLabels` on an existing deployment: Kubernetes immutable selector validation will reject the update."
    ],
    failureModes: [
      {
        pitfall: "Deploying a new image tag that immediately crashes without setting readiness probes",
        impact: "Kubernetes replaces all running pods with the crashing version within seconds, taking down the entire service before operators can react.",
        resolution: "Configure robust `readinessProbe` and set `maxUnavailable: 0` or `maxUnavailable: 25%`."
      }
    ],
    realWorldScenario: {
      title: "The Deadlock of 100% maxUnavailable on Single-Replica Deployments",
      situation: "A team set `replicas: 1` and `maxUnavailable: 1`. During a deployment, the old pod was killed, but the new pod failed to pull its image due to invalid credentials, leaving the service down.",
      investigation: "With `maxUnavailable: 1`, the controller terminated the healthy pod before confirming the new pod could start.",
      fix: "Enforced `replicas: 2` minimum with `maxUnavailable: 0` across all production services."
    }
  },
  {
    id: "replicasets",
    name: "3. ReplicaSets",
    subtitle: "Self-Healing Population Supervisors",
    category: "Workloads & Pods",
    mentalModel: "A ReplicaSet is a low-level worker supervisor whose sole duty is to maintain a stable set of identical running Pods matching a set-based label selector at any given time.",
    coreMechanism: "The ReplicaSet controller runs a continuous control loop (reconciliation). It queries the API server for Pods matching its `selector`. If `actual < desired`, it sends `POST /api/v1/pods` requests. If `actual > desired`, it sends `DELETE` requests. ReplicaSets are managed automatically by Deployments.",
    keySyntax: [
      {
        label: "ReplicaSet Definition & Label Selector",
        code: `apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: cache-worker-v1
spec:
  replicas: 3
  selector:
    matchExpressions:
      - key: app
        operator: In
        values: [cache-worker]
      - key: tier
        operator: In
        values: [backend]
  template:
    metadata:
      labels:
        app: cache-worker
        tier: backend
    spec:
      containers:
        - name: redis-worker
          image: redis:7-alpine`,
        explanation: "ReplicaSets use set-based selectors (`In`, `NotIn`, `Exists`) to claim ownership of matching pods in the namespace."
      }
    ],
    productionCommands: [
      { cmd: "kubectl get rs", desc: "List active ReplicaSets, desired count, current count, and ready count", level: "read" },
      { cmd: "kubectl describe rs <rs_name>", desc: "Inspect ReplicaSet event log for pod creation errors or quota rejections", level: "read" }
    ],
    productionRules: [
      "Never manage ReplicaSets directly in production: always author Deployments, which manage ReplicaSets declaratively.",
      "Do not manually edit pod labels that match an active ReplicaSet's selector, or the controller will instantly spawn duplicate pods to replace them."
    ],
    failureModes: [
      {
        pitfall: "Creating two Deployments in the same namespace with identical `matchLabels: { app: api }`",
        impact: "Both ReplicaSet controllers fight over the same pods in an infinite reconcile loop, constantly creating and killing pods.",
        resolution: "Enforce unique label selectors for every distinct workload in the namespace."
      }
    ],
    realWorldScenario: {
      title: "The Orphan Pod Leak During Manual Emergency Triage",
      situation: "An engineer renamed a deployment in a YAML file and reapplied it, resulting in double the expected pod count.",
      investigation: "The old ReplicaSet was not deleted, and because its label selector still matched the pods, both ReplicaSets kept their respective pods alive.",
      fix: "Audited existing ReplicaSets with `kubectl get rs` and cleaned up orphaned controllers."
    }
  },
  {
    id: "services",
    name: "4. Services",
    subtitle: "Stable L4 Virtual IP, Service Discovery & Endpoint Slices",
    category: "Networking & Ingress",
    mentalModel: "Pods are ephemeral; their IP addresses change every time they restart. A Service provides an immutable virtual IP (ClusterIP) and DNS entry (`service-name.namespace.svc.cluster.local`) that load balances traffic across a dynamic pool of Pods.",
    coreMechanism: "The Service controller tracks matching Pods and populates `EndpointSlices`. On each worker node, `kube-proxy` watches EndpointSlices and writes Linux `iptables` or `IPVS` rules. Packets sent to the Service's ClusterIP are DNAT'd in the kernel directly to one of the healthy Pod IPs, bypassing user-space overhead.",
    keySyntax: [
      {
        label: "ClusterIP, NodePort & Headless Service Patterns",
        code: `# Standard ClusterIP (Internal L4 Load Balancing)
apiVersion: v1
kind: Service
metadata:
  name: auth-svc
spec:
  type: ClusterIP
  selector:
    app: auth-api
  ports:
    - name: http
      port: 80        # Port exposed by the Service ClusterIP
      targetPort: 3000 # Port listened to by container

---
# Headless Service (Direct DNS records to Pod IPs; for StatefulSets)
apiVersion: v1
kind: Service
metadata:
  name: redis-cluster
spec:
  clusterIP: None
  selector:
    app: redis
  ports:
    - port: 6379`,
        explanation: "Setting `clusterIP: None` disables proxying and instructs CoreDNS to return direct A records for each individual Pod IP."
      }
    ],
    productionCommands: [
      { cmd: "kubectl get svc -o wide", desc: "List all services, ClusterIPs, external NodePorts, and label selectors", level: "read" },
      { cmd: "kubectl get endpointslices -l kubernetes.io/service-name=<svc_name>", desc: "Inspect active healthy Pod IPs currently registered to receive traffic", level: "read" },
      { cmd: "kubectl run test-dns --rm -it --image=busybox -- nslookup <svc_name>", desc: "Perform real-time internal CoreDNS lookup from within the pod network", level: "read" }
    ],
    productionRules: [
      "Target ports must strictly match container listen ports: a mismatch between `port` and `targetPort` causes silent connection timeouts.",
      "Prefer IPVS mode over iptables in `kube-proxy` for clusters with more than 1,000 services to prevent O(N) iptables kernel lookup latency."
    ],
    failureModes: [
      {
        pitfall: "Deploying a service with a label selector that doesn't match any running pod's metadata labels",
        impact: "The Service creates an empty `EndpointSlice`. All incoming traffic hits a black hole and drops with connection refused.",
        resolution: "Run `kubectl get endpoints <svc_name>` to verify that healthy target IPs are actively populated."
      }
    ],
    realWorldScenario: {
      title: "The Silent Black Hole Caused by a Typo in `matchLabels`",
      situation: "Frontend microservices reported HTTP 503 errors attempting to reach `http://checkout-service`.",
      investigation: "`kubectl get endpoints checkout-service` returned `<none>`. The service selector looked for `app: checkout`, but the deployment pod template was labeled `app: checkout-api`.",
      fix: "Aligned the Service selector with the Deployment pod template labels; endpoints populated within 400ms."
    }
  },
  {
    id: "ingress",
    name: "5. Ingress",
    subtitle: "L7 Reverse Proxy Routing, TLS Termination & Host Multiplexing",
    category: "Networking & Ingress",
    mentalModel: "While a Service operates at Layer 4 (TCP/UDP), an Ingress manages Layer 7 HTTP/HTTPS traffic entering the cluster from the outside world, providing path-based routing, virtual host multiplexing, and TLS termination.",
    coreMechanism: "An Ingress resource is merely configuration data. An Ingress Controller (such as Ingress-NGINX, Traefik, or AWS ALB Controller) watches Ingress objects and dynamically regenerates reverse-proxy routing tables in memory, routing traffic directly to Pod IPs via EndpointSlices.",
    keySyntax: [
      {
        label: "Production Ingress with TLS & Host Routing",
        code: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: core-ingress
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/proxy-body-size: "20m"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
    - hosts:
        - api.domain.com
      secretName: api-tls-cert
  rules:
    - host: api.domain.com
      http:
        paths:
          - path: /v1/users
            pathType: Prefix
            backend:
              service:
                name: user-service
                port:
                  number: 80
          - path: /v1/orders
            pathType: Prefix
            backend:
              service:
                name: order-service
                port:
                  number: 80`,
        explanation: "PathType `Prefix` matches URL paths hierarchically; TLS termination is handled automatically via cert-manager."
      }
    ],
    productionCommands: [
      { cmd: "kubectl get ingress -A", desc: "List all ingress rules, target hostnames, and public cloud load balancer endpoints", level: "read" },
      { cmd: "kubectl describe ingress <ingress_name>", desc: "Inspect backend service bindings and TLS secret certificate references", level: "read" }
    ],
    productionRules: [
      "Always set `pathType: Prefix` or `Exact`: never leave pathType unspecified in modern Kubernetes clusters.",
      "Enforce SSL redirect annotations (`ssl-redirect: true`) to prevent unencrypted HTTP traffic from reaching internal microservices."
    ],
    failureModes: [
      {
        pitfall: "Deploying an Ingress resource without installing an Ingress Controller in the cluster",
        impact: "The Ingress resource sits dormant; no external IP is ever provisioned and no traffic is routed.",
        resolution: "Install an Ingress Controller (e.g. Ingress-NGINX or AWS Load Balancer Controller) and set `ingressClassName`."
      }
    ],
    realWorldScenario: {
      title: "Mass 404 Outage on Wildcard Path Overlap",
      situation: "A team added a catch-all marketing route `/` to Ingress, inadvertently breaking all `/api` microservices.",
      investigation: "The Ingress Controller evaluated the broad prefix rule before specific API rules due to missing annotation priority.",
      fix: "Separated marketing routes and API routes into distinct Ingress resources with explicit hostnames."
    }
  },
  {
    id: "configmaps",
    name: "6. ConfigMaps",
    subtitle: "Decoupled Configuration & Dynamic File Projections",
    category: "Configuration & State",
    mentalModel: "ConfigMaps separate application configuration from container images, adhering to 12-Factor principles. They inject non-sensitive key-value pairs as environment variables, command-line arguments, or mounted configuration files.",
    coreMechanism: "The kubelet reads ConfigMap data stored in etcd and either injects it into the container's process environment at startup or writes it into an atomic memory-backed `tmpfs` volume mounted inside the container. Mounted files update automatically when the ConfigMap is modified in etcd (subject to kubelet sync period).",
    keySyntax: [
      {
        label: "ConfigMap Definition & Multi-Projection Usage",
        code: `apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  LOG_LEVEL: "info"
  MAX_CONNECTIONS: "100"
  nginx.conf: |
    server {
      listen 80;
      server_name localhost;
      location /health { return 200 'OK'; }
    }

---
# Consuming as volume mount in Pod:
spec:
  containers:
    - name: web
      image: nginx:alpine
      volumeMounts:
        - name: config-vol
          mountPath: /etc/nginx/conf.d
  volumes:
    - name: config-vol
      configMap:
        name: app-config
        items:
          - key: nginx.conf
            path: default.conf`,
        explanation: "Mounting specific keys into a directory avoids overwriting the entire target folder on the container filesystem."
      }
    ],
    productionCommands: [
      { cmd: "kubectl get configmaps -o wide", desc: "List all ConfigMaps in the active namespace with their data entry counts", level: "read" },
      { cmd: "kubectl get cm <cm_name> -o yaml", desc: "View raw YAML configuration data and multi-line script projections", level: "read" }
    ],
    productionRules: [
      "ConfigMaps injected as environment variables (`envFrom`) do NOT update automatically when the ConfigMap changes; pods must be restarted.",
      "ConfigMaps have a strict 1MB size limit in etcd: do not use ConfigMaps to store binary files, large caches, or SQLite databases."
    ],
    failureModes: [
      {
        pitfall: "Editing a ConfigMap and expecting pods consuming it via `envFrom` to pick up changes live",
        impact: "Containers continue running with stale environment variables indefinitely until manually killed.",
        resolution: "Use tools like Reloader, or trigger a rolling restart: `kubectl rollout restart deployment/<name>`."
      }
    ],
    realWorldScenario: {
      title: "The SubPath Mount Freeze that Blocked Hot-Reloading",
      situation: "An Nginx deployment mounted `default.conf` using `subPath`. Operators updated the ConfigMap, but the container file never changed.",
      investigation: "The Linux kernel cannot propagate atomic directory rename symlinks when a single file is mounted using `subPath`.",
      fix: "Mounted the entire ConfigMap volume to an isolated directory and symlinked the config file in an init container."
    }
  },
  {
    id: "secrets",
    name: "7. Secrets",
    subtitle: "Sensitive Data Storage, RBAC Guards & Envelope Encryption",
    category: "Configuration & State",
    mentalModel: "Secrets store sensitive credentials (passwords, tokens, private keys) separated from application code. Unlike ConfigMaps, Secrets are stored in memory-backed tmpfs mounts inside pods and can be encrypted at rest in etcd.",
    coreMechanism: "In vanilla Kubernetes, Secret values are merely Base64-encoded (NOT encrypted). In production, clusters must enable **EncryptionConfiguration** via KMS (AWS KMS, GCP KMS, Vault) to encrypt Secret data in etcd. The kubelet mounts secrets into pods as tmpfs volumes, preventing sensitive keys from ever being written to host worker node disks.",
    keySyntax: [
      {
        label: "Secret Declaration & Secure Pod Consumption",
        code: `apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
type: Opaque
stringData: # stringData automatically base64 encodes plain text on apply
  DB_USER: "master_admin"
  DB_PASS: "SuperSecure$2026!#"

---
spec:
  containers:
    - name: api
      image: api:v1.0.0
      env:
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: DB_PASS`,
        explanation: "`stringData` allows writing cleartext secrets in deployment scripts without manually running `base64 -w 0`."
      }
    ],
    productionCommands: [
      { cmd: "kubectl get secrets", desc: "List secret names and types without revealing sensitive payloads", level: "read" },
      { cmd: "kubectl get secret <name> -o jsonpath='{.data.DB_PASS}' | base64 --decode", desc: "Extract and decode a specific secret value for authorized debugging", level: "read" }
    ],
    productionRules: [
      "Never commit Kubernetes Secret manifests to Git: use External Secrets Operator, HashiCorp Vault, or SealedSecrets.",
      "Always enable Envelope Encryption in etcd (`--encryption-provider-config`) to protect secrets against disk compromises."
    ],
    failureModes: [
      {
        pitfall: "Committing raw base64-encoded Secret YAMLs to a public GitHub repository",
        impact: "Base64 is an encoding, NOT encryption. Anyone can decode it with `echo <str> | base64 -d`, leading to immediate database credential theft.",
        resolution: "Adopt External Secrets Operator (ESO) syncing from AWS Secrets Manager or HashiCorp Vault."
      }
    ],
    realWorldScenario: {
      title: "Hardcoded API Token Leaked via CI Build Logs",
      situation: "An attacker obtained a Stripe production secret key and initiated fraudulent customer refunds.",
      investigation: "A developer printed `kubectl get secret -o yaml` in an unmasked GitHub Actions step during deployment triage.",
      fix: "Enforced RBAC restrictions on secret read access, rotated the key, and integrated Sealed Secrets with commit-hook linting."
    }
  },
  {
    id: "namespaces",
    name: "8. Namespaces",
    subtitle: "Logical Tenant Partitioning, Quotas & Resource Scoping",
    category: "Cluster Admin & Security",
    mentalModel: "A Namespace is a virtual cluster inside a physical Kubernetes cluster. It provides a distinct scope for object names, RBAC role bindings, network policies, and hardware resource quotas.",
    coreMechanism: "Namespaces partition the etcd API path (`/api/v1/namespaces/<ns>/pods`). They do NOT provide physical hardware isolation or kernel separation. Network isolation between namespaces requires active `NetworkPolicy` resources; by default, all pods in all namespaces can route packets to one another.",
    keySyntax: [
      {
        label: "Namespace with Strict ResourceQuota & LimitRange",
        code: `apiVersion: v1
kind: Namespace
metadata:
  name: payments-prod
  labels:
    environment: production
    pod-security.kubernetes.io/enforce: restricted

---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: payments-prod
spec:
  hard:
    requests.cpu: "8"
    requests.memory: 16Gi
    limits.cpu: "16"
    limits.memory: 32Gi
    pods: "20"`,
        explanation: "ResourceQuotas prevent a rogue service or tenant from consuming all available CPU and RAM in the cluster."
      }
    ],
    productionCommands: [
      { cmd: "kubectl get namespaces", desc: "List all active logical cluster partitions and their status", level: "read" },
      { cmd: "kubectl config set-context --current --namespace=<name>", desc: "Switch default kubectl context to target namespace", level: "write" }
    ],
    productionRules: [
      "Never deploy application workloads to the `default` or `kube-system` namespaces.",
      "Always attach a `ResourceQuota` and `LimitRange` to multi-tenant namespaces to prevent resource starvation attacks."
    ],
    failureModes: [
      {
        pitfall: "Assuming namespaces provide built-in network security isolation by default",
        impact: "A compromised dev container in namespace `dev` curls internal database pods in namespace `prod` over the flat pod network.",
        resolution: "Deploy a default-deny `NetworkPolicy` restricting cross-namespace ingress."
      }
    ],
    realWorldScenario: {
      title: "The Cluster-Wide Outage from an Unbounded Staging Namespace",
      situation: "A runaway staging deployment spawned 500 pods, exhausting all worker node memory and crashing production services.",
      investigation: "The staging namespace lacked a `ResourceQuota`. When an automated load test ran, it starved production pods of node resources.",
      fix: "Configured hard `ResourceQuota` limits on all non-production namespaces."
    }
  },
  {
    id: "volume-and-pvcs",
    name: "9. Volumes and PVCs",
    subtitle: "Storage Abstraction: PV, PVC & Dynamic StorageClasses",
    category: "Configuration & State",
    mentalModel: "The PV/PVC relationship mirrors Pods and Nodes. A PersistentVolume (PV) is the actual physical disk (AWS EBS, Ceph, NFS). A PersistentVolumeClaim (PVC) is a developer's request for storage (e.g. 'I need 50GB SSD'). A StorageClass dynamically provisions the PV when a PVC is created.",
    coreMechanism: "The CSI (Container Storage Interface) driver handles volume provisioning. When a Pod references a PVC, the kubelet instructs the cloud provider to attach the volume to the worker node (`AttachVolume`) and formats/mounts the filesystem into the container (`MountDevice`).",
    keySyntax: [
      {
        label: "StorageClass and Dynamic PVC Definition",
        code: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data-pvc
spec:
  accessModes:
    - ReadWriteOnce # Mounted by single node at a time
  storageClassName: gp3-encrypted
  resources:
    requests:
      storage: 100Gi

---
# Pod consumption:
spec:
  containers:
    - name: postgres
      image: postgres:16
      volumeMounts:
        - name: db-storage
          mountPath: /var/lib/postgresql/data
  volumes:
    - name: db-storage
      persistentVolumeClaim:
        claimName: postgres-data-pvc`,
        explanation: "AccessModes: `ReadWriteOnce` (single node read/write), `ReadWriteMany` (multi-node shared, e.g. NFS), `ReadOnlyMany`."
      }
    ],
    productionCommands: [
      { cmd: "kubectl get pvc,pv", desc: "List claims, bound physical volumes, capacity, and volume access modes", level: "read" },
      { cmd: "kubectl describe pvc <pvc_name>", desc: "Inspect storage binding status, CSI provisioner events, and resize states", level: "read" }
    ],
    productionRules: [
      "Always set `reclaimPolicy: Retain` on production database StorageClasses to prevent volume deletion if a PVC is accidentally deleted.",
      "Be aware that `ReadWriteOnce` (RWO) blocks mean the pod can only be scheduled onto a node in the same AWS Availability Zone as the EBS volume."
    ],
    failureModes: [
      {
        pitfall: "Attempting to attach an EBS-backed RWO volume across two pods running on different worker nodes",
        impact: "The second pod gets stuck in `ContainerCreating` with `Multi-Attach error for volume: Volume is already exclusively attached`.",
        resolution: "Use StatefulSets for single-pod persistent attachments, or use EFS/NFS (RWX) for shared multi-pod writes."
      }
    ],
    realWorldScenario: {
      title: "The Accidental Database Wipeout on Helm Uninstall",
      situation: "An engineer ran `helm uninstall staging-db`. The StorageClass had `reclaimPolicy: Delete`, wiping the underlying AWS EBS volume.",
      investigation: "Because the reclaim policy was set to `Delete`, destroying the PVC instantly deleted the cloud block storage.",
      fix: "Changed production StorageClass `reclaimPolicy` to `Retain` and enabled AWS EBS automated snapshot policies."
    }
  },
  {
    id: "statefulsets",
    name: "10. StatefulSets",
    subtitle: "Stable Network Identities, Ordered Indexing & Dedicated Storage",
    category: "Workloads & Pods",
    mentalModel: "Deployments treat pods as interchangeable cattle. StatefulSets treat pods as distinct individuals with fixed ordinal names (`db-0`, `db-1`, `db-2`), stable persistent network identities, and dedicated storage per replica.",
    coreMechanism: "StatefulSets deploy pods sequentially (0 to N-1) and terminate them in reverse order (N-1 to 0). Each replica gets an independent PVC created from a `volumeClaimTemplates` stanza. When paired with a Headless Service, each pod gets an individual DNS A-record (`db-0.db-svc.default.svc.cluster.local`).",
    keySyntax: [
      {
        label: "Production StatefulSet with volumeClaimTemplates",
        code: `apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
spec:
  serviceName: "kafka-headless"
  replicas: 3
  selector:
    matchLabels:
      app: kafka
  template:
    metadata:
      labels:
        app: kafka
    spec:
      containers:
        - name: broker
          image: confluentinc/cp-kafka:7.5.0
          ports:
            - containerPort: 9092
          volumeMounts:
            - name: kafka-storage
              mountPath: /var/lib/kafka/data
  volumeClaimTemplates:
    - metadata:
        name: kafka-storage
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 200Gi`,
        explanation: "Each Kafka pod gets its own distinct PVC (e.g. kafka-storage-kafka-0, kafka-storage-kafka-1)."
      }
    ],
    productionCommands: [
      { cmd: "kubectl get statefulsets", desc: "List StatefulSets, desired/current replicas, and ready status", level: "read" },
      { cmd: "kubectl rollout status statefulset/<name>", desc: "Track sequential ordered rollout of stateful pod instances", level: "read" }
    ],
    productionRules: [
      "Scaling down a StatefulSet does NOT delete the associated PVCs: storage must be cleaned up manually to prevent data loss.",
      "Always pair StatefulSets with a Headless Service (`clusterIP: None`) to allow peer-to-peer discovery across nodes."
    ],
    failureModes: [
      {
        pitfall: "Using a regular Deployment instead of a StatefulSet for a clustered database (Elasticsearch/Cassandra)",
        impact: "Pods restart with random names and random IPs, breaking cluster consensus, quorum membership, and split-brain recovery.",
        resolution: "Use StatefulSets with stable ordinal DNS names and dedicated per-replica volume claims."
      }
    ],
    realWorldScenario: {
      title: "Split-Brain Chaos in an Elasticsearch Cluster",
      situation: "An Elasticsearch cluster deployed via Deployment lost quorum whenever a pod rescheduled.",
      investigation: "The nodes were discovering peers by IP. When pods restarted on new nodes with new IPs, the cluster partitioned into two isolated master nodes.",
      fix: "Migrated to a StatefulSet with a headless discovery service, ensuring stable hostnames `es-0`, `es-1`, `es-2`."
    }
  },
  {
    id: "daemonsets",
    name: "11. DaemonSets",
    subtitle: "Node-Local Agents, Log Aggregators & Kernel Mesh Injectors",
    category: "Workloads & Pods",
    mentalModel: "A DaemonSet ensures that a copy of a specific Pod runs on all (or selected) worker nodes in the cluster. As nodes are added to the cluster, the DaemonSet controller automatically adds the Pod to them.",
    coreMechanism: "The DaemonSet controller watches Node additions. It uses the default scheduler and node affinity/tolerations to schedule one pod per node. Typical use cases include host monitoring (Node Exporter), log forwarding (Fluentd, Vector), and CNI network plugins (Cilium, Calico, AWS VPC CNI).",
    keySyntax: [
      {
        label: "Node Monitoring Agent DaemonSet",
        code: `apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: node-exporter
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: node-exporter
  template:
    metadata:
      labels:
        app: node-exporter
    spec:
      hostNetwork: true
      hostPID: true
      tolerations:
        - operator: Exists # Run on control plane nodes too
      containers:
        - name: node-exporter
          image: prom/node-exporter:v1.7.0
          volumeMounts:
            - name: proc
              mountPath: /host/proc
              readOnly: true
      volumes:
        - name: proc
          hostPath:
            path: /proc`,
        explanation: "Using `tolerations: [{ operator: Exists }]` allows the DaemonSet to run on tainted master/control-plane nodes."
      }
    ],
    productionCommands: [
      { cmd: "kubectl get daemonsets -A", desc: "List DaemonSets across all namespaces, desired nodes, and ready counts", level: "read" },
      { cmd: "kubectl describe ds <ds_name> -n <ns>", desc: "Inspect node selector constraints and scheduling errors", level: "read" }
    ],
    productionRules: [
      "Always configure tight resource requests on DaemonSets: if a DaemonSet consumes too much RAM, it can prevent workload pods from fitting on nodes.",
      "Add tolerations for `node-role.kubernetes.io/master:NoSchedule` or `control-plane:NoSchedule` if the agent must run on control plane nodes."
    ],
    failureModes: [
      {
        pitfall: "Deploying a DaemonSet without memory limits on memory-constrained worker nodes",
        impact: "The DaemonSet takes priority, triggering the eviction of customer-facing application pods across every node in the cluster.",
        resolution: "Set conservative resource requests and limits on every DaemonSet."
      }
    ],
    realWorldScenario: {
      title: "New EC2 Autoscaling Nodes Stuck in NotReady",
      situation: "When cluster autoscaler provisioned 10 new worker nodes, they all remained `NotReady` for 15 minutes.",
      investigation: "The AWS VPC CNI DaemonSet failed to pull its image on the new nodes because of an expired IAM role in the cluster's private registry.",
      fix: "Fixed node IAM instance profile permissions; CNI pods scheduled immediately and nodes turned Ready."
    }
  },
  {
    id: "jobs-and-cronjob",
    name: "12. Jobs and CronJob",
    subtitle: "Run-to-Completion Batch Processing & Time-Triggered Workflows",
    category: "Lifecycle & Scaling",
    mentalModel: "Deployments and StatefulSets run non-terminating processes. Jobs run batch tasks to completion (`restartPolicy: OnFailure` or `Never`). A CronJob creates Jobs on a recurring schedule based on standard cron syntax.",
    coreMechanism: "The Job controller tracks pod exit status. It terminates when `completions` succeed, with optional concurrency controls (`backoffLimit`). CronJobs create Job objects at schedule intervals. If `concurrencyPolicy: Forbid` is set, a new job will not spawn if the previous job is still running.",
    keySyntax: [
      {
        label: "Production CronJob with Concurrency Guards",
        code: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: nightly-db-backup
spec:
  schedule: "0 2 * * *" # Every night at 02:00 UTC
  concurrencyPolicy: Forbid # Never run concurrent backups!
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 5
  jobTemplate:
    spec:
      backoffLimit: 3 # Retry at most 3 times before failing
      activeDeadlineSeconds: 1800 # Kill if running > 30 minutes
      template:
        spec:
          restartPolicy: OnFailure
          containers:
            - name: backup
              image: backup-tool:1.2.0
              command: ["/bin/sh", "-c", "pg_dumpall | gzip > /s3/backup.sql.gz"]`,
        explanation: "`concurrencyPolicy: Forbid` prevents cascading memory overload if an ETL job takes longer than its schedule interval."
      }
    ],
    productionCommands: [
      { cmd: "kubectl get cronjobs,jobs", desc: "List scheduled cron jobs, active executions, and completion states", level: "read" },
      { cmd: "kubectl create job --from=cronjob/nightly-db-backup manual-test", desc: "Manually trigger an ad-hoc run of a CronJob immediately", level: "write" }
    ],
    productionRules: [
      "Always set `activeDeadlineSeconds` on Jobs to prevent zombie batch scripts from running forever and leaking resources.",
      "Always set `concurrencyPolicy: Forbid` on database backups and ETL pipelines to prevent simultaneous duplicate writes."
    ],
    failureModes: [
      {
        pitfall: "Using default `concurrencyPolicy: Allow` on a 5-minute ETL CronJob that takes 12 minutes to finish",
        impact: "Multiple jobs run simultaneously, fighting for database locks and exhausting cluster CPU, leading to cascading failures.",
        resolution: "Set `concurrencyPolicy: Forbid` or `Replace`."
      }
    ],
    realWorldScenario: {
      title: "1,200 Zombie Pods Bloating etcd from an Uncapped CronJob",
      situation: "Kubernetes API response times slowed to 4,000ms. `kubectl get pods` took 30 seconds to return.",
      investigation: "A CronJob running every minute had omitted `successfulJobsHistoryLimit`. Over 1,200 completed Pod objects were still stored in etcd.",
      fix: "Configured `successfulJobsHistoryLimit: 3` and ran a cleanup script to prune legacy completed batch pods."
    }
  },
  {
    id: "liveness-and-readiness",
    name: "13. Liveness and Readiness",
    subtitle: "Pod Health Probing: Liveness, Readiness & Startup Probes",
    category: "Lifecycle & Scaling",
    mentalModel: "Liveness kills broken pods. Readiness removes unready pods from traffic. Startup probes shield slow-booting applications during initialization.",
    coreMechanism: "The kubelet executes probes via HTTP GET, TCP Socket, or Exec. If a **Liveness** probe fails `failureThreshold` times, the kubelet kills the container and restarts it. If a **Readiness** probe fails, the container is NOT restarted; instead, the endpoints controller removes the Pod IP from Service `EndpointSlices` so it receives zero traffic.",
    keySyntax: [
      {
        label: "The Triple-Probe Health Pattern",
        code: `spec:
  containers:
    - name: api
      image: api:v2.0.0
      # 1. Startup Probe: Allows 60s for initial migrations without getting killed
      startupProbe:
        httpGet:
          path: /health/startup
          port: 8080
        failureThreshold: 30
        periodSeconds: 2

      # 2. Liveness Probe: Detects deadlocks and restarts container
      livenessProbe:
        httpGet:
          path: /health/liveness
          port: 8080
        periodSeconds: 10
        timeoutSeconds: 3
        failureThreshold: 3

      # 3. Readiness Probe: Removes pod from load balancer if overloaded
      readinessProbe:
        httpGet:
          path: /health/readiness
          port: 8080
        periodSeconds: 5
        timeoutSeconds: 2
        failureThreshold: 2`,
        explanation: "Startup probe disables liveness/readiness probes until it succeeds, preventing slow-starting apps from being killed prematurely."
      }
    ],
    productionCommands: [
      { cmd: "kubectl describe pod <pod_name> | grep -E 'Liveness|Readiness|Startup'", desc: "Inspect active probe configuration and failure counts on a pod", level: "read" },
      { cmd: "kubectl get events --field-selector reason=Unhealthy", desc: "Query recent cluster-wide probe failure events across all pods", level: "read" }
    ],
    productionRules: [
      "Never check external dependencies (database, Redis, third-party APIs) in a Liveness probe: if the DB slows down, ALL pods will restart in a death spiral.",
      "Always configure a Startup probe for applications that take more than 10 seconds to initialize or run schema migrations."
    ],
    failureModes: [
      {
        pitfall: "Checking `db.ping()` inside the `/health/liveness` HTTP endpoint",
        impact: "When the database slows down under load, all pods fail their liveness probe simultaneously. Kubernetes restarts every pod at once, worsening database load.",
        resolution: "Keep liveness probes internal (process deadlock check only). Place external dependency checks strictly in readiness probes."
      }
    ],
    realWorldScenario: {
      title: "The Deployment Crash-Loop Death Spiral",
      situation: "A Java Spring Boot service crashed continuously during deployment: `Liveness probe failed: HTTP probe failed with statuscode: 503`.",
      investigation: "The app took 45 seconds to boot. The liveness probe had `initialDelaySeconds: 10` and `periodSeconds: 5`. The kubelet killed the app before it finished starting.",
      fix: "Introduced a `startupProbe` with `failureThreshold: 30` and `periodSeconds: 2`, allowing 60 seconds for startup."
    }
  },
  {
    id: "resource-and-requests",
    name: "14. Resource and Requests",
    subtitle: "Guaranteed Scheduling vs Hard Limits & QoS Classes",
    category: "Lifecycle & Scaling",
    mentalModel: "`requests` are for scheduling: the kube-scheduler ensures a node has enough requested CPU/RAM before placing the pod. `limits` are for enforcement: the kernel throttles CPU or OOM-kills pods that exceed limits. Together, they define the Pod's Quality of Service (QoS) class.",
    coreMechanism: "Requests configure Linux CFS shares. Limits configure CFS bandwidth quotas (`cpu.max`) and cgroup memory limits (`memory.max`). When node memory is exhausted, the kernel kills pods based on QoS class: **BestEffort** first, then **Burstable**, and lastly **Guaranteed** (where requests equal limits).",
    keySyntax: [
      {
        label: "QoS Class Matrix & Resource Spec",
        code: `# Guaranteed QoS Class (requests === limits)
# Maximum resilience against node OOM eviction!
spec:
  containers:
    - name: core-api
      image: api:v1.0
      resources:
        requests:
          cpu: "500m"      # 0.5 CPU core
          memory: "1Gi"
        limits:
          cpu: "500m"      # Prevents CPU throttling variance
          memory: "1Gi"    # OOM killed if exceeded`,
        explanation: "1000m = 1 vCPU core. Setting requests equal to limits classifies the Pod as Guaranteed QoS, protecting it from eviction during node pressure."
      }
    ],
    productionCommands: [
      { cmd: "kubectl top pods -n <namespace>", desc: "Display real-time CPU (millicores) and RAM (MiB) utilization of pods via metrics-server", level: "read" },
      { cmd: "kubectl top nodes", desc: "Display aggregate CPU and memory utilization across physical/virtual cluster worker nodes", level: "read" },
      { cmd: "kubectl get pod <pod_name> -o jsonpath='{.status.qosClass}'", desc: "Inspect the calculated Quality of Service (Guaranteed, Burstable, BestEffort)", level: "read" }
    ],
    productionRules: [
      "Every single production container MUST declare both CPU and memory `requests` and `limits`: omitting requests makes the pod BestEffort and prone to eviction.",
      "Be cautious with CPU limits: Linux CFS quota throttling can cause latency spikes even when node CPU usage is below 50%."
    ],
    failureModes: [
      {
        pitfall: "Deploying pods with zero resource requests to an autoscaling Kubernetes cluster",
        impact: "The cluster autoscaler cannot calculate node capacity; hundreds of pods pile onto a single node until it runs out of memory and crashes.",
        resolution: "Enforce a `LimitRange` in every namespace requiring minimum and default requests."
      }
    ],
    realWorldScenario: {
      title: "Silent P99 Latency Spikes from Aggressive CPU Limits",
      situation: "A Node.js microservice suffered 800ms P99 latency spikes despite node CPU utilization staying below 35%.",
      investigation: "The container had `limits.cpu: 200m`. Under concurrent requests, the Linux CFS scheduler throttled the process whenever it exhausted its 20ms slice per 100ms CFS quota window.",
      fix: "Increased CPU limits to `1000m` while keeping requests at `250m`; P99 latency dropped from 800ms to 24ms immediately."
    }
  },
  {
    id: "autoscaling-hpa",
    name: "15. Autoscaling (HPA)",
    subtitle: "Dynamic Horizontal Pod Autoscaling & Metric Thresholds",
    category: "Lifecycle & Scaling",
    mentalModel: "Horizontal Pod Autoscaler (HPA) automatically scales the number of Pod replicas in a Deployment or StatefulSet based on observed CPU utilization, memory pressure, or custom application metrics.",
    coreMechanism: "The HPA controller queries the `metrics.k8s.io` API (provided by Metrics Server) or Prometheus custom metrics API every 15 seconds. It computes desired replicas using the formula: `desiredReplicas = ceil[currentReplicas * (currentMetricValue / targetMetricValue)]` and updates the deployment's replica count.",
    keySyntax: [
      {
        label: "Production HPA with Scaling Stabilization Windows",
        code: `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-deployment
  minReplicas: 3
  maxReplicas: 30
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300 # Wait 5m before scaling down (prevents flapping)
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60`,
        explanation: "`stabilizationWindowSeconds: 300` prevents rapid scale-up/scale-down flapping (thrashing) when traffic fluctuates."
      }
    ],
    productionCommands: [
      { cmd: "kubectl get hpa", desc: "List autoscalers, current vs target metrics, and active replica counts", level: "read" },
      { cmd: "kubectl describe hpa <hpa_name>", desc: "Inspect scaling event timeline, calculation errors, and metric conditions", level: "read" }
    ],
    productionRules: [
      "HPA based on CPU/memory utilization requires resource `requests` to be explicitly defined on all target containers.",
      "Never configure HPA and manual replica management in the same CI/CD pipeline: `kubectl scale` will be overridden by HPA."
    ],
    failureModes: [
      {
        pitfall: "Configuring HPA on memory utilization for a language runtime that does not release heap memory (e.g. Java/Go)",
        impact: "Memory stays elevated after traffic spikes. HPA scales to `maxReplicas` and never scales down, wasting cloud infrastructure costs.",
        resolution: "Autoscale based on CPU utilization, HTTP requests/sec, or queue depth rather than memory."
      }
    ],
    realWorldScenario: {
      title: "HPA Inaction During Black Friday Traffic Surge",
      situation: "An API was overwhelmed with 504 gateway timeouts. Despite heavy traffic, the deployment remained at 2 replicas.",
      investigation: "The containers had no `resources.requests.cpu` defined. Because requests were missing, HPA could not calculate utilization percentage and threw `MissingRequest` errors.",
      fix: "Added `requests.cpu: 500m` to the deployment spec; HPA immediately scaled the deployment from 2 to 24 pods."
    }
  },
  {
    id: "rolling-updates",
    name: "16. Rolling Updates",
    subtitle: "Zero-Downtime Releases, MaxSurge & Termination Grace Periods",
    category: "Lifecycle & Scaling",
    mentalModel: "A Rolling Update replaces old pods with new pods incrementally. By combining `maxSurge`, `maxUnavailable`, pre-stop hooks, and `terminationGracePeriodSeconds`, deployments achieve true zero-downtime releases.",
    coreMechanism: "When a deployment updates, the controller spawns new pods up to `maxSurge`. When a new pod becomes ready, the controller sends `SIGTERM` to an old pod. The pod executes its `preStop` hook, deregisters from the load balancer, drains active connections during the grace period, and is terminated.",
    keySyntax: [
      {
        label: "Zero-Downtime Termination Grace & PreStop Hook",
        code: `spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      terminationGracePeriodSeconds: 45
      containers:
        - name: app
          image: app:v2.0
          lifecycle:
            preStop:
              exec:
                # Sleep allows kube-proxy/iptables to update before process stops listening
                command: ["/bin/sh", "-c", "sleep 10"]`,
        explanation: "The `sleep 10` preStop hook prevents dropped connections by allowing endpoint updates to propagate across the cluster before the app exits."
      }
    ],
    productionCommands: [
      { cmd: "kubectl rollout pause deployment/<name>", desc: "Pause a running rollout to inspect intermediate canary state", level: "write" },
      { cmd: "kubectl rollout resume deployment/<name>", desc: "Resume a paused deployment rollout progression", level: "write" }
    ],
    productionRules: [
      "Always include a `preStop: exec: command: ['sleep', '10']` hook on web applications to prevent HTTP 502 errors during rolling deploys.",
      "Ensure `terminationGracePeriodSeconds` (default 30s) is larger than the longest expected in-flight HTTP request or transaction."
    ],
    failureModes: [
      {
        pitfall: "Deploying without a preStop hook on high-throughput microservices",
        impact: "The container process exits immediately on SIGTERM while kube-proxy is still routing packets to it, causing intermittent HTTP 502/504 errors.",
        resolution: "Add a 5-10 second sleep in `preStop` to allow load balancers and iptables to stop sending new traffic."
      }
    ],
    realWorldScenario: {
      title: "HTTP 502 Blips on Every Production Deploy",
      situation: "Every deployment caused a 15-second burst of HTTP 502 errors on customer checkout endpoints.",
      investigation: "The Node.js server shut down within 50ms of receiving SIGTERM, but Ingress-NGINX took 2-3 seconds to remove the Pod IP from its active upstream pool.",
      fix: "Added a `preStop` sleep hook of 10 seconds, completely eliminating deployment blips."
    }
  },
  {
    id: "helm",
    name: "17. Helm",
    subtitle: "The Kubernetes Package Manager & Parameterized Templating",
    category: "Cluster Admin & Security",
    mentalModel: "Helm is the package manager for Kubernetes. A Helm Chart bundles parameterized Kubernetes manifests, templates, and default values (`values.yaml`), enabling repeatable, versioned application deployments across dev, staging, and prod.",
    coreMechanism: "The Helm CLI renders Go templates using values passed via `values.yaml` or `--set`. It sends the compiled manifests to the Kubernetes API server, computes resource diffs, tracks release revisions in Kubernetes Secrets (`sh.helm.release.v1`), and coordinates atomic rollbacks.",
    keySyntax: [
      {
        label: "Helm Chart Template & Values Consumption",
        code: `# templates/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "mychart.fullname" . }}
spec:
  replicas: {{ .Values.replicaCount }}
  template:
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag | default .Chart.AppVersion }}"
          resources:
            {{- toYaml .Values.resources | nindent 12 }}

# CLI Invocation with value overrides:
helm upgrade --install core-api ./mychart \\
  --namespace production \\
  --set replicaCount=5 \\
  --values values.prod.yaml \\
  --atomic --timeout 5m`,
        explanation: "`--atomic` ensures that if the deployment fails health checks within 5 minutes, Helm automatically rolls back to the previous release."
      }
    ],
    productionCommands: [
      { cmd: "helm list -A", desc: "List all deployed Helm releases across all namespaces with revision numbers and status", level: "read" },
      { cmd: "helm diff upgrade <release> <chart>", desc: "Preview exact manifest changes before applying a release upgrade", level: "read" },
      { cmd: "helm rollback <release> <revision>", desc: "Roll back a Helm release to an exact historical revision number", level: "write" }
    ],
    productionRules: [
      "Always pass `--atomic` and `--timeout 5m` in CI/CD pipelines to ensure automated rollbacks on failed releases.",
      "Never modify resources deployed by Helm using manual `kubectl edit`: this causes out-of-band drift that Helm cannot reconcile."
    ],
    failureModes: [
      {
        pitfall: "Running `helm upgrade` without `--atomic`, leaving a broken release in `pending-upgrade` status",
        impact: "The Helm release enters a stuck state, rejecting subsequent upgrades until manually deleted from Secrets.",
        resolution: "Always use `--atomic` or roll back manually via `helm rollback`."
      }
    ],
    realWorldScenario: {
      title: "The Production Freeze Caused by Manual Out-of-Band `kubectl edit`",
      situation: "An on-call engineer manually changed a deployment memory limit using `kubectl edit`. A subsequent Helm pipeline failed with a three-way merge conflict.",
      investigation: "The cluster's live state diverged from the Helm release secret state, causing Helm's merge algorithm to fail.",
      fix: "Committed the memory change directly to `values.prod.yaml` in Git and reapplied via Helm."
    }
  },
  {
    id: "kubectl",
    name: "18. Kubectl",
    subtitle: "API Gateway CLI & Administrative Control Powerhouse",
    category: "Cluster Admin & Security",
    mentalModel: "`kubectl` is the official CLI client for the Kubernetes API server. It converts terminal commands into authenticated HTTP REST calls (`/api/v1/...`) using credentials in `~/.kube/config`.",
    coreMechanism: "Kubectl negotiates API versions with the cluster, validates schemas client-side using OpenAPI definitions, and executes HTTP requests with TLS client certificates or bearer tokens. Commands like `port-forward` use SPDY or WebSockets to tunnel raw TCP streams through the API server into pod network namespaces.",
    keySyntax: [
      {
        label: "Essential Production Kubectl Invocations",
        code: `# 1. Secure Port-Forwarding (Bypasses Ingress/Load Balancers)
kubectl port-forward svc/postgres 5432:5432 -n database

# 2. Extract specific field using JSONPath
kubectl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="InternalIP")].address}'

# 3. Stream logs across all pods sharing a label
kubectl logs -f -l app=order-api --tail=50 --max-log-requests=10

# 4. Safe Node Drain for Maintenance
kubectl drain <node_name> --ignore-daemonsets --delete-emptydir-data`,
        explanation: "`kubectl drain` cordons the node (preventing new pods) and safely evicts existing pods to other worker nodes."
      }
    ],
    productionCommands: [
      { cmd: "kubectl api-resources", desc: "List all supported resource types, shortnames, API groups, and whether they are namespaced", level: "read" },
      { cmd: "kubectl cordon <node_name>", desc: "Mark a worker node as unschedulable without evicting running workloads", level: "write" },
      { cmd: "kubectl uncordon <node_name>", desc: "Mark a previously cordoned node as available for scheduling", level: "write" }
    ],
    productionRules: [
      "Always double-check your current cluster context (`kubectl config current-context`) before running any mutating commands.",
      "Use `kubectl drain` with `--delete-emptydir-data` cautiously: any data in pod `emptyDir` volumes will be permanently destroyed."
    ],
    failureModes: [
      {
        pitfall: "Accidentally running `kubectl delete namespace` instead of deleting a single resource in production",
        impact: "Kubernetes enters a terminating cascade, deleting every pod, service, secret, and volume in the namespace permanently.",
        resolution: "Use tools like `kubectx`/`kubens` with colored prompt prompts and enforce RBAC guards preventing namespace deletion."
      }
    ],
    realWorldScenario: {
      title: "Context Confusion Destroys Production RDS Secret",
      situation: "An engineer intended to reset a staging secret, but ran the delete command against the production context.",
      investigation: "The engineer had switched contexts in another terminal tab, leaving the current shell pointed at production.",
      fix: "Installed `kube-ps1` context indicators in all developer shell prompts and revoked write access to production clusters from personal developer laptops."
    }
  },
  {
    id: "rbac",
    name: "19. RBAC",
    subtitle: "Role-Based Access Control, ServiceAccounts & Least Privilege",
    category: "Cluster Admin & Security",
    mentalModel: "RBAC regulates access to the Kubernetes API based on the roles of individual users or in-cluster ServiceAccounts. Every API request is authenticated, authorized against RBAC rules, and validated by Admission Controllers.",
    coreMechanism: "A **Role** defines permissions (verbs: `get`, `list`, `watch`, `create`, `delete`) on resources (`pods`, `services`) within a single namespace. A **ClusterRole** defines permissions cluster-wide. A **RoleBinding** or **ClusterRoleBinding** binds those permissions to a Subject (User, Group, or ServiceAccount).",
    keySyntax: [
      {
        label: "Least-Privilege ServiceAccount & RoleBinding",
        code: `apiVersion: v1
kind: ServiceAccount
metadata:
  name: deployment-watcher
  namespace: app-prod

---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: pod-reader
  namespace: app-prod
rules:
  - apiGroups: [""] # Core API group
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]

---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: read-pods-binding
  namespace: app-prod
subjects:
  - kind: ServiceAccount
    name: deployment-watcher
    namespace: app-prod
roleRef:
  kind: Role
  name: pod-reader
  apiGroup: rbac.authorization.k8s.io`,
        explanation: "Grants read-only access to pods and pod logs in namespace app-prod without granting write or secret access."
      }
    ],
    productionCommands: [
      { cmd: "kubectl auth can-i create deployments --as=system:serviceaccount:default:my-sa", desc: "Test whether a specific service account has permission to execute an action", level: "read" },
      { cmd: "kubectl get rolebindings,clusterrolebindings -A", desc: "Audit all active permission bindings across the cluster", level: "read" }
    ],
    productionRules: [
      "Never bind `cluster-admin` to default ServiceAccounts: this gives any compromised container full administrative control over the entire cluster.",
      "Disable automatic ServiceAccount token mounting (`automountServiceAccountToken: false`) for application pods that do not interact with the Kubernetes API."
    ],
    failureModes: [
      {
        pitfall: "Running a customer-facing web app with a ServiceAccount bound to `cluster-admin`",
        impact: "An attacker exploiting an RCE vulnerability in the web app reads the in-container token (`/var/run/secrets/kubernetes.io/serviceaccount/token`) and takes over the entire Kubernetes cluster.",
        resolution: "Set `automountServiceAccountToken: false` and grant only the minimum required RBAC permissions."
      }
    ],
    realWorldScenario: {
      title: "Cluster Compromise via an Overprivileged Ingress Controller",
      situation: "Cryptominers were discovered running on control plane nodes.",
      investigation: "A public-facing app was compromised. The pod mounted a default service account that had been granted `ClusterRoleBinding` with `verbs: [*]` on `resources: [*]` by a lazy installation script.",
      fix: "Audited and revoked overprivileged ClusterRoleBindings; isolated control-plane nodes and restricted service account tokens."
    }
  },
  {
    id: "troubleshooting-pods",
    name: "20. Troubleshooting Pods",
    subtitle: "The Diagnostic Triage Ladder: CrashLoopBackOff to Eviction",
    category: "Troubleshooting",
    mentalModel: "Pod failures follow a deterministic triage ladder: Pending (scheduling/quota) -> ContainerCreating (images/volumes/secrets) -> CrashLoopBackOff (exit codes/application panic) -> OOMKilled (memory limits) -> Evicted (disk/node pressure).",
    coreMechanism: "Diagnostics flow through a standardized protocol: inspect status with `kubectl get pod`, inspect events and health transitions with `kubectl describe pod`, inspect application output with `kubectl logs --previous`, and inspect node-level cgroup pressure via `kubectl top`.",
    keySyntax: [
      {
        label: "The 5-Step Diagnostic Protocol",
        code: `# Step 1: Check Pod Status and Restart Count
kubectl get pods -l app=core -o wide

# Step 2: Inspect Lifecycle Events & Failure Reasons (Last 20 lines)
kubectl describe pod <pod_name> | grep -A 10 Events:

# Step 3: Read Application Logs from the Crashed Instance
kubectl logs <pod_name> --previous --tail=100

# Step 4: Check if Exit Code was OOM (137 = 128 + SIGKILL 9)
kubectl get pod <pod_name> -o jsonpath='{.status.containerStatuses[*].lastState.terminated.exitCode}'

# Step 5: Ephemeral Debug Container Injection (For Slim/Distroless pods)
kubectl debug -it <pod_name> --image=busybox:1.36 --target=<container_name>`,
        explanation: "`kubectl debug` attaches a temporary debugging container to a running pod's process namespace, enabling tools like curl and netstat."
      }
    ],
    productionCommands: [
      { cmd: "kubectl get pods --field-selector status.phase!=Running", desc: "Filter and list all failing, pending, or crash-looping pods in the current namespace", level: "read" },
      { cmd: "kubectl logs <pod_name> -c <container_name> --previous", desc: "Retrieve logs emitted by the previous crashed container instance before restart", level: "read" }
    ],
    productionRules: [
      "Exit code 137 always means SIGKILL: 99% of the time it is caused by exceeding the container's memory `limit` (OOMKilled).",
      "Exit code 1 means application unhandled exception, syntax error, or missing required environment variable."
    ],
    failureModes: [
      {
        pitfall: "Blindly restarting a CrashLoopBackOff pod without checking `kubectl logs --previous`",
        impact: "The container restarts, the previous crash logs are lost if not shipped, and the root cause remains unknown.",
        resolution: "Always run `kubectl logs <pod> --previous` before deleting or restarting failing pods."
      }
    ],
    realWorldScenario: {
      title: "The Mystery of the Midnight CrashLoopBackOff Cascade",
      situation: "An authentication service began cycling through `CrashLoopBackOff` on every node at midnight.",
      investigation: "Running `kubectl describe pod` showed exit code 1. `kubectl logs <pod> --previous` revealed an unhandled exception: `Error: JWT signing certificate has expired`. The annual signing certificate had lapsed at 00:00 UTC.",
      fix: "Updated the certificate Secret and triggered `kubectl rollout restart deployment/auth-service`."
    }
  }
];

