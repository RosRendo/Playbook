# 20: CI/CD & CONTINUOUS DELIVERY ENGINEERING PLAYBOOK

> **The 20 Architectural Pillars of Production Pipeline Engineering**  
> *From Directed Acyclic Graph (DAG) Stages & OIDC Cloud Federation to Blue-Green Traffic Flipping, Canary Prometheus Analysis, ArgoCD GitOps, and SLSA Supply Chain Hardening.*

---

## Architecture Matrix: The 20 Pillars

| # | Pillar | Category | Primary Focus | Production Threat / Anti-Pattern |
|---|--------|----------|---------------|----------------------------------|
| **01** | **Pipeline** | Core Foundations | Automated state machine from commit to production | Monolithic single-script CI running tests after 30m builds |
| **02** | **Build Stages** | Core Foundations | DAG execution graphs, parallelism, fail-fast gates | `if: always()` deploying broken commits despite test failures |
| **03** | **GitHub Actions** | Engines & Runners | Event-driven workflows, composite actions, OIDC | Pull request from fork stealing secrets via `pull_request_target` |
| **04** | **GitLab CI** | Engines & Runners | Centralized `.gitlab-ci.yml`, Auto DevOps, manual gates | Static global cache keys corrupting dependencies across branches |
| **05** | **Jenkins** | Engines & Runners | Groovy pipelines, controller-agent distributed model | Running untrusted build scripts directly on Jenkins controller |
| **06** | **Runners and Agents** | Engines & Runners | Ephemeral compute workhorses (cloud vs self-hosted ARC) | Persistent self-hosted runners leaking cross-job state |
| **07** | **Artifacts** | Core Foundations | Immutable build outputs (bundles, tarballs, test reports) | Uploading entire repo root with `node_modules` and `.git` |
| **08** | **Caching Dependencies** | Quality & Caching | Content-addressable lockfile hashing (`pnpm-lock.yaml`) | Unhashed static cache keys serving outdated dependencies |
| **09** | **Automated Tests** | Quality & Caching | Unit, integration & sharded E2E test quality gates | Flaky test blindness leading to ignored production outages |
| **10** | **Linting** | Quality & Caching | AST static analysis, Biome, ShellCheck, strict TypeScript | Allowing warnings in CI (`--max-warnings > 0`) masking bugs |
| **11** | **Secrets in CI** | Security & Governance | Credential masking, KMS encryption, OIDC federation | Printing base64-encoded secrets to public build logs |
| **12** | **Environments** | Security & Governance | Deployment targets (dev, staging, prod), scoped secrets | Shared `DATABASE_URL` allowing PR test to wipe production |
| **13** | **Approvals** | Security & Governance | Human-in-the-loop sign-offs, change freezes, dual review | Omitting approval timeouts, deploying stale code 4 days later |
| **14** | **Blue-Green Deploy** | Release Strategies | Two identical environments, instant router traffic flip | Breaking database migration crashing active Blue environment |
| **15** | **Canary Releases** | Release Strategies | Incremental traffic exposure (5% -> 25% -> 100%) + metrics | Testing canary on low-traffic service lacking metric data |
| **16** | **Rollbacks** | Release Strategies | Fast recovery: `git revert` vs `kubectl rollout undo` | Cluster-only rollback without reverting Git (reintroduced next PR) |
| **17** | **Versioning** | Core Foundations | SemVer (`MAJOR.MINOR.PATCH`) contracts & Git commit SHAs | Breaking API changes released under patch or minor bumps |
| **18** | **Release Tags** | Core Foundations | Annotated GPG-signed Git tags, release changelogs | Force-pushing existing release tags (`git tag -f`) |
| **19** | **GitOps with ArgoCD** | GitOps & Delivery | Git as single source of truth, automated reconciliation | Storing GitOps manifests in same repo as code (infinite loop) |
| **20** | **Pipeline Security** | Security & Governance | SLSA framework, SBOMs, Cosign keyless signing | Compromised unpinned third-party actions injecting backdoors |

---

## Detailed Architectural Breakdown

### 1. Pipeline
- **Mental Model**: A deterministic state machine triggered by repository webhooks that validates, compiles, tests, and delivers software.
- **Fail-Fast Order**: Fast static validation (linting, type-checking) executes first (<60s), followed by parallelized automated tests, followed by container packaging, and finally gated deployment.
- **Golden Rule**: If a pipeline takes longer than 10 minutes, developers will avoid running tests locally and batch up risky commits.

---

### 2. Build Stages
- **Mental Model**: Tasks are modeled as a Directed Acyclic Graph (DAG). Stages define execution barriers where downstream jobs depend explicitly on parent success (`needs: [lint, test]`).
- **Production Standard**: Always decouple the build/compile stage from the deploy stage, allowing failed deploys to be retried without recompiling code.

---

### 3. GitHub Actions
- **Mental Model**: Event-driven automation executed on isolated VMs or containers.
- **Modern Security**: Never store long-lived cloud credentials in repository secrets. Use **OpenID Connect (OIDC)** to authenticate with AWS STS, Google Cloud, or Azure using short-lived (15-minute) cryptographic JWT tokens:
  ```yaml
  permissions:
    id-token: write
    contents: read
  ```

---

### 4. GitLab CI
- **Mental Model**: Centralized, declarative `.gitlab-ci.yml` managing stages, environments, and container registries natively.
- **Production Rule**: Use dynamic cache keys (`key: $CI_COMMIT_REF_SLUG`) and set `artifacts: expire_in: 7 days` to prevent disk bloat.

---

### 5. Jenkins
- **Mental Model**: Controller-Agent architecture where the Jenkins Controller schedules jobs and delegates execution to ephemeral worker agents.
- **Security Rule**: Set the executor count on the Jenkins Controller to 0. Workloads must execute inside ephemeral container pods on Kubernetes or dedicated agent VMs to protect the master credentials store.

---

### 6. Runners and Agents
- **Mental Model**: Compute engines that execute pipeline steps via outbound long-polling.
- **Ephemeral Rule**: Self-hosted runners must be destroyed after every single job (e.g. using Actions Runner Controller on Kubernetes) to prevent cross-job state leaks and persistent malware.

---

### 7. Artifacts
- **Mental Model**: Immutable outputs (compiled binaries, Docker images, test reports) passed across pipeline stages or preserved for release.
- **Production Standard**: Set strict retention periods (`retention-days: 7`) and never package `.git` or `node_modules` into artifact tarballs.

---

### 8. Caching Dependencies
- **Mental Model**: Preserves downloaded package registries (`pnpm-lock.yaml`, `go.sum`, `Cargo.lock`) between runs using content-addressable SHA256 hashes.
- **Cache Key Pattern**:
  ```yaml
  key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
  restore-keys: |
    ${{ runner.os }}-pnpm-
  ```

---

### 9. Automated Tests
- **Mental Model**: Non-negotiable quality gate executing unit, integration, and E2E smoke tests.
- **Parallel Sharding**: Distribute heavy test suites across multiple parallel runner shards (`matrix: shard: [1/4, 2/4, 3/4, 4/4]`), cutting test runtimes by 75%.
- **Zero-Tolerance Rule**: Quarantine flaky tests immediately. Flaky test suites erode developer trust and mask real production outages.

---

### 10. Linting
- **Mental Model**: Static Abstract Syntax Tree (AST) analysis catching syntax errors, type mismatches, and style violations in under 30 seconds.
- **Enforcement**: Run `eslint --max-warnings 0` and `tsc --noEmit` as mandatory PR gates.

---

### 11. Secrets in CI
- **Mental Model**: Sensitive credentials encrypted at rest and masked in logs.
- **Security Rule**: Never print environment variables in build logs. Migrate all cloud provider authentication to short-lived OIDC federation.

---

### 12. Environments
- **Mental Model**: Deployment boundary abstractions (`development`, `staging`, `production`) enforcing scoped secrets, required reviewers, and branch protection rules.
- **Isolation Rule**: Staging environments must never have access to production databases or payment credentials.

---

### 13. Approvals
- **Mental Model**: Human-in-the-loop sign-off before releasing to production or applying infrastructure changes.
- **Governance**: Enforce "Prevent self-review" so the PR author cannot approve their own production deployment, and attach timeouts to prevent stale deployments.

---

### 14. Blue-Green Deploy
- **Mental Model**: Two identical production environments (Blue = live, Green = idle). Deploy to Green, verify health, and flip the router/load balancer instantly.
- **Database Rule**: Schema changes must be backward-compatible (Expand/Contract pattern) so both Blue and Green code versions can operate concurrently during the switch.

---

### 15. Canary Releases
- **Mental Model**: Route a small percentage of live traffic (e.g. 5% -> 20% -> 100%) to the new version while monitoring Prometheus metrics (error rates, latency).
- **Automated Rollback**: If HTTP 5xx errors exceed thresholds during analysis, the canary controller (Argo Rollouts, Flagger) automatically aborts and restores 100% traffic to stable pods.

---

### 16. Rollbacks
- **Mental Model**: Emergency recovery protocol returning services to their previous known-good state.
- **Pure GitOps**: Execute rollbacks via `git revert HEAD` and push to `main`. This maintains an unbroken cryptographic audit trail and avoids configuration drift between cluster and repository.

---

### 17. Versioning
- **Mental Model**: Semantic Versioning (`MAJOR.MINOR.PATCH`) communicates contracts to consumers. Git commit SHAs guarantee exact code traceability.
- **Production Standard**: Pair SemVer with short commit SHAs: `myorg/api:v1.4.2-sha-7f8a92b`.

---

### 18. Release Tags
- **Mental Model**: Immutable Git pointers to specific release commits.
- **Integrity**: Always use GPG-signed annotated tags (`git tag -s v2.4.0`) and enforce protected tag rules in GitHub preventing tag deletion or force-pushing.

---

### 19. GitOps with ArgoCD
- **Mental Model**: Git is the single source of truth. ArgoCD continuously reconciles cluster state against Git manifests.
- **Production Settings**: Enable `selfHeal: true` and `prune: true` so any unauthorized out-of-band cluster edits are automatically overwritten.

---

### 20. Pipeline Security
- **Mental Model**: Supply-chain protection adhering to the SLSA framework.
- **Checklist**:
  1. Pin all third-party actions to full commit SHAs.
  2. Scan container images for CVEs with Trivy.
  3. Generate Software Bill of Materials (SBOMs).
  4. Cryptographically sign OCI containers with keyless Cosign.
  5. Enforce signature validation at admission time in Kubernetes using Kyverno.

