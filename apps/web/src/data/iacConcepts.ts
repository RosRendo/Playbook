export interface IacConcept {
  id: string;
  name: string;
  subtitle: string;
  category: "Terraform Core" | "State & Locking" | "Workflow & Lifecycle" | "Ansible & Config Management" | "Cloud & Modern IaC Engines" | "Governance & Policy";
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

export const IAC_CONCEPTS: IacConcept[] = [
  {
    id: "terraform-basics",
    name: "1. Terraform Basics",
    subtitle: "Declarative HCL, Desired State Engine & Directed Execution Graphs",
    category: "Terraform Core",
    mentalModel: "Terraform is an open-source Infrastructure as Code tool that provisions cloud and on-premise resources using HashiCorp Configuration Language (HCL). You declare the 'what' (desired end state); Terraform calculates the 'how' (execution graph).",
    coreMechanism: "Terraform builds an in-memory Directed Acyclic Graph (DAG) of all declared resources, evaluating implicit dependencies (e.g. referencing `aws_vpc.main.id`). It reads current cloud state via APIs, calculates a 3-way diff (Code vs State vs Real Cloud), and generates an execution plan with the minimal sequence of creates, updates, and deletes required to reach desired state.",
    keySyntax: [
      {
        label: "Declarative HCL Resource Declaration",
        code: `terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

resource "aws_s3_bucket" "app_storage" {
  bucket        = "corp-prod-assets-2026"
  force_destroy = false

  tags = {
    Environment = "production"
    ManagedBy   = "terraform"
  }
}`,
        explanation: "HCL configuration defines target state declaratively; provider version constraints guarantee reproducible builds."
      }
    ],
    productionCommands: [
      { cmd: "terraform init", desc: "Initialize working directory, download provider plugins, and configure backend state", level: "write" },
      { cmd: "terraform fmt -check -recursive", desc: "Validate that all HCL configuration files adhere to standard canonical styling", level: "read" },
      { cmd: "terraform validate", desc: "Verify syntactic correctness and internal consistency of HCL configuration files", level: "read" }
    ],
    productionRules: [
      "Always pin both `required_version` (Terraform core) and provider versions in `required_providers` to prevent breaking updates.",
      "Never run imperative configuration scripts inside Terraform when native declarative resources exist: avoid `local-exec`."
    ],
    failureModes: [
      {
        pitfall: "Using `local-exec` provisioners to run arbitrary bash commands during resource creation",
        impact: "Breaks idempotency; if the bash command fails halfway, Terraform marks the resource as tainted and recreates it on every run.",
        resolution: "Use native cloud-init user-data, SSM documents, or dedicated configuration management tools like Ansible."
      }
    ],
    realWorldScenario: {
      title: "The Unpinned AWS Provider 5.0 Breaking Upgrade Disaster",
      situation: "A team ran `terraform apply` in CI. The AWS provider upgraded from v4 to v5 overnight, triggering a planned destruction of 40 S3 buckets.",
      investigation: "The root module specified `version = '>= 4.0'` instead of a pessimistic constraint (`~> 4.60`), auto-pulling breaking major updates.",
      fix: "Enforced pessimistic version constraints `~> 5.30` and committed `.terraform.lock.hcl` to Git."
    }
  },
  {
    id: "providers",
    name: "2. Providers",
    subtitle: "Plugin Architecture: gRPC Bridges, Multi-Region & Aliasing",
    category: "Terraform Core",
    mentalModel: "Providers are standalone Go binary plugins that bridge Terraform core with target cloud APIs (AWS, Azure, GCP, Cloudflare, Kubernetes). Terraform communicates with providers over local gRPC RPC sockets.",
    coreMechanism: "Terraform core does not know what an 'EC2 instance' or 'Kubernetes Pod' is. The provider translates high-level HCL schema definitions into target REST/gRPC API calls. **Provider Aliasing** enables deploying resources across multiple regions or accounts within a single module (e.g. creating ACM certificates in `us-east-1` for CloudFront while deploying compute in `eu-west-1`).",
    keySyntax: [
      {
        label: "Multi-Region Provider Aliasing in HCL",
        code: `# Primary Provider (Frankfurt)
provider "aws" {
  region = "eu-central-1"
}

# Aliased Secondary Provider (N. Virginia for CloudFront TLS)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Resource explicitly bound to the aliased provider:
resource "aws_acm_certificate" "cdn_cert" {
  provider          = aws.us_east_1 # Explicit provider mapping!
  domain_name       = "api.mycompany.com"
  validation_method = "DNS"
}`,
        explanation: "CloudFront requires ACM SSL certificates to reside in us-east-1; aliased providers make multi-region deployments seamless."
      }
    ],
    productionCommands: [
      { cmd: "terraform providers", desc: "Display a full tree of all direct and transitive providers required by modules", level: "read" },
      { cmd: "terraform providers lock -platform=linux_amd64 -platform=darwin_arm64", desc: "Generate multi-platform cryptographic checksums in .terraform.lock.hcl", level: "write" }
    ],
    productionRules: [
      "Always commit the `.terraform.lock.hcl` dependency lock file to Git: it cryptographically pins exact provider package hashes.",
      "Never hardcode static API credentials inside `provider` blocks: authenticate via ambient environment variables or AWS IAM roles."
    ],
    failureModes: [
      {
        pitfall: "Committing AWS secret access keys directly inside the `provider 'aws'` block in HCL",
        impact: "Git history leaks credentials to public/private repos; automated bots scrape keys and launch cryptominers within minutes.",
        resolution: "Leave the provider block empty (`provider 'aws' {}`) and authenticate via AWS STS or environment variables."
      }
    ],
    realWorldScenario: {
      title: "Cross-Architecture Provider Lock Failure in CI",
      situation: "A developer on an Apple Silicon M3 Mac ran `terraform init`, but the Linux CI pipeline failed with `missing provider checksum`.",
      investigation: "The lockfile only contained hashes for `darwin_arm64`. The CI builder on `linux_amd64` was rejected by Terraform security checks.",
      fix: "Ran `terraform providers lock -platform=linux_amd64 -platform=darwin_arm64` to record cross-platform package digests."
    }
  },
  {
    id: "resources",
    name: "3. Resources",
    subtitle: "Core Building Blocks: Lifecycle Rules & Immutability",
    category: "Terraform Core",
    mentalModel: "Resources are the fundamental infrastructure components declared in HCL. Each resource block describes an infrastructure object (e.g. compute instance, database, DNS record) and manages its full CRUD lifecycle.",
    coreMechanism: "Terraform inspects resource attributes. When an attribute change cannot be applied in-place (e.g. changing an EC2 instance AMI or RDS database name), Terraform defaults to **Destroy-and-Recreate**. **Lifecycle blocks** (`create_before_destroy`, `prevent_destroy`, `ignore_changes`) override default behavior to protect production uptime.",
    keySyntax: [
      {
        label: "Production Lifecycle Guards",
        code: `resource "aws_instance" "app_server" {
  ami           = "ami-0123456789abcdef0"
  instance_type = "c6i.xlarge"

  lifecycle {
    # 1. Spin up replacement instance BEFORE killing the old one (Zero downtime)
    create_before_destroy = true

    # 2. Prevent accidental 'terraform destroy' deletion disasters
    prevent_destroy = true

    # 3. Ignore changes made by external auto-scaling or AWS tags
    ignore_changes = [
      tags["LastScanned"],
      user_data
    ]
  }
}`,
        explanation: "`prevent_destroy = true` acts as a hard circuit breaker: any plan that attempts to delete the resource will fail immediately."
      }
    ],
    productionCommands: [
      { cmd: "terraform state show aws_instance.app_server", desc: "Display all live stored attributes and metadata for a specific managed resource", level: "read" },
      { cmd: "terraform taint aws_instance.app_server", desc: "Mark resource for forced recreation on next apply (deprecated in favor of -replace)", level: "write" }
    ],
    productionRules: [
      "Always attach `lifecycle { prevent_destroy = true }` to production databases, KMS keys, and primary S3 storage buckets.",
      "Use `lifecycle { create_before_destroy = true }` whenever updating load balancer target groups or security groups to avoid traffic drops."
    ],
    failureModes: [
      {
        pitfall: "Changing an immutable attribute on an RDS database without `prevent_destroy` configured",
        impact: "Terraform plans an automatic destruction and recreation, dropping the live production database and deleting all customer data.",
        resolution: "Enforce `prevent_destroy = true` on all stateful resources."
      }
    ],
    realWorldScenario: {
      title: "The Accidental VPC Re-Creation that Nuked Staging",
      situation: "A developer renamed a VPC CIDR block. Terraform planned to destroy the VPC, terminating 30 attached EC2 instances and subnets.",
      investigation: "The developer ran `terraform apply -auto-approve` without reviewing the plan diff.",
      fix: "Added `prevent_destroy = true` on the VPC, banned `-auto-approve` in CI pipelines, and mandated pull request plan reviews."
    }
  },
  {
    id: "variables-and-output",
    name: "4. Variables and Output",
    subtitle: "Input Validation, Sensitive Data Masking & Structured Outputs",
    category: "Terraform Core",
    mentalModel: "Variables parameterize your infrastructure code, transforming hardcoded templates into reusable modules. Outputs export computed attributes (IP addresses, ARNs, DNS endpoints) for consumption by root modules or other state files.",
    coreMechanism: "Terraform enforces strict type constraints (`string`, `number`, `bool`, `list`, `map`, `object`). **Custom validation rules** evaluate regex conditions at plan time. Setting `sensitive = true` prevents secrets from appearing in plaintext console stdout or CLI terminal logs.",
    keySyntax: [
      {
        label: "Typed Input Variable with Custom Validation & Sensitive Flag",
        code: `variable "environment" {
  type        = string
  description = "Target deployment tier"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "The environment variable must be one of: dev, staging, prod."
  }
}

variable "db_password" {
  type        = string
  sensitive   = true # Redacts value from CLI terminal stdout!
}

output "database_endpoint" {
  value       = aws_db_instance.core.endpoint
  description = "Connection DNS endpoint for backend services"
}`,
        explanation: "Validation rules reject invalid configurations before Terraform ever contacts cloud APIs."
      }
    ],
    productionCommands: [
      { cmd: "terraform output -json", desc: "Export all root module outputs formatted as a machine-readable JSON object", level: "read" },
      { cmd: "terraform output -raw database_endpoint", desc: "Extract a specific raw output string directly for shell scripting pipelines", level: "read" }
    ],
    productionRules: [
      "Always mark password, token, and private key variables as `sensitive = true` to prevent credential exposure in CI build logs.",
      "Remember that `sensitive = true` only redacts terminal stdout: the raw secret is STILL stored in plaintext inside `terraform.tfstate`."
    ],
    failureModes: [
      {
        pitfall: "Assuming `sensitive = true` encrypts the secret inside the `terraform.tfstate` file",
        impact: "The state file is stored in an unencrypted S3 bucket; anyone with S3 read access can extract all plaintext database passwords.",
        resolution: "Enforce KMS server-side encryption and strict IAM access boundaries on the remote state bucket."
      }
    ],
    realWorldScenario: {
      title: "Plaintext Master Password Leaked via Unmasked Output",
      situation: "An unmasked output `output 'db_pass' { value = var.db_password }` printed production database credentials in plain text in GitHub Actions logs.",
      investigation: "The variable was marked sensitive, but the output block omitted `sensitive = true`, overriding the redaction.",
      fix: "Marked all downstream output blocks as `sensitive = true` and integrated Trivy scanning in CI to flag unmasked sensitive outputs."
    }
  },
  {
    id: "state-files",
    name: "5. State Files",
    subtitle: "The Single Source of Truth: Mapping Declarations to Reality",
    category: "State & Locking",
    mentalModel: "The Terraform State file (`terraform.tfstate`) is the single source of truth. It records the exact mapping between HCL resource declarations in code and real physical resource IDs in the cloud.",
    coreMechanism: "Terraform state is stored as a structured JSON document. It tracks metadata, resource dependencies, schema versions, and attribute values. When you run `terraform plan`, Terraform reads the state file, queries cloud provider APIs to refresh attributes, and computes diffs. Never edit the state file manually.",
    keySyntax: [
      {
        label: "Terraform State JSON Schema Snippet",
        code: `{
  "version": 4,
  "terraform_version": "1.7.5",
  "serial": 42,
  "resources": [
    {
      "mode": "managed",
      "type": "aws_vpc",
      "name": "main",
      "provider": "provider[\"registry.terraform.io/hashicorp/aws\"]",
      "instances": [
        {
          "schema_version": 1,
          "attributes": {
            "id": "vpc-0a8b7c6d5e4f321",
            "cidr_block": "10.0.0.0/16",
            "enable_dns_hostnames": true
          }
        }
      ]
    }
  ]
}`,
        explanation: "If this state file is lost, Terraform loses tracking of all real cloud infrastructure and will attempt to provision duplicate resources."
      }
    ],
    productionCommands: [
      { cmd: "terraform state list", desc: "List all resource addresses currently tracked within the active state file", level: "read" },
      { cmd: "terraform state rm <resource_address>", desc: "HAZARDOUS: Stop tracking a resource in state without destroying it in the cloud", level: "hazardous" },
      { cmd: "terraform state pull > backup.tfstate", desc: "Safely download current remote state payload to a local backup file", level: "read" }
    ],
    productionRules: [
      "Never commit `terraform.tfstate` or `*.tfstate.backup` to Git: add them to `.gitignore` immediately.",
      "Never manually edit `terraform.tfstate` with a text editor: use `terraform state` CLI commands (`mv`, `rm`, `replace-provider`)."
    ],
    failureModes: [
      {
        pitfall: "Committing local `terraform.tfstate` files directly to a public GitHub repository",
        impact: "Exposes all database passwords, private keys, and cloud infrastructure IDs in plaintext to public scanners.",
        resolution: "Use remote state backends (S3, GCS) with encryption and enforce Git pre-commit secret scanners."
      }
    ],
    realWorldScenario: {
      title: "The Lost State File that Orphaned 200 Cloud Resources",
      situation: "A company stored their state file locally on a developer's laptop. The laptop hard drive crashed.",
      investigation: "With no remote backend, Terraform had zero record of the 200 existing AWS resources. Running `apply` failed with name collision errors.",
      fix: "Spent 40 engineering hours manually reverse-engineering and importing 200 resources back into an encrypted S3 remote backend."
    }
  },
  {
    id: "remote-state",
    name: "6. Remote State",
    subtitle: "Team Collaboration: S3 Backends, KMS Encryption & Multi-Environment",
    category: "State & Locking",
    mentalModel: "Remote State stores the `terraform.tfstate` file in a centralized, secure cloud object store (Amazon S3, Google Cloud Storage, Terraform Cloud) rather than on individual developer machines.",
    coreMechanism: "When `terraform` executes, it pulls the latest state snapshot into memory from the remote backend. When `terraform apply` finishes, it writes the updated state back to the object store with an incremented serial number. Remote backends support automated versioning, encryption at rest, and access logging.",
    keySyntax: [
      {
        label: "Production Amazon S3 Remote Backend Configuration",
        code: `terraform {
  backend "s3" {
    bucket         = "corp-terraform-state-prod"
    key            = "networking/vpc/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    kms_key_id     = "arn:aws:kms:us-east-1:123456789:key/state-key"
    dynamodb_table = "terraform-state-locks"
  }
}`,
        explanation: "Separating state keys by architectural tier (`networking/vpc/`, `database/rds/`) isolates failure blast radiuses."
      }
    ],
    productionCommands: [
      { cmd: "terraform init -migrate-state", desc: "Migrate existing local state file to a newly configured remote backend", level: "write" },
      { cmd: "terraform init -reconfigure", desc: "Reconfigure backend settings without attempting to copy existing state data", level: "write" }
    ],
    productionRules: [
      "Always enable S3 Bucket Versioning on the remote state bucket to allow instant recovery from corrupted state writes.",
      "Separate state files by environment and architectural layer (e.g. `prod/network`, `prod/database`, `dev/network`): never put your entire company's infrastructure into a single state file."
    ],
    failureModes: [
      {
        pitfall: "Managing an entire company's infrastructure (VPC, EKS, RDS, IAM, S3) inside a single massive state file",
        impact: "`terraform plan` takes 25 minutes to refresh. A typo in an S3 bucket destroys the production database. Blast radius is catastrophic.",
        resolution: "Decompose infrastructure into layered, decoupled state files."
      }
    ],
    realWorldScenario: {
      title: "State Corruption Recovery via S3 Bucket Versioning",
      situation: "A network timeout during a massive `terraform apply` left the S3 state file corrupted with incomplete JSON syntax.",
      investigation: "Subsequent CI runs failed with `Error loading state: unexpected end of JSON input`.",
      fix: "Used S3 Versioning to restore the state file to the previous version from 10 minutes prior, resolving the lockup immediately."
    }
  },
  {
    id: "state-locking",
    name: "7. State Locking",
    subtitle: "Concurrency Control: DynamoDB Mutex & Split-Brain Prevention",
    category: "State & Locking",
    mentalModel: "State Locking acts as a mutual exclusion (mutex) lock that prevents two engineers or CI pipelines from running `terraform apply` on the same state file simultaneously.",
    coreMechanism: "Before executing any operation that could mutate state, Terraform writes an item containing a unique LockID, timestamp, and author metadata to a centralized lock store (e.g. Amazon DynamoDB table or Consul). If another process tries to acquire the lock, it receives an error and halts. The lock is released upon completion.",
    keySyntax: [
      {
        label: "Terraform State Locking DynamoDB Table Definition",
        code: `resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-state-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID" # Mandatory partition key required by Terraform!

  attribute {
    name = "LockID"
    type = "S"
  }
}`,
        explanation: "DynamoDB charges pennies per year on PAY_PER_REQUEST while providing millisecond distributed locking."
      }
    ],
    productionCommands: [
      { cmd: "terraform force-unlock <lock_id>", desc: "HAZARDOUS: Manually release a stuck lock if a CI runner crashed unexpectedly", level: "hazardous" }
    ],
    productionRules: [
      "Always configure state locking in team environments: running un-locked Terraform across multiple developers guarantees state corruption.",
      "Use `terraform force-unlock` with extreme caution: verify that no other pipeline or developer is actively running before unlocking."
    ],
    failureModes: [
      {
        pitfall: "Two developers running `terraform apply` simultaneously without state locking configured",
        impact: "Developer B's apply overwrites Developer A's changes, corrupting the serial sequence and leaving real cloud resources untracked.",
        resolution: "Configure DynamoDB state locking on the remote backend."
      }
    ],
    realWorldScenario: {
      title: "The Deadlock of the Abruptly Terminated CI Runner",
      situation: "A CI/CD runner running `terraform apply` was killed by an out-of-memory host reboot. All subsequent CI runs failed with `Error: Error acquiring the state lock`.",
      investigation: "The lock entry in DynamoDB was never released because the process was killed before the exit hook could run.",
      fix: "Extracted the LockID from the error message and executed `terraform force-unlock <LockID>` after verifying the runner was dead."
    }
  },
  {
    id: "module",
    name: "8. Module",
    subtitle: "Reusable Abstractions: Root vs Child Modules & Version Pinning",
    category: "Terraform Core",
    mentalModel: "A Terraform Module is a container for multiple resources that are used together. Modules turn low-level cloud primitives into clean, opinionated, reusable building blocks (e.g. a complete VPC module with public/private subnets and route tables).",
    coreMechanism: "The working directory containing your main HCL files is the **Root Module**. Reusable modules imported into configuration are **Child Modules** (`module 'vpc' { source = '...' }`). Child modules receive inputs via `variable` blocks and return outputs via `output` blocks. Modules can be sourced locally, from Git tags, or from the Terraform Registry.",
    keySyntax: [
      {
        label: "Consuming a Version-Pinned Git Child Module",
        code: `module "production_vpc" {
  # Pin to exact immutable Git release tag!
  source = "git::https://github.com/myorg/terraform-aws-vpc.git?ref=v2.4.0"

  vpc_cidr             = "10.100.0.0/16"
  availability_zones   = ["us-east-1a", "us-east-1b"]
  enable_nat_gateway   = true
  single_nat_gateway   = false # High availability Multi-AZ NAT
  
  tags = {
    Environment = "production"
    Owner       = "platform-team"
  }
}`,
        explanation: "Sourcing modules via `?ref=v2.4.0` guarantees that future module updates will not break consumer environments without explicit upgrades."
      }
    ],
    productionCommands: [
      { cmd: "terraform get -update", desc: "Download and update module source packages declared in configuration", level: "write" }
    ],
    productionRules: [
      "Always pin module sources to immutable Git release tags (`?ref=v1.2.0`): never source modules from mutable branch names like `?ref=main`.",
      "Keep modules focused and single-purpose: avoid building monolithic 'god modules' that provision compute, database, and DNS in one shot."
    ],
    failureModes: [
      {
        pitfall: "Referencing a child module via `?ref=main`",
        impact: "When the platform team merges a breaking change to the module's `main` branch, all downstream application deployments break unexpectedly.",
        resolution: "Pin strictly to semantic Git release tags (`?ref=v2.1.0`)."
      }
    ],
    realWorldScenario: {
      title: "The Silent Monolithic Module Explosion",
      situation: "A company created a single `company-everything` module. Running `terraform plan` took 35 minutes and routinely timed out.",
      investigation: "The module contained 450 resources across 12 services, creating an enormous execution graph that overwhelmed the Terraform DAG compiler.",
      fix: "Decomposed the monolith into 5 independent micro-modules: VPC, Database, Compute, CDN, and DNS."
    }
  },
  {
    id: "workspaces",
    name: "9. Workspaces",
    subtitle: "CLI State Partitioning vs Directory-Based Isolation",
    category: "Workflow & Lifecycle",
    mentalModel: "Terraform Workspaces allow you to manage multiple distinct state files using a single configuration directory. The active workspace changes the state path from `terraform.tfstate` to `env:/<workspace_name>/terraform.tfstate`.",
    coreMechanism: "The selected workspace is accessible in HCL expressions via `terraform.workspace`. This allows dynamic string interpolation (e.g. `name = 'app-${terraform.workspace}'`). In enterprise architectures, **directory-based separation** (`environments/dev`, `environments/prod`) is preferred over workspaces for production environments.",
    keySyntax: [
      {
        label: "Dynamic HCL Expressions Using `terraform.workspace`",
        code: `locals {
  instance_counts = {
    default = 1
    dev     = 1
    staging = 2
    prod    = 5
  }
}

resource "aws_instance" "web" {
  count         = lookup(local.instance_counts, terraform.workspace, 1)
  instance_type = terraform.workspace == "prod" ? "c6i.2xlarge" : "t3.micro"
  
  tags = {
    Name        = "web-\${terraform.workspace}"
    Environment = terraform.workspace
  }
}`,
        explanation: "Using `terraform.workspace` dynamically scales instance counts and sizes based on the selected workspace."
      }
    ],
    productionCommands: [
      { cmd: "terraform workspace list", desc: "List all existing workspaces in the current working directory", level: "read" },
      { cmd: "terraform workspace select <workspace_name>", desc: "Switch the active working workspace and load its associated state file", level: "write" },
      { cmd: "terraform workspace new <workspace_name>", desc: "Create a new isolated workspace with a clean, empty state file", level: "write" }
    ],
    productionRules: [
      "Use workspaces for ephemeral environments (e.g. PR preview environments); use distinct directory structures (`envs/prod/`) for production isolation.",
      "Always verify your active workspace (`terraform workspace show`) before running `terraform apply`."
    ],
    failureModes: [
      {
        pitfall: "Running `terraform destroy` assuming you are in `dev` when you are actually in the `prod` workspace",
        impact: "Destroys all production cloud infrastructure instantly due to CLI context confusion.",
        resolution: "Separate environments into distinct directories with distinct AWS IAM role assumptions."
      }
    ],
    realWorldScenario: {
      title: "Production Wiped During Staging Teardown",
      situation: "An engineer finished testing a staging cluster and ran `terraform destroy -auto-approve`, inadvertently destroying production.",
      investigation: "The developer's terminal had the `prod` workspace active. Workspaces share identical code, making context errors easy.",
      fix: "Banned Terraform CLI workspaces for production; migrated to directory-based isolation (`environments/prod`) with separate AWS accounts."
    }
  },
  {
    id: "plan-and-apply",
    name: "10. Plan and Apply",
    subtitle: "Execution Graph Compiling, Refresh & Dry-Run Predictability",
    category: "Workflow & Lifecycle",
    mentalModel: "`terraform plan` compiles the execution graph and previews the exact diff without modifying real infrastructure. `terraform apply` executes the compiled plan transaction against target cloud APIs.",
    coreMechanism: "During `plan`, Terraform queries cloud provider APIs to refresh in-memory state against reality. It compares code against current state to generate an execution plan. Passing `-out=tfplan` saves the compiled plan binary, guaranteeing that `terraform apply tfplan` will execute the exact diff previewed without re-evaluating.",
    keySyntax: [
      {
        label: "Deterministic CI/CD Two-Phase Execution",
        code: `# Phase 1: Compile and Save Immutable Execution Plan (PR Review)
terraform plan -out=tfplan -input=false

# Inspect the compiled binary plan in human-readable format:
terraform show tfplan

# Phase 2: Execute the Exact Compiled Plan (Post-Merge Deploy)
terraform apply -input=false tfplan`,
        explanation: "Saving and applying `tfplan` guarantees that race conditions or out-of-band changes between plan and apply will not introduce surprises."
      }
    ],
    productionCommands: [
      { cmd: "terraform plan -out=tfplan", desc: "Generate and save a deterministic execution plan to disk for subsequent apply", level: "read" },
      { cmd: "terraform apply tfplan", desc: "Execute an exact pre-compiled plan binary against live cloud infrastructure", level: "write" },
      { cmd: "terraform apply -target=aws_instance.app", desc: "HAZARDOUS: Restrict plan and apply strictly to a single targeted resource", level: "hazardous" }
    ],
    productionRules: [
      "Always save and review compiled plan binaries (`-out=tfplan`) in CI/CD pipelines before executing `apply`.",
      "Avoid `-target` in production workflows: targeted applies break dependency tracking and leave state incomplete."
    ],
    failureModes: [
      {
        pitfall: "Running bare `terraform apply` in CI without referencing a pre-compiled `tfplan` binary",
        impact: "A developer merges another PR between the plan and apply stages; the apply executes unexpected changes that were never reviewed.",
        resolution: "Enforce `terraform plan -out=tfplan` followed by `terraform apply tfplan`."
      }
    ],
    realWorldScenario: {
      title: "The Race Condition that Destroyed the VPN Gateway",
      situation: "Two CI pipelines triggered simultaneously on different PR merges. Pipeline B merged code that deleted the VPN Gateway.",
      investigation: "Pipeline A ran `terraform apply` directly. Because it re-evaluated the plan live, it executed Pipeline B's deletion without review.",
      fix: "Mandated immutable plan files (`-out=tfplan`) stored as CI artifacts and evaluated with approval gates."
    }
  },
  {
    id: "drift-detection",
    name: "11. Drift Detection",
    subtitle: "Reconciling Reality: Out-of-Band Console Edits & Refresh-Only",
    category: "Workflow & Lifecycle",
    mentalModel: "Configuration Drift occurs when infrastructure is modified out-of-band (e.g. someone manually edits a security group or changes an instance size in the AWS Console) without updating the HCL code.",
    coreMechanism: "Terraform detects drift by querying provider APIs during `refresh`. **`terraform plan -refresh-only`** updates the state file to match real cloud infrastructure without modifying any resources. Automated scheduled pipelines run drift detection to alert teams when manual changes violate declared IaC standards.",
    keySyntax: [
      {
        label: "Drift Reconciliation Workflow",
        code: `# Step 1: Detect out-of-band drift without making any changes:
terraform plan -refresh-only

# Step 2: Accept the real cloud changes into state (Reconciliation):
terraform apply -refresh-only

# Step 3: Overwrite manual cloud changes to restore declared HCL code:
terraform plan # Shows plan to revert manual edits back to declared code
terraform apply`,
        explanation: "`terraform apply -refresh-only` updates the state file to acknowledge manual changes without triggering resource recreation."
      }
    ],
    productionCommands: [
      { cmd: "terraform plan -refresh-only", desc: "Inspect out-of-band infrastructure drift between state and real cloud resources", level: "read" },
      { cmd: "terraform plan -detailed-exitcode", desc: "Returns exit code 0 (no changes), 1 (error), or 2 (drift detected); ideal for CI drift crons", level: "read" }
    ],
    productionRules: [
      "Run daily scheduled drift detection pipelines in CI using `terraform plan -detailed-exitcode`: alert immediately on exit code 2.",
      "Revoke manual console write access in production: all infrastructure changes must flow strictly through Git commits."
    ],
    failureModes: [
      {
        pitfall: "An engineer manually adds a firewall rule in the AWS Console during an emergency, but fails to commit it to Terraform",
        impact: "The next routine `terraform apply` detects the rule as drift and deletes it, silently re-opening the emergency issue.",
        resolution: "Run post-incident drift reconciliation and backport emergency fixes into HCL code immediately."
      }
    ],
    realWorldScenario: {
      title: "The Emergency Security Group Patch that Disappeared",
      situation: "An on-call engineer blocked a malicious DDoS IP in a Security Group manually. 3 days later, the attacks resumed.",
      investigation: "A routine CI deployment ran `terraform apply`, which compared code to reality, found the extra IP rule, and pruned it to match Git.",
      fix: "Instituted automated drift alerts that open urgent Jira tickets whenever manual changes diverge from Git."
    }
  },
  {
    id: "importing-resources",
    name: "12. Importing Resources",
    subtitle: "Adopting Existing Infrastructure: CLI Import vs Declarative `import {}`",
    category: "Workflow & Lifecycle",
    mentalModel: "Importing brings pre-existing, manually provisioned cloud resources under Terraform management without destroying or recreating them.",
    coreMechanism: "Historically, `terraform import` was an imperative CLI command that mutated state directly. Modern Terraform (v1.5+) introduces the declarative **`import {}` block** in HCL. Terraform evaluates the import block, matches it to a resource block, and can even automatically generate the matching HCL code.",
    keySyntax: [
      {
        label: "Declarative `import {}` Block (Terraform 1.5+)",
        code: `# 1. Declare the import target and real cloud ID:
import {
  to = aws_security_group.legacy_sg
  id = "sg-0123456789abcdef0" # Real AWS Security Group ID
}

# 2. Define the matching resource block:
resource "aws_security_group" "legacy_sg" {
  name        = "legacy-web-firewall"
  description = "Adopted from manual console creation"
  # Attributes will be reconciled against reality on apply
}`,
        explanation: "Declarative import blocks can be committed to Git, reviewed in pull requests, and executed deterministically in CI pipelines."
      }
    ],
    productionCommands: [
      { cmd: "terraform plan -generate-config-out=generated.tf", desc: "Automatically generate HCL resource code for declared import blocks (Terraform 1.5+)", level: "write" },
      { cmd: "terraform import aws_vpc.imported vpc-0123456789abcdef0", desc: "Legacy imperative CLI import binding a cloud ID to a declared resource address", level: "write" }
    ],
    productionRules: [
      "Use modern declarative `import {}` blocks rather than legacy imperative `terraform import` CLI commands.",
      "Always run `terraform plan` immediately after importing: verify that the diff shows `0 to add, 0 to change, 0 to destroy`."
    ],
    failureModes: [
      {
        pitfall: "Importing a resource into state with an incomplete HCL resource definition",
        impact: "On the next `terraform apply`, Terraform plans to delete all unmentioned attributes, potentially wiping subnets or resetting configurations.",
        resolution: "Refine HCL attributes until `terraform plan` reports a clean 0-diff plan."
      }
    ],
    realWorldScenario: {
      title: "Adopting a 5-Year-Old Production Database into IaC",
      situation: "A company needed to manage their core PostgreSQL database via Terraform, but could not afford a single millisecond of downtime.",
      investigation: "Running a standard apply would attempt to create a new database. The team needed to bind the existing RDS instance ID into state.",
      fix: "Used an `import {}` block with `terraform plan -generate-config-out=rds.tf`, successfully adopting the database with zero downtime."
    }
  },
  {
    id: "ansible",
    name: "13. Ansible",
    subtitle: "Agentless Configuration Management: SSH Transport & Python Modules",
    category: "Ansible & Config Management",
    mentalModel: "Ansible is an open-source, agentless automation and configuration management engine. It configures servers, installs packages, templates configuration files, and orchestrates rolling updates over standard SSH without installing agents.",
    coreMechanism: "Ansible executes from a control node. It parses declarative YAML tasks, compiles them into small standalone Python programs (modules), transfers them over SSH/WinRM to target managed nodes, executes them, and cleans them up. Execution is governed by **Idempotency**: if a system is already in the target state, Ansible makes zero changes.",
    keySyntax: [
      {
        label: "Production Ansible Ad-Hoc Command & Playbook Structure",
        code: `# Ad-Hoc Command: Ping all servers in the 'web' inventory group
ansible web -i inventory.ini -m ping

# Ad-Hoc Command: Check disk free space across all staging nodes
ansible staging -i inventory.ini -m command -a "df -h"

# Standard Playbook Execution:
ansible-playbook -i inventory.ini deploy-web.yml --check # Dry-run mode!`,
        explanation: "`--check` executes the playbook in dry-run mode, reporting changes that would be made without applying them."
      }
    ],
    productionCommands: [
      { cmd: "ansible-playbook -i inventory.ini site.yml --check --diff", desc: "Execute dry-run inspection showing unified diffs of files that would be modified", level: "read" },
      { cmd: "ansible-lint site.yml", desc: "Audit Ansible playbooks, roles, and variables for best practices and security flaws", level: "read" }
    ],
    productionRules: [
      "Use Ansible for software and configuration management (inside the OS); use Terraform for provisioning cloud infrastructure (outside the OS).",
      "Always design Ansible tasks to be strictly idempotent: running a playbook 10 times consecutively must yield `changed=0` on runs 2 through 10."
    ],
    failureModes: [
      {
        pitfall: "Using the `shell` or `command` module to run raw bash scripts instead of native Ansible modules",
        impact: "Destroys idempotency; Ansible executes the bash script every single time, reporting `changed=1` and potentially duplicating configuration lines.",
        resolution: "Use dedicated modules (`apt`, `template`, `service`, `lineinfile`)."
      }
    ],
    realWorldScenario: {
      title: "The Non-Idempotent Playbook that Appended 50 Lines to `/etc/hosts`",
      situation: "Servers began failing DNS resolution after a weekly maintenance automation ran.",
      investigation: "A task used `shell: 'echo \"10.0.0.1 db\" >> /etc/hosts'`. Every execution appended duplicate lines until the file broke.",
      fix: "Replaced the shell task with the native `lineinfile` module configured with a regex anchor."
    }
  },
  {
    id: "playbooks",
    name: "14. Playbooks",
    subtitle: "Declarative Task Automation: Handlers, Notify & Variables",
    category: "Ansible & Config Management",
    mentalModel: "An Ansible Playbook is a declarative YAML blueprint containing one or more 'plays'. A play maps a group of managed hosts to an ordered list of tasks that configure packages, users, files, and services.",
    coreMechanism: "Tasks execute sequentially across hosts in parallel. **Handlers** are special tasks triggered only when a preceding task reports a `changed` status via the `notify` directive (e.g. restart Nginx only if the configuration template actually changed).",
    keySyntax: [
      {
        label: "Production Nginx Web Server Playbook with Handlers",
        code: `---
- name: Configure Secure Production Web Tier
  hosts: webservers
  become: true # Run tasks with sudo privileges
  vars:
    http_port: 80
    max_clients: 200

  tasks:
    - name: Ensure Nginx package is installed
      ansible.builtin.apt:
        name: nginx
        state: present
        update_cache: true

    - name: Deploy hardened Nginx configuration
      ansible.builtin.template:
        src: templates/nginx.conf.j2
        dest: /etc/nginx/nginx.conf
        mode: '0644'
      notify: Restart Nginx Service # Triggers handler ONLY if file changes!

  handlers:
    - name: Restart Nginx Service
      ansible.builtin.service:
        name: nginx
        state: restarted`,
        explanation: "Handlers execute once at the end of the play, preventing Nginx from restarting multiple times during deployment."
      }
    ],
    productionCommands: [
      { cmd: "ansible-playbook -i hosts.ini web.yml --syntax-check", desc: "Validate YAML syntax and structural validity of an Ansible playbook", level: "read" },
      { cmd: "ansible-playbook -i hosts.ini web.yml --step", desc: "Interactively prompt for confirmation before executing each individual task", level: "write" }
    ],
    productionRules: [
      "Always use Fully Qualified Collection Names (FQCN) like `ansible.builtin.template` rather than legacy short names (`template`).",
      "Rely on handlers (`notify`) for service restarts to prevent service disruptions when configuration files are untouched."
    ],
    failureModes: [
      {
        pitfall: "Restarting a service directly inside a task instead of using a handler",
        impact: "The service restarts on every playbook run even if no configuration changed, dropping active customer connections unnecessarily.",
        resolution: "Trigger service restarts via `notify: Restart <service>` handlers."
      }
    ],
    realWorldScenario: {
      title: "Dropping Active User Traffic on Every Routine Cron Run",
      situation: "An hourly configuration audit was causing 3-second database connection dropouts every hour.",
      investigation: "The playbook had a task `service: name=postgresql state=restarted` that executed unconditionally.",
      fix: "Moved the restart into a handler notified only when `postgresql.conf` changes."
    }
  },
  {
    id: "roles",
    name: "15. Roles",
    subtitle: "Modular Organization: Directory Standards, Galaxy & Reusability",
    category: "Ansible & Config Management",
    mentalModel: "An Ansible Role is a standardized directory structure that groups related tasks, variables, templates, handlers, and default settings into a reusable package. Roles are the Ansible equivalent of Terraform modules.",
    coreMechanism: "When a playbook includes a role (`roles: [nginx, security]`), Ansible automatically imports tasks from `tasks/main.yml`, variables from `vars/main.yml`, defaults from `defaults/main.yml`, and templates from `templates/`. Roles can be downloaded and shared via **Ansible Galaxy**.",
    keySyntax: [
      {
        label: "Standard Ansible Role Directory Architecture",
        code: `roles/common_web/
├── defaults/
│   └── main.yml        # Lowest-priority default variables (easily overridden)
├── vars/
│   └── main.yml        # High-priority role-specific internal variables
├── tasks/
│   └── main.yml        # The core list of execution tasks
├── handlers/
│   └── main.yml        # Handlers triggered by notify directives
├── templates/
│   └── vhost.conf.j2   # Jinja2 configuration templates
├── files/
│   └── ssl_params.conf # Static unparsed files to copy
└── meta/
    └── main.yml        # Role dependencies and metadata`,
        explanation: "Adhering to standard directory conventions allows Ansible to auto-load assets without manual path configuration."
      }
    ],
    productionCommands: [
      { cmd: "ansible-galaxy role init roles/my_new_role", desc: "Scaffold a standardized role skeleton directory structure", level: "write" },
      { cmd: "ansible-galaxy install -r requirements.yml", desc: "Download and install pinned community roles from Ansible Galaxy or Git", level: "write" }
    ],
    productionRules: [
      "Put user-configurable variables in `defaults/main.yml` (lowest precedence) so consumers can easily override them in playbooks.",
      "Pin external Galaxy role dependencies to specific Git tags or release versions in `requirements.yml`."
    ],
    failureModes: [
      {
        pitfall: "Hardcoding internal variables inside `vars/main.yml` that need to be customized by downstream playbooks",
        impact: "Variables in `vars/` have high precedence and cannot be overridden by playbook variables, breaking role reusability.",
        resolution: "Move customizable variables to `defaults/main.yml`."
      }
    ],
    realWorldScenario: {
      title: "The Unpinned Galaxy Role that Broke Production Fleet Provisioning",
      situation: "An auto-scaling group failed to provision new worker nodes with `Role 'geerlingguy.docker' failed: incompatible syntax`.",
      investigation: "The bootstrap script ran `ansible-galaxy install geerlingguy.docker` without version pinning, downloading a breaking release.",
      fix: "Created a `requirements.yml` file pinning the role to version `v7.0.2` and committed dependencies."
    }
  },
  {
    id: "inventory",
    name: "16. Inventory",
    subtitle: "Host Topology: Static INI/YAML vs Dynamic Cloud Discovery",
    category: "Ansible & Config Management",
    mentalModel: "An Inventory defines the collection of managed nodes that Ansible automates. It organizes servers into logical groups (e.g. `[web]`, `[db]`, `[us-east]`) and assigns host-specific variables.",
    coreMechanism: "Inventories can be **Static** (plain text INI or YAML files with hardcoded IP addresses) or **Dynamic**. In modern cloud environments, **Dynamic Inventory Plugins** query cloud APIs (AWS EC2, GCP, Azure, Kubernetes) in real time, automatically grouping servers by cloud tags, VPC subnets, and lifecycle states.",
    keySyntax: [
      {
        label: "Dynamic AWS EC2 Inventory Configuration (`aws_ec2.yaml`)",
        code: `# aws_ec2.yaml - Dynamic EC2 Inventory Plugin
plugin: aws_ec2
regions:
  - us-east-1
filters:
  instance-state-name: running
hostnames:
  - private-ip-address

# Dynamically group instances by their AWS Tags:
keyed_groups:
  - key: tags.Environment
    prefix: env
  - key: tags.Role
    prefix: role

# Resulting auto-populated groups:
# @env_production, @role_api, @role_worker`,
        explanation: "Dynamic inventory eliminates static IP lists: new auto-scaled EC2 instances are discovered and configured automatically."
      }
    ],
    productionCommands: [
      { cmd: "ansible-inventory -i aws_ec2.yaml --graph", desc: "Display a visual hierarchical tree of all dynamically discovered hosts and groups", level: "read" },
      { cmd: "ansible-inventory -i aws_ec2.yaml --host <ip_or_name>", desc: "Inspect all facts, variables, and AWS metadata associated with a specific host", level: "read" }
    ],
    productionRules: [
      "Never maintain static IP lists for cloud infrastructure: use dynamic cloud inventory plugins keyed on cloud tags.",
      "Store inventory files and group variables in dedicated `group_vars/` directories separated by environment."
    ],
    failureModes: [
      {
        pitfall: "Using static inventory IP lists in an auto-scaling cloud environment",
        impact: "When instances terminate and new ones launch with new private IPs, the inventory points to dead machines and deployments fail.",
        resolution: "Adopt dynamic inventory plugins (`aws_ec2.yaml`)."
      }
    ],
    realWorldScenario: {
      title: "Playbook Runs Against Wrong Environment Due to Group Shadowing",
      situation: "A database tuning playbook intended for staging ran against production database replicas.",
      investigation: "The static inventory file had overlapping host definitions with ambiguous group naming.",
      fix: "Separated staging and production inventories into physically distinct directories with strict RBAC."
    }
  },
  {
    id: "idempotency",
    name: "17. Idempotency",
    subtitle: "The Golden Law of IaC: Repeatable Desired-State Convergence",
    category: "Workflow & Lifecycle",
    mentalModel: "Idempotency is the mathematical property that an operation can be applied multiple times without changing the result beyond the initial application. In IaC, running automation against a system that is already in the target state must make zero changes (`changed=0`).",
    coreMechanism: "Before executing an action, an idempotent engine checks current state against target state. If the target file already exists with the correct permissions, or if the package is already installed, the engine skips the operation. This guarantees that automated runs will not introduce unintended side effects, reset running services, or duplicate configuration lines.",
    keySyntax: [
      {
        label: "Non-Idempotent Anti-Pattern vs Idempotent Implementation",
        code: `# ❌ NON-IDEMPOTENT ANTI-PATTERN (Fails on multiple runs):
- name: Append line to config
  ansible.builtin.shell: echo "export ENV=prod" >> /etc/profile
  # Bug: Every time this runs, it adds duplicate lines to /etc/profile!

# ✅ STRICTLY IDEMPOTENT IMPLEMENTATION:
- name: Ensure environment variable is set
  ansible.builtin.lineinfile:
    path: /etc/profile
    regexp: '^export ENV='
    line: 'export ENV=prod'
    state: present
  # Safe: Matches the regex; modifies the file ONLY if the line differs.`,
        explanation: "Native modules verify existing state before modifying files, preserving idempotency."
      }
    ],
    productionCommands: [
      { cmd: "ansible-playbook -i hosts site.yml && ansible-playbook -i hosts site.yml", desc: "Test idempotency: the second consecutive run must report 'changed=0' and 'failed=0'", level: "read" }
    ],
    productionRules: [
      "Every IaC template, Terraform script, and Ansible task must be strictly idempotent.",
      "Validate idempotency in CI pipelines by running scripts twice consecutively: assert that run #2 results in zero diffs."
    ],
    failureModes: [
      {
        pitfall: "Writing custom shell scripts inside IaC tools that restart services unconditionally",
        impact: "Routine automated configuration checks drop active customer sessions on every run.",
        resolution: "Use declarative state-aware modules and handlers."
      }
    ],
    realWorldScenario: {
      title: "The Self-Inflicted SSH Lockout from a Non-Idempotent Script",
      situation: "An engineer was locked out of 40 production servers during a routine Ansible maintenance run.",
      investigation: "A task used `shell: iptables -A INPUT -p tcp --dport 22 -j DROP` intended for a temporary test. Re-running the playbook re-applied the block.",
      fix: "Replaced with the `iptables` module using strict state checks and tested idempotency in staging."
    }
  },
  {
    id: "cloudformation",
    name: "18. CloudFormation",
    subtitle: "AWS Native Declarative Engine: Stacks, Change Sets & Drift",
    category: "Cloud & Modern IaC Engines",
    mentalModel: "AWS CloudFormation is Amazon's native declarative Infrastructure as Code service. It models and provisions AWS and third-party resources using JSON or YAML templates organized into managed units called **Stacks**.",
    coreMechanism: "CloudFormation runs entirely inside the AWS management plane (serverless execution with no local state file to manage). You upload a template, and AWS manages the dependency graph and resource rollback on failure. **Change Sets** allow you to preview proposed changes before executing an update, mirroring `terraform plan`.",
    keySyntax: [
      {
        label: "Production AWS CloudFormation YAML Template",
        code: `AWSTemplateFormatVersion: '2010-09-09'
Description: Production Multi-AZ Encrypted S3 Bucket

Parameters:
  EnvironmentName:
    Type: String
    Default: production
    AllowedValues: [development, staging, production]

Resources:
  EncryptedBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain # Prevents deletion when stack is deleted!
    Properties:
      BucketName: !Sub "\${AWS::AccountId}-\${EnvironmentName}-vault"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256

Outputs:
  BucketArn:
    Value: !GetAtt EncryptedBucket.Arn
    Export:
      Name: !Sub "\${AWS::StackName}-BucketArn"`,
        explanation: "`DeletionPolicy: Retain` protects critical storage assets from accidental destruction if a CloudFormation stack is deleted."
      }
    ],
    productionCommands: [
      { cmd: "aws cloudformation deploy --template-file template.yaml --stack-name core-prod --capabilities CAPABILITY_IAM", desc: "Deploy or update an AWS CloudFormation stack with automated change set execution", level: "write" },
      { cmd: "aws cloudformation describe-stacks --stack-name core-prod --query 'Stacks[0].StackStatus'", desc: "Query current operational status of a CloudFormation stack", level: "read" }
    ],
    productionRules: [
      "Always set `DeletionPolicy: Retain` on production databases, S3 buckets, and KMS keys within CloudFormation templates.",
      "Use **Change Sets** in CI/CD pipelines to inspect resource replacements before executing stack updates."
    ],
    failureModes: [
      {
        pitfall: "Deleting a CloudFormation stack that contains an S3 bucket or RDS instance with default `DeletionPolicy: Delete`",
        impact: "AWS terminates and permanently purges the database and all stored data along with the stack.",
        resolution: "Set `DeletionPolicy: Retain` on all stateful resources."
      }
    ],
    realWorldScenario: {
      title: "The Stack Update Rollback Deadlock",
      situation: "A CloudFormation stack update failed halfway and became stuck in `UPDATE_ROLLBACK_FAILED` status, blocking all deployments.",
      investigation: "A security group could not be deleted during rollback because an out-of-band EC2 instance had attached to it.",
      fix: "Used `continue-update-rollback` with the `--resources-to-skip` flag to bypass the locked resource and restore stack health."
    }
  },
  {
    id: "pulumi",
    name: "19. Pulumi",
    subtitle: "Modern Code-First IaC: TypeScript/Python with Real Programming Logic",
    category: "Cloud & Modern IaC Engines",
    mentalModel: "Pulumi is a modern Infrastructure as Code platform that allows you to define cloud resources using real general-purpose programming languages (TypeScript, Python, Go, C#) instead of domain-specific configuration languages like HCL.",
    coreMechanism: "Pulumi code is imperative in syntax, but declarative in execution. The language runtime (e.g. Node.js or Python) executes your program and builds a resource DAG. Pulumi's language-agnostic deployment engine computes diffs against a state file (stored in Pulumi Service, S3, or GCS) and provisions cloud resources asynchronously using native provider plugins.",
    keySyntax: [
      {
        label: "Production TypeScript Infrastructure using Pulumi",
        code: `import * as aws from "@pulumi/aws";

// Real programming constructs: loops, classes, functions, unit tests!
const subnets = ["us-east-1a", "us-east-1b"].map((az, idx) => {
  return new aws.ec2.Subnet(\`subnet-\${az}\`, {
    vpcId: "vpc-0123456",
    cidrBlock: \`10.0.\${idx + 1}.0/24\`,
    availabilityZone: az,
    tags: { Tier: "Application" },
  });
});

export const subnetIds = subnets.map(s => s.id);`,
        explanation: "Full TypeScript support brings autocomplete, compile-time type safety, loop constructs, and standard unit testing."
      }
    ],
    productionCommands: [
      { cmd: "pulumi preview", desc: "Compile program and preview proposed infrastructure changes against current state", level: "read" },
      { cmd: "pulumi up", desc: "Execute planned infrastructure updates to reach desired program state", level: "write" },
      { cmd: "pulumi stack ls", desc: "List all active deployment stacks (e.g. dev, staging, prod) and their resource counts", level: "read" }
    ],
    productionRules: [
      "Keep Pulumi programs purely declarative: avoid executing non-deterministic runtime calls (like `Math.random()` or real-time HTTP fetches) inside resource definitions.",
      "Use TypeScript with strict mode enabled (`tsc --noEmit`) to catch configuration errors at compile time before running `pulumi preview`."
    ],
    failureModes: [
      {
        pitfall: "Invoking non-deterministic side-effects (e.g. generating random UUIDs or fetching external APIs) during program execution",
        impact: "On every single `pulumi preview`, Pulumi detects changes and plans to recreate resources because the inputs differ on every run.",
        resolution: "Use native Pulumi random providers (`@pulumi/random`) for deterministic generated values."
      }
    ],
    realWorldScenario: {
      title: "Eliminating 2,000 Lines of Duplicate HCL with Pulumi TypeScript",
      situation: "A company maintained 40 near-identical microservice configurations in Terraform, leading to copy-paste errors and drift.",
      investigation: "HCL lacked full object-oriented abstractions, forcing developers to duplicate 80-line service templates across 40 folders.",
      fix: "Refactored into a reusable TypeScript class `MicroserviceStack` in Pulumi, cutting codebase size by 75% and enforcing company-wide security standards."
    }
  },
  {
    id: "policy-as-code",
    name: "20. Policy as Code",
    subtitle: "Automated Governance: OPA, Rego, Checkov & Pre-Deployment Guardrails",
    category: "Governance & Policy",
    mentalModel: "Policy as Code (PaC) codifies security, compliance, and architectural rules into executable code. It inspects infrastructure plans *before* deployment and automatically blocks any plan that violates compliance policies.",
    coreMechanism: "Static analysis tools (Checkov, tfsec, Trivy) scan raw HCL source files for known misconfigurations. Dynamic policy engines (**Open Policy Agent - OPA** using **Rego**, or HashiCorp Sentinel) ingest the compiled `tfplan` JSON export, evaluate rules against declared attributes, and return pass/fail decisions before `terraform apply` can execute.",
    keySyntax: [
      {
        label: "Open Policy Agent (OPA) Rego Rule Blocking Public S3 Buckets",
        code: `package terraform.security

default allow = false

# Rule: Deny any S3 bucket that fails to enable server-side encryption
deny[msg] {
  resource := input.resource_changes[_]
  resource.type == "aws_s3_bucket"
  
  # Inspect plan: check if encryption configuration is missing
  not resource.change.after.server_side_encryption_configuration
  
  msg := sprintf("Security Violation: S3 bucket '%v' must enable KMS encryption!", [resource.address])
}

allow {
  count(deny) == 0
}`,
        explanation: "Evaluated in CI pipelines: if `count(deny) > 0`, the build fails and prevents deployment."
      }
    ],
    productionCommands: [
      { cmd: "checkov -d . --framework terraform", desc: "Scan HCL files for security vulnerabilities, exposed secrets, and compliance violations", level: "read" },
      { cmd: "opa eval --data policy.rego --input tfplan.json 'data.terraform.security.deny'", desc: "Evaluate OPA Rego policy rules against a compiled Terraform JSON plan", level: "read" }
    ],
    productionRules: [
      "Run Policy as Code checks automatically on every pull request: block PR merges if critical security policies are violated.",
      "Codify non-negotiable security guardrails: forbid unencrypted disks, public S3 buckets, and open port 22/3389 inbound rules."
    ],
    failureModes: [
      {
        pitfall: "Relying on manual security team reviews of Terraform pull requests",
        impact: "Reviewers miss a subtle `0.0.0.0/0` ingress rule on an internal database security group, exposing production to the Internet.",
        resolution: "Enforce automated pre-commit Checkov/OPA scanning in CI to reject open ingress rules automatically."
      }
    ],
    realWorldScenario: {
      title: "Automated Policy Blocks Leaked Unencrypted Patient Health Bucket",
      situation: "A developer provisioned a new S3 bucket for healthcare records, forgetting to declare the encryption block.",
      investigation: "The developer opened a PR. The CI pipeline ran OPA Rego policy validation against the compiled plan.",
      fix: "The OPA policy rejected the PR with `Security Violation: HIPAA compliance mandates KMS encryption on all S3 buckets`, preventing a severe regulatory breach."
    }
  }
];

