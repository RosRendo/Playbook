# 23: INFRASTRUCTURE AS CODE (IAC) & AUTOMATION PLAYBOOK

> **The 20 Architectural Pillars of Production Infrastructure as Code**  
> *From Terraform State Locking & Declarative Import Blocks to Ansible Idempotency, CloudFormation Stacks, Pulumi TypeScript, and Policy-as-Code Guardrails.*

---

## Architecture Matrix: The 20 Pillars

| # | Pillar | Category | Primary Focus | Production Threat / Anti-Pattern |
|---|--------|----------|---------------|----------------------------------|
| **01** | **Terraform Basics** | Terraform Core | Declarative HCL, desired state engine, execution DAG | Using `local-exec` provisioners breaking idempotency |
| **02** | **Providers** | Terraform Core | gRPC plugin bridges, multi-region provider aliasing | Unpinned provider versions auto-pulling breaking major updates |
| **03** | **Resources** | Terraform Core | Lifecycle blocks (`create_before_destroy`, `prevent_destroy`) | Accidental destruction of stateful RDS databases on apply |
| **04** | **Variables & Output** | Terraform Core | Custom validation regex, sensitive masking, outputs | Assuming `sensitive = true` encrypts secrets in state files |
| **05** | **State Files** | State & Locking | Single source of truth, JSON schema, resource mapping | Committing unencrypted state files with plaintext secrets to Git |
| **06** | **Remote State** | State & Locking | S3 backend, KMS encryption, tiered architecture | Monolithic single-state file causing 30m plan bottlenecks |
| **07** | **State Locking** | State & Locking | DynamoDB mutex lock, preventing concurrent applies | Concurrent CI/CD applies corrupting state serial sequence |
| **08** | **Module** | Terraform Core | Composable abstractions, root vs child, version pinning | Sourcing modules from mutable branch names (`?ref=main`) |
| **09** | **Workspaces** | Workflow & Lifecycle | CLI state partitioning vs directory-based separation | Accidental `terraform destroy` in prod due to workspace confusion |
| **10** | **Plan and Apply** | Workflow & Lifecycle | Immutable plan files (`-out=tfplan`), dry-run predictability | Bare `apply` in CI applying unreviewed concurrent PR changes |
| **11** | **Drift Detection** | Workflow & Lifecycle | Reconciling out-of-band manual console edits | Routine apply silently deleting manual emergency firewall rules |
| **12** | **Importing Resources** | Workflow & Lifecycle | Declarative `import {}` blocks (1.5+) vs legacy CLI | Importing with incomplete HCL triggering attribute wipe on apply |
| **13** | **Ansible** | Ansible & Config | Agentless automation, SSH transport, Python modules | Running non-idempotent shell scripts duplicating config lines |
| **14** | **Playbooks** | Ansible & Config | Declarative YAML tasks, handlers, `notify` triggers | Restarting services directly in tasks rather than via handlers |
| **15** | **Roles** | Ansible & Config | Standard directory hierarchy, Galaxy, `defaults/` vs `vars/` | Hardcoding internal variables in `vars/` preventing overrides |
| **16** | **Inventory** | Ansible & Config | Static INI/YAML vs dynamic cloud inventory plugins | Static IP lists breaking when cloud auto-scaling replaces instances |
| **17** | **Idempotency** | Workflow & Lifecycle | Multiple runs yield identical state (`changed=0`) | Self-inflicted outages from scripts modifying files on every run |
| **18** | **CloudFormation** | Cloud & Modern IaC | Native AWS stacks, Change Sets, `DeletionPolicy: Retain` | Stack deletion permanently purging S3 and RDS storage assets |
| **19** | **Pulumi** | Cloud & Modern IaC | TypeScript/Python code-first IaC with real programming logic | Non-deterministic runtime calls (`Math.random()`) busting diffs |
| **20** | **Policy as Code** | Governance & Policy | Open Policy Agent (OPA), Rego, Checkov, pre-deploy gates | Manual PR review missing open `0.0.0.0/0` ingress rules |

---

## Detailed Architectural Breakdown

### 1. Terraform Basics
- **Mental Model**: Declarative infrastructure definition using HashiCorp Configuration Language (HCL). You declare the desired end state; Terraform compiles the execution graph (DAG) to determine create, update, or destroy actions.
- **Fail-Fast Rule**: Always validate syntax locally via `terraform fmt -check` and `terraform validate` before committing to version control.

---

### 2. Providers
- **Mental Model**: Standalone Go binaries communicating with Terraform Core over local gRPC sockets. Providers translate high-level HCL blocks into target cloud API calls.
- **Provider Aliasing**: Enables multi-region deployments in a single configuration (e.g. creating ACM certificates in `us-east-1` for CloudFront while provisioning compute in `eu-central-1`).
- **Security Standard**: Always commit `.terraform.lock.hcl` to Git to cryptographically lock package checksums across developer and CI environments.

---

### 3. Resources
- **Mental Model**: The primary infrastructure building blocks.
- **Lifecycle Overrides**:
  - `prevent_destroy = true`: Hard circuit breaker preventing accidental deletion of databases and storage vaults.
  - `create_before_destroy = true`: Spins up replacement instances before terminating old ones, preventing deployment dropouts.
  - `ignore_changes`: Prevents Terraform from fighting with external auto-scalers or taggers.

---

### 4. Variables and Output
- **Mental Model**: Input parameterization and output export.
- **Validation & Redaction**: Use custom `validation {}` blocks to reject invalid inputs at plan time. Mark sensitive credentials as `sensitive = true` to redact them from terminal logs (note: secrets remain plaintext inside the state file!).

---

### 5. State Files
- **Mental Model**: Structured JSON document acting as the single source of truth mapping HCL code declarations to physical cloud resource IDs.
- **Critical Warning**: Never commit `terraform.tfstate` to Git. State files contain unmasked passwords, private keys, and cloud metadata.

---

### 6. Remote State
- **Mental Model**: Storing state files in a centralized, encrypted remote object store (Amazon S3, Google Cloud Storage, Terraform Cloud).
- **Architectural Layering**: Decompose infrastructure into decoupled state keys (`prod/network`, `prod/database`, `prod/compute`) rather than maintaining a single massive monolithic state file.

---

### 7. State Locking
- **Mental Model**: Distributed mutual exclusion (mutex) lock (e.g. Amazon DynamoDB table) that prevents concurrent pipeline applies from corrupting state data.
- **Prerequisite**: A DynamoDB table with a single primary partition key named `LockID` (string).

---

### 8. Module
- **Mental Model**: Composable, reusable infrastructure abstractions. Child modules encapsulate low-level cloud resources into standardized building blocks.
- **Version Pinning**: Always pin module sources to immutable semantic Git tags (`?ref=v2.4.0`); never source from mutable branch heads like `?ref=main`.

---

### 9. Workspaces
- **Mental Model**: CLI state partitioning using a single codebase.
- **Production Standard**: Use workspaces for ephemeral PR preview environments; use distinct directory hierarchies (`environments/prod`, `environments/dev`) with separate AWS accounts for production workloads.

---

### 10. Plan and Apply
- **Two-Phase Determinism**:
  1. `terraform plan -out=tfplan`: Compiles and saves an immutable execution plan binary during pull request review.
  2. `terraform apply tfplan`: Applies the exact reviewed plan without live re-evaluation, eliminating race conditions.

---

### 11. Drift Detection
- **Mental Model**: Reconciling divergence between declared HCL code and real-world out-of-band console edits.
- **Reconciliation Command**: `terraform plan -refresh-only` updates the state file to acknowledge manual changes without triggering resource destruction. Run scheduled CI drift detection pipelines using `terraform plan -detailed-exitcode`.

---

### 12. Importing Resources
- **Modern HCL 1.5+ Syntax**:
  ```hcl
  import {
    to = aws_security_group.legacy_sg
    id = "sg-0123456789abcdef0"
  }
  ```
- **Automated Generation**: Run `terraform plan -generate-config-out=generated.tf` to auto-author HCL resource definitions for existing cloud assets.

---

### 13. Ansible
- **Mental Model**: Agentless configuration management executing Python modules over standard SSH transport.
- **Separation of Concerns**: Use Terraform to provision cloud infrastructure (virtual machines, networks, databases); use Ansible to configure the OS, install software packages, and template application configurations.

---

### 14. Playbooks
- **Mental Model**: Declarative YAML task blueprints mapping managed host groups to ordered configuration tasks.
- **Handlers**: Use `notify` triggers to run service restarts only when configuration files actually change, preventing unnecessary service dropouts.

---

### 15. Roles
- **Mental Model**: Standardized directory hierarchy (`tasks/`, `handlers/`, `templates/`, `defaults/`, `vars/`) packaging reusable automation blueprints.
- **Precedence**: Put user-customizable variables in `defaults/main.yml` (lowest precedence) so consumers can easily override them in playbooks.

---

### 16. Inventory
- **Mental Model**: Host management topology.
- **Dynamic Inventory**: In cloud environments, use dynamic inventory plugins (`aws_ec2.yaml`) that query cloud APIs in real time and automatically group instances by tags (`@env_production`, `@role_api`).

---

### 17. Idempotency
- **The Golden Law**: Running automation multiple times against a system that is already in the target state must yield zero changes (`changed=0`).
- **Best Practice**: Use native declarative modules (`ansible.builtin.lineinfile`, `ansible.builtin.template`) rather than raw shell scripts.

---

### 18. CloudFormation
- **Mental Model**: Native AWS declarative JSON/YAML infrastructure service operating serverlessly in the AWS management plane.
- **Safety Standard**: Always specify `DeletionPolicy: Retain` on production S3 buckets, RDS databases, and KMS keys to prevent accidental data loss upon stack deletion.

---

### 19. Pulumi
- **Mental Model**: Modern code-first IaC using general-purpose programming languages (TypeScript, Python, Go) while retaining declarative state reconciliation.
- **Benefits**: Brings compile-time type safety, standard loops, object-oriented abstractions, and native unit testing frameworks (`vitest`, `pytest`) to infrastructure engineering.

---

### 20. Policy as Code (PaC)
- **Mental Model**: Automated compliance and security guardrails evaluated before deployment.
- **Tooling**: Use Open Policy Agent (OPA) with Rego or Checkov to inspect compiled `tfplan` JSON binaries in CI pipelines, automatically blocking any plan that declares unencrypted storage, public S3 buckets, or unrestricted `0.0.0.0/0` ingress rules.

