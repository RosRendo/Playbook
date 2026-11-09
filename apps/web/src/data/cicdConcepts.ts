export interface CicdConcept {
  id: string;
  name: string;
  subtitle: string;
  category: "Core Foundations" | "Engines & Runners" | "Quality & Caching" | "Release Strategies" | "GitOps & Delivery" | "Security & Governance";
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

export const CICD_CONCEPTS: CicdConcept[] = [
  {
    id: "pipeline",
    name: "1. Pipeline",
    subtitle: "The Automated Assembly Line: Trigger to Production",
    category: "Core Foundations",
    mentalModel: "A CI/CD Pipeline is an automated, repeatable state machine that transforms source code commits into validated, tested, and securely deployed software artifacts without manual intervention.",
    coreMechanism: "Pipelines listen for event webhooks (push, pull_request, tag, schedule). The orchestration engine constructs an execution graph (DAG), spins up isolated compute runners, pulls the Git tree, and executes sequential jobs where failure at any stage short-circuits the pipeline and blocks delivery.",
    keySyntax: [
      {
        label: "Universal Pipeline Topology",
        code: `Trigger (git push origin main)
   │
   ▼
Stage 1: Lint & Security Scan (Fail Fast: < 60s)
   │
   ▼
Stage 2: Parallel Unit & Integration Tests (Matrix runner)
   │
   ▼
Stage 3: Build & Sign Immutable OCI Artifact (Docker/Buildx + Cosign)
   │
   ▼
Stage 4: Automated Canary / Blue-Green Deployment to Production`,
        explanation: "Stages are strictly ordered by speed and blast radius: fast static validation executes first to conserve runner compute."
      }
    ],
    productionCommands: [
      { cmd: "gh run list --limit 10", desc: "List recent GitHub Actions workflow runs and their completion statuses", level: "read" },
      { cmd: "gh run watch <run_id>", desc: "Watch live streaming status and step transitions of an active pipeline run", level: "read" },
      { cmd: "gh run cancel <run_id>", desc: "Cancel a running pipeline execution to free runner slots", level: "write" }
    ],
    productionRules: [
      "Pipelines must remain strictly deterministic: identical code commits must produce byte-for-byte identical builds every time.",
      "Target pipeline feedback loop under 10 minutes: if CI takes 45 minutes, developers will bypass test suites and push directly to branches."
    ],
    failureModes: [
      {
        pitfall: "Writing monolithic single-script pipelines where test failures run after 30-minute container builds",
        impact: "Developers waste 30 minutes of CI runner time only to discover a missing semicolon or failing unit test.",
        resolution: "Structure pipelines into distinct sequential stages with linting and unit tests in Stage 1."
      }
    ],
    realWorldScenario: {
      title: "The 50-Minute Feedback Loop Halts Engineering Velocity",
      situation: "A team of 40 developers complained that PR merges took over 2 hours due to serial CI pipeline execution.",
      investigation: "The pipeline ran e2e tests, Docker image builds, and integration tests in a single sequential bash job on one runner.",
      fix: "Refactored the pipeline into a DAG with parallelized test jobs and isolated linting checks, cutting CI turnaround time to 7 minutes."
    }
  },
  {
    id: "build-stages",
    name: "2. Build Stages",
    subtitle: "Directed Acyclic Graphs (DAG), Parallelism & Gateways",
    category: "Core Foundations",
    mentalModel: "Build Stages group independent tasks into logical phases (e.g. Lint -> Test -> Compile -> Package -> Deploy). Tasks within a stage run concurrently, while stages execute sequentially with strict quality gates.",
    coreMechanism: "The orchestrator models execution dependencies as a Directed Acyclic Graph (DAG) using `needs` or `depends_on`. Downstream stages only execute if all parent dependencies succeed with exit code 0. If any dependency fails, all subsequent jobs are canceled.",
    keySyntax: [
      {
        label: "GitHub Actions Job DAG (`needs` syntax)",
        code: `jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [...]

  unit-tests:
    runs-on: ubuntu-latest
    steps: [...]

  build-artifact:
    needs: [lint, unit-tests] # Runs ONLY if both lint and test succeed
    runs-on: ubuntu-latest
    steps: [...]

  deploy-staging:
    needs: [build-artifact]
    runs-on: ubuntu-latest
    steps: [...]`,
        explanation: "`lint` and `unit-tests` execute in parallel across separate runners, cutting total pipeline execution time in half."
      }
    ],
    productionCommands: [
      { cmd: "gh workflow view --yaml", desc: "Display raw workflow configuration and inspect job dependencies", level: "read" },
      { cmd: "gh run rerun <run_id> --failed", desc: "Rerun only the specific failed jobs in a pipeline without re-executing passing stages", level: "write" }
    ],
    productionRules: [
      "Design for the 'Fail Fast' principle: place fast static checks (ESLint, TypeCheck, Trivy) in the first stage before expensive integration tests.",
      "Always set job timeouts (`timeout-minutes: 15`) to prevent hung processes from blocking runners indefinitely."
    ],
    failureModes: [
      {
        pitfall: "Deploying straight to production in the same stage as test executions",
        impact: "If the deploy script encounters a network blip, developers cannot retry the deploy without rerunning the entire test suite.",
        resolution: "Decouple artifact building from environment deployment into separate stages."
      }
    ],
    realWorldScenario: {
      title: "The Phantom Staging Deployment on Broken Master",
      situation: "A broken PR merged to `main` and immediately deployed to staging despite failing 14 integration tests.",
      investigation: "The deployment job had `if: always()` configured, instructing GitHub Actions to run the deployment even if previous test jobs failed.",
      fix: "Removed `always()` and enforced `if: success()` with explicit `needs: [integration-tests]` dependencies."
    }
  },
  {
    id: "github-actions",
    name: "3. GitHub Actions",
    subtitle: "Event-Driven Workflows, Composite Actions & OIDC",
    category: "Engines & Runners",
    mentalModel: "GitHub Actions is an event-driven automation platform natively embedded in GitHub. Workflows (`.github/workflows/*.yaml`) execute jobs triggered by over 30 GitHub events (push, pull_request, workflow_dispatch, release).",
    coreMechanism: "GitHub creates an ephemeral VM or container for each job. Steps run in order within the runner. GitHub Actions uses JSON Web Tokens (OIDC) to securely authenticate with cloud providers (AWS, GCP, Azure) without storing long-lived IAM secret keys.",
    keySyntax: [
      {
        label: "Secure Production GitHub Actions Workflow with AWS OIDC",
        code: `name: Production CI/CD
on:
  push:
    branches: [main]

permissions:
  id-token: write # Required for AWS OIDC authentication
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS Credentials via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/github-ci-role
          aws-region: us-east-1
      - name: Deploy to Cloud
        run: ./scripts/deploy.sh`,
        explanation: "OIDC exchanges short-lived cryptographic tokens with AWS STS, eliminating permanent AWS access keys from GitHub Secrets."
      }
    ],
    productionCommands: [
      { cmd: "gh workflow list", desc: "List all active GitHub Actions workflows in the current repository", level: "read" },
      { cmd: "gh run view --log-failed", desc: "Instantly view terminal output of failed steps in the latest workflow run", level: "read" }
    ],
    productionRules: [
      "Pin all third-party Actions to full commit SHAs (`uses: actions/checkout@b4ffde...`), not mutable tags like `@v4`, to prevent supply chain poisoning.",
      "Always set minimal top-level `permissions: { contents: read }` to adhere to least-privilege security principles."
    ],
    failureModes: [
      {
        pitfall: "Referencing third-party actions by mutable tag (`uses: thirdparty/action@v1`)",
        impact: "If the maintainer's account is compromised, attackers can push malicious code under the existing `@v1` tag and steal CI secrets.",
        resolution: "Pin to exact commit SHAs and use Dependabot or Renovate for automated updates."
      }
    ],
    realWorldScenario: {
      title: "Production Secret Leak via Pull Request from Fork",
      situation: "An external contributor opened a PR on a public open-source project and printed all production database credentials.",
      investigation: "The workflow was triggered by `pull_request_target` instead of `pull_request`, running fork code with access to repository secrets.",
      fix: "Switched workflow trigger to `pull_request` and enforced strict environment secret protection rules requiring manual approval."
    }
  },
  {
    id: "gitlab-ci",
    name: "4. GitLab CI",
    subtitle: "Centralized `.gitlab-ci.yml`, Auto DevOps & Pipeline Schedules",
    category: "Engines & Runners",
    mentalModel: "GitLab CI uses a single declarative file (`.gitlab-ci.yml`) in the repository root. It natively supports Auto DevOps, container registries, Kubernetes clusters, and dynamic environment rollouts.",
    coreMechanism: "The GitLab Coordinator evaluates `.gitlab-ci.yml`, generates the job pipeline, and assigns jobs to registered GitLab Runners. Runners execute jobs inside Docker containers using the Docker executor, pulling images and mounting shared artifact directories.",
    keySyntax: [
      {
        label: "Production `.gitlab-ci.yml` Specification",
        code: `stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2

unit-tests:
  stage: test
  image: node:20-alpine
  script:
    - pnpm install --frozen-lockfile
    - pnpm test:ci
  artifacts:
    when: always
    reports:
      junit: junit.xml

deploy-prod:
  stage: deploy
  image: alpine/k8s:1.28.2
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      when: manual # Requires explicit manual button click
  script:
    - kubectl set image deployment/api api=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA`,
        explanation: "`rules: when: manual` injects a mandatory human approval gate before triggering production Kubernetes deployments."
      }
    ],
    productionCommands: [
      { cmd: "gitlab-runner status", desc: "Check status and connectivity of local registered GitLab Runner daemons", level: "read" },
      { cmd: "gitlab-ci-lint .gitlab-ci.yml", desc: "Validate syntax, stages, and variable substitutions in `.gitlab-ci.yml`", level: "read" }
    ],
    productionRules: [
      "Always set `artifacts: expire_in: 7 days` to prevent build artifacts and reports from permanently exhausting storage.",
      "Use `rules` instead of deprecated `only`/`except` directives for deterministic condition evaluations."
    ],
    failureModes: [
      {
        pitfall: "Omitting `cache: key` or using a static global cache key across all branches in GitLab CI",
        impact: "Feature branches overwrite master branch dependencies, causing intermittent compile failures and cache corruption.",
        resolution: "Set dynamic cache keys: `cache: key: $CI_COMMIT_REF_SLUG`."
      }
    ],
    realWorldScenario: {
      title: "Shared Runner Queue Starvation Shuts Down Deployments",
      situation: "A team waited 45 minutes for a critical production hotfix to start executing on shared GitLab runners.",
      investigation: "Another team was running 20 parallel end-to-end test jobs with no concurrency limits, saturating all shared runner tags.",
      fix: "Deployed dedicated self-hosted Kubernetes GitLab runners tagged strictly for production deployments."
    }
  },
  {
    id: "jenkins",
    name: "5. Jenkins",
    subtitle: "Enterprise Java Controller, Groovy Pipelines & Distributed Nodes",
    category: "Engines & Runners",
    mentalModel: "Jenkins is an open-source automation server built on a Controller-Agent architecture. Pipelines are defined declaratively or programmatically in `Jenkinsfile` using Apache Groovy.",
    coreMechanism: "The Jenkins Controller manages the web interface, plugin ecosystem, job scheduling, and security policies. It delegates build execution to ephemeral Agents (via SSH, JNLP, or Kubernetes Pods) to prevent workloads from executing on the master controller.",
    keySyntax: [
      {
        label: "Declarative `Jenkinsfile` with Kubernetes Agent",
        code: `pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: node:20-alpine
    command: ['sleep', '99d']
'''
        }
    }
    stages {
        stage('Test') {
            steps {
                container('node') {
                    sh 'pnpm install'
                    sh 'pnpm test'
                }
            }
        }
    }
    post {
        failure {
            slackSend channel: '#alerts', message: "Job \${env.JOB_NAME} failed!"
        }
    }
}`,
        explanation: "Declarative Jenkinsfiles run steps inside ephemeral Kubernetes agent pods, ensuring completely isolated environments per build."
      }
    ],
    productionCommands: [
      { cmd: "jenkins-cli -s http://jenkins:8080/ list-jobs", desc: "List all configured jobs and folders via Jenkins remote CLI", level: "read" },
      { cmd: "jenkins-cli -s http://jenkins:8080/ build <job_name> -s", desc: "Trigger a build execution and wait for completion in terminal", level: "write" }
    ],
    productionRules: [
      "Never run build steps directly on the Jenkins Controller (Master node): always assign builds to ephemeral worker agents.",
      "Lock down the Jenkins plugin ecosystem: audit installed plugins quarterly to eliminate critical CVE vulnerabilities."
    ],
    failureModes: [
      {
        pitfall: "Running builds with root privileges directly on the Jenkins Controller machine",
        impact: "A malicious pull request script modifies controller configuration files or reads credentials from `credentials.xml`.",
        resolution: "Set executor count to 0 on controller and run builds inside isolated ephemeral Docker/Kubernetes agent containers."
      }
    ],
    realWorldScenario: {
      title: "Master Node Freeze from 40GB Build Workspace Bloat",
      situation: "The Jenkins web UI crashed with OutOfMemoryError and became completely unresponsive.",
      investigation: "Builds were running on the controller node. 300 historical workspace directories containing `node_modules` filled the master disk.",
      fix: "Migrated all builds to ephemeral Kubernetes agents and configured the Workspace Cleanup plugin."
    }
  },
  {
    id: "runners-and-agents",
    name: "6. Runners and Agents",
    subtitle: "Compute Workhorses: Cloud-Hosted vs Self-Hosted Fleets",
    category: "Engines & Runners",
    mentalModel: "Runners (or Agents) are the physical, virtual, or containerized execution environments where pipeline steps actually run. Cloud-hosted runners provide zero maintenance; self-hosted runners provide custom hardware, internal VPC access, and cost efficiency.",
    coreMechanism: "The runner daemon initiates an outbound long-poll (HTTP Long Polling or WebSockets) to the CI server (GitHub, GitLab, Jenkins) requesting work. Because connections are outbound, runners can sit behind strict corporate firewalls and private VPC subnets with zero inbound ports open.",
    keySyntax: [
      {
        label: "Self-Hosted Runner Security Matrix",
        code: `# Cloud-Hosted (e.g. GitHub standard runners):
- 2 vCPU, 7GB RAM
- Fresh ephemeral VM per job (100% clean isolation)
- Outbound Internet access only (No access to private corporate VPCs)

# Self-Hosted (e.g. Actions Runner Controller in Kubernetes):
- Custom CPU/GPU resources
- Direct access to internal AWS VPC / database staging
- Must be EPHEMERAL to prevent persistent file contamination!`,
        explanation: "Self-hosted runners must be destroyed after every single job to prevent cross-job contamination and persistent malware."
      }
    ],
    productionCommands: [
      { cmd: "gh api -X GET /orgs/<org>/actions/runners", desc: "Query status, busy state, and OS tags of self-hosted runner fleets", level: "read" },
      { cmd: "kubectl get pods -n actions-runner-system", desc: "Inspect ephemeral runner pods orchestrated by Actions Runner Controller (ARC)", level: "read" }
    ],
    productionRules: [
      "Never use persistent self-hosted runners for public repositories: fork pull requests can execute malicious code that hijacks the host.",
      "Deploy self-hosted runners using ephemeral container autoscalers (e.g. Actions Runner Controller - ARC on Kubernetes)."
    ],
    failureModes: [
      {
        pitfall: "Using persistent, static self-hosted runners where build files persist between runs",
        impact: "Job A writes a file or modifies `/etc/hosts`; Job B runs on the same machine, reads credentials left behind, or inherits a corrupted state.",
        resolution: "Enforce ephemeral runners that terminate immediately upon job completion."
      }
    ],
    realWorldScenario: {
      title: "Bitcoin Miner Injected via Public PR onto Self-Hosted Runner",
      situation: "An AWS account bill surged by $8,000 due to 100% GPU utilization on CI build machines.",
      investigation: "A public repo had a self-hosted runner attached. An attacker opened a PR running a crypto-miner script on the company's internal AWS GPU runner.",
      fix: "Restricted self-hosted runners strictly to private internal repositories and blocked PR execution from forks."
    }
  },
  {
    id: "artifacts",
    name: "7. Artifacts",
    subtitle: "Build Outputs: Binaries, Test Reports & Container Bundles",
    category: "Core Foundations",
    mentalModel: "An Artifact is an immutable, compiled output produced by a pipeline stage (e.g. Docker image, tarball, test report, coverage map) that is preserved, passed between jobs, or published for release.",
    coreMechanism: "When a job finishes, the runner uploads specified files over HTTPS to the CI orchestrator's object store (AWS S3 or Google Cloud Storage). Downstream jobs download and unpack these artifacts to continue processing without recompiling.",
    keySyntax: [
      {
        label: "Uploading & Downloading Artifacts in GitHub Actions",
        code: `# Job 1: Build & Package
- name: Upload Compiled Dist Artifact
  uses: actions/upload-artifact@v4
  with:
    name: production-bundle
    path: dist/
    retention-days: 7

# Job 2: Deploy (Consumes Artifact from Job 1)
- name: Download Production Bundle
  uses: actions/download-artifact@v4
  with:
    name: production-bundle
    path: dist/`,
        explanation: "Artifacts allow decoupled compute: compile on a heavy 16-core runner, then deploy using a lean 1-core runner."
      }
    ],
    productionCommands: [
      { cmd: "gh run download <run_id> -n production-bundle", desc: "Download build artifact archive directly to local machine for inspection", level: "read" },
      { cmd: "cosign sign --yes <image_digest>", desc: "Cryptographically sign an OCI container artifact to verify build authenticity", level: "write" }
    ],
    productionRules: [
      "Always set explicit `retention-days` (e.g. 7 or 14 days) on artifacts to prevent massive cloud storage billing spikes.",
      "Never store credentials or `.env` files in build artifacts: artifacts can be downloaded by any user with read access to the repo."
    ],
    failureModes: [
      {
        pitfall: "Uploading the entire project root including `node_modules` and `.git` as a build artifact",
        impact: "Upload/download times skyrocket to 10 minutes per stage, wasting gigabytes of bandwidth and slowing down deploys.",
        resolution: "Target only compiled production bundles (`dist/`, `build/`, `*.tar.gz`)."
      }
    ],
    realWorldScenario: {
      title: "The $4,000 Monthly GitHub Artifact Storage Bill",
      situation: "A company's monthly GitHub bill surged due to 18 Terabytes of artifact storage.",
      investigation: "Every PR pipeline uploaded a 1.2GB debug binary with the default 90-day retention period across 150 daily runs.",
      fix: "Reduced artifact retention to 3 days on PRs and stripped unneeded debug symbols from the artifact archives."
    }
  },
  {
    id: "caching-dependencies",
    name: "8. Caching Dependencies",
    subtitle: "Accelerating Pipelines: Content Hashing & Layer Reusability",
    category: "Quality & Caching",
    mentalModel: "Dependency caching preserves downloaded package directories (`node_modules`, `~/.m2`, `~/.cache/go-build`) between pipeline runs using lockfile content hashes (`package-lock.json`, `pnpm-lock.yaml`) as cache keys.",
    coreMechanism: "The runner computes a SHA256 hash of the lockfile. If a matching cache archive exists in remote object storage, it downloads and extracts it before dependencies are resolved. If the lockfile changes, the runner misses cache, downloads fresh packages, and uploads a new cache archive.",
    keySyntax: [
      {
        label: "Modern Lockfile Hashing Cache Pattern",
        code: `- name: Setup PNPM Cache
  uses: actions/cache@v4
  with:
    path: |
      ~/.local/share/pnpm/store
      node_modules
    key: \${{ runner.os }}-pnpm-\${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      \${{ runner.os }}-pnpm-`,
        explanation: "`restore-keys` allows falling back to the previous cache snapshot if an exact lockfile match is not found."
      }
    ],
    productionCommands: [
      { cmd: "gh cache list", desc: "List all active cache keys, sizes, and last accessed timestamps", level: "read" },
      { cmd: "gh cache delete <key>", desc: "Manually purge a corrupted or poisoned dependency cache key", level: "hazardous" }
    ],
    productionRules: [
      "Always hash the lockfile (`hashFiles('**/pnpm-lock.yaml')`) in your cache key to ensure dependencies stay 100% in sync with code.",
      "Do not cache generated code or build outputs (`dist/`): cache only external, immutable dependencies."
    ],
    failureModes: [
      {
        pitfall: "Using a static cache key (e.g. `key: my-cache`) that never invalidates",
        impact: "New packages added in PRs are ignored because the runner always restores the old static cache, resulting in runtime missing module errors.",
        resolution: "Include dynamic hash of the lockfile in the key."
      }
    ],
    realWorldScenario: {
      title: "Corrupted Node Module Cache Causes Flaky Production Builds",
      situation: "Deployments intermittently failed with `SyntaxError: Unexpected token` despite passing tests locally.",
      investigation: "A canceled CI run had committed a half-written cache archive to GitHub's cache store under a broad fallback key.",
      fix: "Purged all existing cache keys using `gh cache delete --all` and added `--frozen-lockfile` verification."
    }
  },
  {
    id: "automated-tests",
    name: "9. Automated Tests",
    subtitle: "The Quality Gate: Unit, Integration & E2E Test Runners",
    category: "Quality & Caching",
    mentalModel: "Automated Testing in CI is the non-negotiable safety net that prevents regressions from reaching production. It executes unit tests, integration tests, contract tests, and end-to-end (E2E) smoke tests automatically against every PR.",
    coreMechanism: "The CI runner launches test runners (Vitest, Jest, PyTest, Playwright). Test runners execute assertions in parallel across worker processes, output structured test results (JUnit XML), and capture test coverage. If any assertion fails, the job exits with a non-zero exit code.",
    keySyntax: [
      {
        label: "Parallel Test Matrix with Coverage Reporting",
        code: `jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1/4, 2/4, 3/4, 4/4] # Sharding tests across 4 parallel runners!
    steps:
      - uses: actions/checkout@v4
      - name: Run Sharded Vitest Suite
        run: pnpm test:unit --shard=\${{ matrix.shard }}
      - name: Publish Test Results
        uses: actions/upload-artifact@v4
        if: always() # Upload even if tests fail
        with:
          name: test-results-\${{ strategy.job-index }}
          path: junit.xml`,
        explanation: "Test sharding distributes 2,000 tests across 4 independent VMs, reducing test time from 16 minutes to 4 minutes."
      }
    ],
    productionCommands: [
      { cmd: "pnpm vitest run --coverage", desc: "Run test suite with Istanbul/V8 code coverage analysis", level: "read" },
      { cmd: "npx playwright test --reporter=html", desc: "Execute end-to-end browser tests and generate visual HTML failure traces", level: "read" }
    ],
    productionRules: [
      "Quarantine or delete flaky tests immediately: a test suite with 2% flakiness trains developers to ignore real test failures.",
      "Run tests against ephemeral databases (e.g. Testcontainers or ephemeral Postgres containers), never against shared staging databases."
    ],
    failureModes: [
      {
        pitfall: "Running end-to-end tests against a shared, live staging database in parallel PR pipelines",
        impact: "Concurrent PR runs delete and mutate each other's test records, triggering constant false-alarm test failures.",
        resolution: "Spin up isolated ephemeral database containers per test runner using Docker Compose."
      }
    ],
    realWorldScenario: {
      title: "Flaky Test Blindness Leads to Critical Billing Outage",
      situation: "A regression broke customer card renewals, but the PR was merged anyway.",
      investigation: "The renewal test had been failing intermittently for months as a 'known flaky test'. The author assumed this failure was also a fluke.",
      fix: "Enforced zero-tolerance flaky test quarantine and mandated automated retries with Playwright traces."
    }
  },
  {
    id: "linting",
    name: "10. Linting",
    subtitle: "Static Code Analysis, Style Enforcement & Type Safety",
    category: "Quality & Caching",
    mentalModel: "Linting is the first and fastest line of defense in CI. It analyzes source code without executing it, enforcing stylistic consistency, detecting syntax errors, eliminating dead code, and validating TypeScript types.",
    coreMechanism: "Static analysis engines (ESLint, Biome, Prettier, TypeScript `tsc --noEmit`, ShellCheck) parse source code into Abstract Syntax Trees (ASTs). AST rules verify patterns (e.g. no floating promises, no unescaped variables, no any types) and flag violations within milliseconds.",
    keySyntax: [
      {
        label: "Fail-Fast Static Validation Stage",
        code: `jobs:
  static-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - name: Fast Lint & Formatting (Biome)
        run: pnpm biome check .
      - name: Strict TypeCheck
        run: pnpm tsc --noEmit
      - name: ShellScript Security (ShellCheck)
        run: shellcheck scripts/*.sh`,
        explanation: "Static checks finish in under 30 seconds, catching syntax errors and type mismatches before any VM runs heavy tests."
      }
    ],
    productionCommands: [
      { cmd: "pnpm biome check --apply .", desc: "Instantly check and auto-format code according to strict style rules", level: "write" },
      { cmd: "shellcheck -x scripts/deploy.sh", desc: "Audit deployment bash script for POSIX compliance, quoting, and unbound variables", level: "read" }
    ],
    productionRules: [
      "Run linting and type-checking in PR checks with zero warnings allowed: `eslint --max-warnings 0`.",
      "Pair CI linting with Git pre-commit hooks (Husky/Lint-staged) so developers catch syntax errors locally before pushing."
    ],
    failureModes: [
      {
        pitfall: "Allowing warnings in CI (`--max-warnings > 0`)",
        impact: "Warnings accumulate into hundreds of unresolved issues, masking critical bugs like missing `await` on database operations.",
        resolution: "Enforce `--max-warnings 0` as a hard CI gate."
      }
    ],
    realWorldScenario: {
      title: "The Floating Promise that Skipped Stripe Webhook Verification",
      situation: "An unhandled rejection crashed the production API whenever Stripe sent subscription cancellation webhooks.",
      investigation: "A developer forgot `await` on `verifyWebhookSignature()`. TypeScript and ESLint caught this locally, but CI had linting disabled.",
      fix: "Turned on `@typescript-eslint/no-floating-promises` in CI as a required status check on all pull requests."
    }
  },
  {
    id: "secrets-in-ci",
    name: "11. Secrets in CI",
    subtitle: "Credential Protection, OIDC Federation & Secret Masking",
    category: "Security & Governance",
    mentalModel: "Secrets in CI allow pipelines to interact with registries, cloud providers, and databases. They must be encrypted at rest, masked in logs, restricted by environment policies, and ideally replaced with short-lived federated tokens.",
    coreMechanism: "The orchestrator injects secrets into the runner memory space as environment variables or temporary files. The runner automatically replaces known secret values in terminal output streams with `***`. Modern security replaces permanent access keys with OpenID Connect (OIDC) tokens.",
    keySyntax: [
      {
        label: "Permanent Keys vs Modern Cloud OIDC Federation",
        code: `# ❌ OLD ANTI-PATTERN: Permanent long-lived AWS IAM Secret Key
env:
  AWS_ACCESS_KEY_ID: \${{ secrets.AWS_KEY }}       # If leaked, gives permanent access
  AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET }}

# ✅ MODERN STANDARD: OpenID Connect (OIDC) Short-Lived Session
steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789:role/ci-deployer
      aws-region: us-east-1
      # No static secret keys! Authenticates via cryptographic JWT claims.`,
        explanation: "OIDC tokens expire within 15 minutes, rendering stolen CI credentials completely useless to attackers."
      }
    ],
    productionCommands: [
      { cmd: "gh secret list", desc: "List all configured repository and organization secret names without exposing values", level: "read" },
      { cmd: "gh secret set DATABASE_URL --body 'postgres://...'", desc: "Securely encrypt and write a secret into repository storage via CLI", level: "write" }
    ],
    productionRules: [
      "Never echo or print environment variables (`printenv`, `env`) in pipeline scripts: attackers can easily bypass log masking.",
      "Migrate all cloud provider deployments (AWS, GCP, Azure) to OIDC federated authentication."
    ],
    failureModes: [
      {
        pitfall: "Base64 encoding a secret to pass it between bash steps: `echo $SECRET | base64`",
        impact: "The CI log masker only masks the exact raw secret string. The base64-encoded string is printed in plain text to public build logs.",
        resolution: "Never transform or encode secrets in stdout; pass them strictly via memory or file descriptors."
      }
    ],
    realWorldScenario: {
      title: "AWS Account Hijacked via `npm test` Secret Theft",
      situation: "An attacker published a malicious minor update to an npm dependency that read `process.env` in CI and curled credentials to a remote server.",
      investigation: "The test stage had full production AWS access keys mounted in its environment, allowing the malware to exfiltrate keys.",
      fix: "Scoped secrets strictly to deployment stages and removed all production credentials from test and build environments."
    }
  },
  {
    id: "environments",
    name: "12. Environments",
    subtitle: "Deployment Targets: Dev, Staging & Production Isolation",
    category: "Security & Governance",
    mentalModel: "Environments model real-world deployment targets (e.g. `development`, `staging`, `production`). They enforce boundary controls, scoped secrets, deployment URL tracking, and required reviewer gates.",
    coreMechanism: "When a job declares `environment: production`, the CI orchestrator pauses execution until configured protection rules (branch restrictions, manual approval, wait timers) are satisfied. It then grants access to environment-specific secrets that are completely inaccessible to standard build jobs.",
    keySyntax: [
      {
        label: "GitHub Actions Environment Declaration",
        code: `jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://api.mycompany.com
    steps:
      - name: Deploy to Cloud
        env:
          # Injected ONLY after manual approval is granted in GitHub UI:
          PROD_DB_URL: \${{ secrets.PROD_DB_URL }}
        run: ./deploy.sh`,
        explanation: "The `PROD_DB_URL` secret cannot be read by unapproved PRs or malicious branch scripts."
      }
    ],
    productionCommands: [
      { cmd: "gh api /repos/<owner>/<repo>/environments", desc: "List configured environments and their protection rules", level: "read" },
      { cmd: "gh deployment list", desc: "Inspect recent deployment history, target environments, and statuses", level: "read" }
    ],
    productionRules: [
      "Strictly isolate secrets by environment: staging pipelines must never have access to production databases or payment gateways.",
      "Enforce branch protection: only commits merged into the protected `main` branch may target the `production` environment."
    ],
    failureModes: [
      {
        pitfall: "Using a single shared `DATABASE_URL` secret across all dev, staging, and production CI jobs",
        impact: "A developer testing a database migration script in a feature branch PR accidentally runs `prisma migrate reset` against production.",
        resolution: "Separate environments with scoped, isolated credential vaults."
      }
    ],
    realWorldScenario: {
      title: "Staging Pipeline Drops Production Customer Table",
      situation: "During an automated test run on staging, customer records in production were wiped out.",
      investigation: "The CI pipeline used repository-level secrets instead of environment-scoped secrets, causing the staging job to read the production DB URL.",
      fix: "Migrated all database credentials into strict environment secrets with required reviewer gates."
    }
  },
  {
    id: "approvals",
    name: "13. Approvals",
    subtitle: "Human Governance: Manual Sign-Offs & Change Freezes",
    category: "Security & Governance",
    mentalModel: "Approvals provide a human-in-the-loop governance gate before sensitive actions occur (e.g. deploying to production, running database migrations, destroying infrastructure).",
    coreMechanism: "The pipeline reaches an approval gateway and halts execution, entering a `waiting` state. It sends notifications (Slack, Email) to authorized approvers. Once approved via the UI or API, the runner claims the job, unlocks production secrets, and resumes execution.",
    keySyntax: [
      {
        label: "GitLab CI Manual Gate vs GitHub Actions Reviewers",
        code: `# GitLab CI Manual Approval:
deploy-prod:
  stage: deploy
  when: manual # Pipeline pauses here until human clicks "Play"
  script: ./deploy.sh

# GitHub Actions Environment Reviewers:
# Configured in Settings -> Environments -> Production:
# Required Reviewers: [Security-Lead, DevOps-Lead]
# Prevent self-review: Enabled (author cannot approve own deploy)`,
        explanation: "Enforcing 'prevent self-review' guarantees that at least two engineers inspect every production release."
      }
    ],
    productionCommands: [
      { cmd: "gh run list --status waiting", desc: "List all active workflow runs currently paused and waiting for human approval", level: "read" },
      { cmd: "gh api -X POST /repos/<org>/<repo>/actions/runs/<id>/pending_deployments", desc: "Programmatically approve a waiting production deployment gate", level: "write" }
    ],
    productionRules: [
      "Always enable 'Prevent self-review': the engineer who authors a pull request must not be allowed to approve their own production release.",
      "Configure automated Slack/PagerDuty webhooks alerting on-call engineers whenever a production deployment is awaiting approval."
    ],
    failureModes: [
      {
        pitfall: "Setting up a manual approval gate without a timeout window",
        impact: "A deployment waits in a pending state for 4 days. When someone finally clicks approve, it deploys stale code that overwrites recent hotfixes.",
        resolution: "Set approval timeouts (`timeout-minutes: 60`) after which pending deployments are automatically canceled."
      }
    ],
    realWorldScenario: {
      title: "The Weekend Accidental Release of an Unfinished Feature",
      situation: "An uncompleted billing revamp went live on Saturday morning, breaking checkout for thousands of customers.",
      investigation: "A junior engineer merged a PR on Friday evening. Because production had no approval gate, it deployed immediately without lead review.",
      fix: "Enforced mandatory production environment approval requiring two senior engineer sign-offs."
    }
  },
  {
    id: "blue-green-deploy",
    name: "14. Blue-Green Deploy",
    subtitle: "Zero-Downtime Traffic Switching & Instant Rollback Insurance",
    category: "Release Strategies",
    mentalModel: "Blue-Green deployment maintains two identical production environments: Blue (active live traffic) and Green (idle staging). The new release deploys to Green, is smoke-tested, and traffic is instantaneously flipped at the router or load balancer.",
    coreMechanism: "Both environments run simultaneously. When Green passes all health checks, the ingress controller or DNS router flips its routing target from Blue to Green within milliseconds. If an anomaly is detected, traffic is instantly flipped back to Blue with zero deployment delay.",
    keySyntax: [
      {
        label: "Kubernetes Service Selector Flip (Blue-Green Switch)",
        code: `# 1. Current State: Service routes to Blue
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector:
    app: api
    version: blue # <--- Currently Active Live Traffic

# 2. Deploy Green Deployment (version: green) and test privately
# 3. Flip traffic to Green instantly (0 downtime):
kubectl patch service api-service -p '{"spec":{"selector":{"version":"green"}}}'`,
        explanation: "Patching the Service selector updates iptables/IPVS across all worker nodes in under 200ms, instantly shifting traffic."
      }
    ],
    productionCommands: [
      { cmd: "kubectl get pods -l app=api --show-labels", desc: "Inspect running replicas across both Blue and Green deployment tiers", level: "read" },
      { cmd: "kubectl patch svc <name> -p '{\"spec\":{\"selector\":{\"version\":\"blue\"}}}'", desc: "EMERGENCY: Instantly revert traffic back to Blue environment", level: "hazardous" }
    ],
    productionRules: [
      "Database schema changes must be backward-compatible: both Blue and Green code versions must be able to read and write to the database concurrently.",
      "Keep the idle environment running for at least 1-2 hours after traffic switch before tearing it down to ensure instant rollback capability."
    ],
    failureModes: [
      {
        pitfall: "Deploying a breaking database migration (e.g. dropping a column) before switching traffic to Green",
        impact: "The active Blue environment crashes immediately, creating a major outage before Green is even verified.",
        resolution: "Follow the Expand/Contract (Parallel Run) database migration pattern."
      }
    ],
    realWorldScenario: {
      title: "Instant Recovery from a Memory Leak via Blue-Green Rollback",
      situation: "10 minutes after a major release, API memory utilization spiked to 98% under heavy customer traffic.",
      investigation: "A newly introduced cache logic had an unbounded memory leak. Recompiling or redeploying would have taken 15 minutes.",
      fix: "Executed a single `kubectl patch service` flipping traffic back to the running Blue tier; latency returned to normal in 400ms."
    }
  },
  {
    id: "canary-releases",
    name: "15. Canary Releases",
    subtitle: "Incremental Traffic Exposure & Automated Metric Analysis",
    category: "Release Strategies",
    mentalModel: "Canary releases route a tiny percentage of live production traffic (e.g. 1% -> 5% -> 25% -> 100%) to the new version while monitoring error rates, latency, and system health. If metrics degrade, traffic reverts automatically.",
    coreMechanism: "A service mesh (Istio, Linkerd) or smart ingress (Argo Rollouts, Flagger) splits HTTP traffic using weighted routing. An analysis controller monitors Prometheus metrics (e.g. HTTP 5xx rate < 0.5%, P99 latency < 200ms). If thresholds are breached, the rollout aborts immediately.",
    keySyntax: [
      {
        label: "Argo Rollouts Canary Specification",
        code: `apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: api-rollout
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 5    # Send 5% of traffic to new version
        - pause: { duration: 10m } # Wait 10m and evaluate Prometheus metrics
        - setWeight: 20   # If healthy, increase to 20%
        - pause: { duration: 30m }
        - setWeight: 100  # Promote fully to production`,
        explanation: "If Prometheus detects an increase in HTTP 500 errors during the 10m pause, Argo Rollouts aborts and restores 100% of traffic to the stable version."
      }
    ],
    productionCommands: [
      { cmd: "kubectl argo rollouts get rollout <name> --watch", desc: "Live terminal visualization of canary traffic weights, pods, and metric analysis", level: "read" },
      { cmd: "kubectl argo rollouts abort <name>", desc: "Immediately abort canary progression and revert 100% traffic to stable pods", level: "write" }
    ],
    productionRules: [
      "Canary releases require statistically significant traffic: testing a 1% canary on a service with only 10 requests per minute will never yield reliable metric data.",
      "Always configure automated rollback thresholds: never rely on humans watching Grafana dashboards for hours during canary progression."
    ],
    failureModes: [
      {
        pitfall: "Running a canary release on an unversioned API where the canary writes incompatible data into the shared database",
        impact: "Even though only 5% of users hit the canary, corrupted database records crash the 95% of users on the stable version.",
        resolution: "Enforce strict backward compatibility and schema discipline."
      }
    ],
    realWorldScenario: {
      title: "Silent Edge-Case Bug Neutralized by Canary Analysis",
      situation: "A bug in an updated payment library failed transactions only for users paying with Discover cards (0.8% of user base).",
      investigation: "The canary rollout routed 2% of traffic to the new version. Argo Rollouts detected a 400% surge in payment error metrics on the canary pods.",
      fix: "Argo Rollouts automatically aborted the release and reverted to stable; 99.2% of users were completely unaffected."
    }
  },
  {
    id: "rollbacks",
    name: "16. Rollbacks",
    subtitle: "Failure Recovery: Rollback vs Roll-Forward Discipline",
    category: "Release Strategies",
    mentalModel: "A Rollback is an emergency procedure that returns an application to its previous known-good state. High-velocity engineering teams automate rollbacks to execute in under 60 seconds when health criteria are violated.",
    coreMechanism: "Kubernetes, Helm, and ArgoCD store revision histories. Executing a rollback switches the target pointer to a previous immutable OCI container digest or Helm release secret without requiring a fresh Git commit or rebuild.",
    keySyntax: [
      {
        label: "Production Rollback Protocol Comparison",
        code: `# 1. Kubernetes Native Rollback:
kubectl rollout undo deployment/api-service --to-revision=2

# 2. Helm Release Rollback:
helm rollback core-api 14

# 3. ArgoCD / GitOps Rollback (The Pure Way):
# Revert the exact Git commit on main:
git revert HEAD --no-edit
git push origin main
# ArgoCD syncs and restores previous state via Git history!`,
        explanation: "Reverting via Git (`git revert`) preserves a complete cryptographic audit log of what was deployed and rolled back."
      }
    ],
    productionCommands: [
      { cmd: "kubectl rollout history deployment/<name>", desc: "Inspect previous deployment revisions, revision numbers, and causes", level: "read" },
      { cmd: "helm history <release_name>", desc: "List all deployed Helm revisions, timestamps, and deployment outcomes", level: "read" }
    ],
    productionRules: [
      "Prefer rolling back via Git (`git revert`) rather than manual cluster overrides: manual cluster overrides create immediate GitOps drift.",
      "Practice rollbacks in staging: an untested rollback mechanism will inevitably fail during a 2:00 AM production outage."
    ],
    failureModes: [
      {
        pitfall: "Executing an application rollback after applying an irreversible database migration (e.g. dropped columns)",
        impact: "The rolled-back old code boots up, attempts to read the dropped database column, crashes, and throws 500 errors across the board.",
        resolution: "Enforce non-destructive database migrations so older code can safely operate on newer database schemas."
      }
    ],
    realWorldScenario: {
      title: "The Manual Patch Drift that Blocked Emergency Rollback",
      situation: "An engineer rolled back a deployment using `kubectl rollout undo`. 2 hours later, the next CI deploy accidentally reintroduced the bug.",
      investigation: "The team rolled back in Kubernetes, but never reverted the code in Git. When another PR merged, CI deployed the broken code again.",
      fix: "Mandated that all rollbacks must be executed via `git revert` on the `main` branch."
    }
  },
  {
    id: "versioning",
    name: "17. Versioning",
    subtitle: "SemVer vs Git SHA: The Contract of Artifact Identifiers",
    category: "Core Foundations",
    mentalModel: "Versioning provides an unambiguous, immutable identity for software artifacts. Semantic Versioning (`MAJOR.MINOR.PATCH`) communicates compatibility contracts to users, while Git Commit SHAs guarantee exact source code traceability.",
    coreMechanism: "Automated versioning tools (Semantic Release, Changesets) inspect Conventional Commit messages (`feat:`, `fix:`, `feat!:`) to automatically increment the version number, generate CHANGELOG files, and tag releases in Git.",
    keySyntax: [
      {
        label: "Conventional Commits & Semantic Versioning Matrix",
        code: `Commit Message                  -> Semantic Version Bump
-----------------------------------------------------------
fix: fix payment timeout        -> PATCH (1.0.0 -> 1.0.1) - Bug fixes
feat: add apple pay support     -> MINOR (1.0.0 -> 1.1.0) - New features
feat!: redesign checkout API    -> MAJOR (1.0.0 -> 2.0.0) - BREAKING CHANGES

# Production Container Tagging Standard:
myorg/api:v1.4.2-sha-7f8a92b`,
        explanation: "Combining SemVer with the short Git SHA provides both human-readable version context and cryptographic commit traceability."
      }
    ],
    productionCommands: [
      { cmd: "git describe --tags --always", desc: "Get closest annotated Git tag and commit distance from current HEAD", level: "read" },
      { cmd: "npx standard-version --dry-run", desc: "Preview next calculated Semantic Version bump and changelog generation", level: "read" }
    ],
    productionRules: [
      "Never publish unversioned or mutable artifacts (e.g. `:latest` or `:dev`) to production registries.",
      "Adopt Conventional Commits (`feat:`, `fix:`, `perf:`, `chore:`) to automate version bumping and changelog maintenance."
    ],
    failureModes: [
      {
        pitfall: "Introducing a breaking API change under a MINOR or PATCH version bump",
        impact: "Third-party microservices pulling the new version crash immediately due to unexpected field types or deleted endpoints.",
        resolution: "Strictly adhere to SemVer: any breaking change mandates a MAJOR version bump."
      }
    ],
    realWorldScenario: {
      title: "The Breaking Patch Release that Crashed 12 Microservices",
      situation: "An internal shared auth library published `v2.1.4` that changed a function signature from synchronous to asynchronous.",
      investigation: "The developer assumed it was a 'minor internal tweak' and published it as a patch. Downstream services unpinned and broke.",
      fix: "Enforced automated Conventional Commit parsing via Changesets in CI, preventing manual version bumps."
    }
  },
  {
    id: "release-tags",
    name: "18. Release Tags",
    subtitle: "Git Annotated Tags, GitHub Releases & Audit Trails",
    category: "Core Foundations",
    mentalModel: "A Git Tag is an immutable pointer to a specific commit in repository history. Annotated tags store author details, timestamps, GPG signatures, and release notes, serving as the official audit anchor for production releases.",
    coreMechanism: "Creating a Git tag triggers webhook events (e.g. `on: push: tags: ['v*']`). The release pipeline validates test suites, builds immutable container images, signs artifacts using Cosign, creates a GitHub Release with changelogs, and triggers deployment.",
    keySyntax: [
      {
        label: "Creating Cryptographically Signed Git Tags",
        code: `# Create GPG-signed annotated release tag:
git tag -s v2.4.0 -m "Release v2.4.0: High-throughput Kafka consumer"

# Push tag to remote (triggers production release pipeline):
git push origin v2.4.0

# GitHub Actions Workflow Trigger on Tags:
on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+' # Matches v1.0.0, ignores test tags`,
        explanation: "Annotated tags signed with GPG provide cryptographic non-repudiation: prove who authorized the release."
      }
    ],
    productionCommands: [
      { cmd: "git tag -l -n3 'v*'", desc: "List recent release tags along with their annotated message summaries", level: "read" },
      { cmd: "gh release create v2.4.0 --generate-notes", desc: "Create a formal GitHub Release with automatically generated PR changelogs", level: "write" }
    ],
    productionRules: [
      "Never move or overwrite an existing release tag: if code needs to change, release a new patch version (`v2.4.1`).",
      "Sign all production release tags with GPG to verify authenticity."
    ],
    failureModes: [
      {
        pitfall: "Force-pushing an existing Git tag: `git tag -f v1.0.0 && git push -f origin v1.0.0`",
        impact: "Build caches become corrupted, downstream consumers receive mismatched code, and the audit trail is destroyed.",
        resolution: "Enforce protected tag rules in GitHub preventing tag deletion or force-pushing."
      }
    ],
    realWorldScenario: {
      title: "The Force-Pushed Tag that Broke Kubernetes Rollouts",
      situation: "A developer fixed a bug, moved the Git tag `v1.2.0`, and pushed it. Production nodes ran two different versions of code.",
      investigation: "Nodes that pulled `v1.2.0` previously had cached layers, while newly scaled nodes pulled the new `v1.2.0` image.",
      fix: "Locked down Git tags with protected rules and mandated new patch versions for every bug fix."
    }
  },
  {
    id: "gitops-argocd",
    name: "19. GitOps with ArgoCD",
    subtitle: "Declarative Git-As-Single-Source-Of-Truth & Auto-Sync",
    category: "GitOps & Delivery",
    mentalModel: "GitOps uses Git as the single source of truth for declared infrastructure and application state. ArgoCD continuously monitors Git repositories and automatically synchronizes (reconciles) live cluster state to match Git.",
    coreMechanism: "The ArgoCD Application Controller runs inside the Kubernetes cluster. It polls the Git repository for manifests (Helm, Kustomize, plain YAML). It compares the desired state in Git against the live state in the cluster. If drift occurs (e.g. manual `kubectl edit`), ArgoCD marks the app `OutOfSync` and auto-heals it.",
    keySyntax: [
      {
        label: "ArgoCD Application Custom Resource (CRD)",
        code: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: core-api-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'https://github.com/myorg/gitops-manifests.git'
    targetRevision: main
    path: environments/production
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: production
  syncPolicy:
    automated:
      prune: true    # Automatically deletes resources removed from Git!
      selfHeal: true # Automatically overrides manual cluster edits!`,
        explanation: "`selfHeal: true` immediately overwrites manual cluster edits, ensuring the cluster never deviates from Git."
      }
    ],
    productionCommands: [
      { cmd: "argocd app list", desc: "List all synchronized applications, sync status, and health states", level: "read" },
      { cmd: "argocd app sync <app_name>", desc: "Trigger an immediate manual synchronization of cluster state to Git", level: "write" },
      { cmd: "argocd app diff <app_name>", desc: "Display exact line-by-line diff between live cluster state and Git target", level: "read" }
    ],
    productionRules: [
      "Separate application source code repositories from GitOps configuration repositories: avoid circular CI commit loops.",
      "Always enable `selfHeal: true` and `prune: true` in production to eliminate manual configuration drift."
    ],
    failureModes: [
      {
        pitfall: "Committing GitOps manifests directly to the same repository as application source code",
        impact: "When CI builds and updates the image tag in Git, it triggers another CI run, causing an infinite build-and-commit loop.",
        resolution: "Maintain a dedicated `gitops-manifests` repository updated by CI."
      }
    ],
    realWorldScenario: {
      title: "Out-of-Band Production Fix Wiped by ArgoCD Self-Heal",
      situation: "An on-call engineer doubled pod memory using `kubectl edit` during an emergency. 3 minutes later, the pods restarted with the old memory limit.",
      investigation: "ArgoCD detected cluster drift from the Git manifest and executed `selfHeal`, reverting the cluster to match Git.",
      fix: "Trained engineers to commit emergency changes directly to the GitOps repository via fast PRs."
    }
  },
  {
    id: "pipeline-security",
    name: "20. Pipeline Security",
    subtitle: "Software Supply Chain, SLSA Framework & Zero-Trust Hardening",
    category: "Security & Governance",
    mentalModel: "Pipeline Security protects the software supply chain against code tampering, dependency poisoning, compromised build runners, and stolen credentials, adhering to the SLSA (Supply-chain Levels for Software Artifacts) framework.",
    coreMechanism: "Zero-trust CI enforces cryptographic verification at every step: scanning dependencies for CVEs (Trivy), generating Software Bill of Materials (SBOMs), signing container images using Cosign (Sigstore), verifying Git commit signatures, and sandboxing runner execution.",
    keySyntax: [
      {
        label: "Supply Chain Hardening (SBOM + Cosign Image Signing)",
        code: `# 1. Scan Container Vulnerabilities (Block on Critical CVEs)
- name: Vulnerability Scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: \${{ env.IMAGE_TAG }}
    exit-code: 1 # Fail pipeline if CRITICAL vulnerabilities exist
    severity: 'CRITICAL'

# 2. Generate Software Bill of Materials (SBOM)
- name: Generate SBOM
  uses: anchore/sbom-action@v0
  with:
    image: \${{ env.IMAGE_TAG }}
    format: spdx-json

# 3. Cryptographically Sign OCI Container with Keyless Cosign (OIDC)
- name: Sign Container Image
  run: cosign sign --yes \${{ env.IMAGE_TAG }}`,
        explanation: "Cryptographic signatures prove to Kubernetes admission controllers (e.g. Kyverno) that the image was built by authorized CI."
      }
    ],
    productionCommands: [
      { cmd: "cosign verify --certificate-identity=<identity> <image_digest>", desc: "Verify cryptographic digital signature and build provenance of a container image", level: "read" },
      { cmd: "trivy fs --scanners vuln,secret,config .", desc: "Audit local project files for leaked API keys, CVEs, and misconfigurations", level: "read" }
    ],
    productionRules: [
      "Never allow pipeline scripts to execute with root or administrative privileges.",
      "Enforce signed container image verification at admission time in Kubernetes using Kyverno or Gatekeeper."
    ],
    failureModes: [
      {
        pitfall: "Running unpinned third-party actions with write permissions to repository code and secrets",
        impact: "Attackers compromise an upstream action dependency and exfiltrate production secrets or inject backdoors into production builds (SolarWinds style).",
        resolution: "Pin all actions to full commit SHAs and restrict workflow token permissions to `contents: read`."
      }
    ],
    realWorldScenario: {
      title: "Supply Chain Attack Intercepted by Keyless Cosign Verification",
      situation: "An attacker obtained credentials to a company's Docker Hub repository and pushed a trojanized container tag.",
      investigation: "The attacker pushed directly to Docker Hub, bypassing GitHub Actions. When Kubernetes attempted to pull the image, the Kyverno policy rejected it because the image lacked a valid Cosign cryptographic signature from GitHub Actions OIDC.",
      fix: "The cluster remained uncompromised due to mandatory admission signature verification."
    }
  }
];

