# 💻 17. The Production Scripting & Automation Playbook
> Master Reference: 20 Core Scripting & Automation Concepts for Full-Stack & DevOps Engineers

---

## 🗺️ Table of Contents
1. [01. Bash Basics (Shebang, Subshells, Execution Tracing)](#01-bash-basics-shebang-subshells-execution-tracing)
2. [02. Variable Loop (Array Expansions, While-Read & IFS Safety)](#02-variable-loop-array-expansions-while-read--ifs-safety)
3. [03. Conditionals (Double Brackets [[ vs [, Operators, Regex Matching)](#03-conditionals-double-brackets--vs--operators-regex-matching)
4. [04. Functions (Local Scoping, Positional Args & Stdout Returns)](#04-functions-local-scoping-positional-args--stdout-returns)
5. [05. Exit Codes ($?, Exit Status Contracts & Sysexits Standards)](#05-exit-codes--exit-status-contracts--sysexits-standards)
6. [06. Arguments and Flags (Positional $1, Shift & getopts CLI Parsing)](#06-arguments-and-flags-positional-1-shift--getopts-cli-parsing)
7. [07. Text Processing (Unix Streaming Trio: cut, tr, sort, uniq, paste)](#07-text-processing-unix-streaming-trio-cut-tr-sort-uniq-paste)
8. [08. Error Handling (The Strict Mode: set -euo pipefail & Trap Handlers)](#08-error-handling-the-strict-mode-set--euo-pipefail--trap-handlers)
9. [09. Python for Automation (subprocess.run, pathlib, argparse & Complexity Threshold)](#09-python-for-automation-subprocessrun-pathlib-argparse--complexity-threshold)
10. [10. Caching API (HTTP Headers, ETags, Conditional Requests & Local TTL Stores)](#10-caching-api-http-headers-etags-conditional-requests--local-ttl-stores)
11. [11. JSON with jq (Identity Selectors, Raw Strings, Slicing & Reshaping)](#11-json-with-jq-identity-selectors-raw-strings-slicing--reshaping)
12. [12. YAML (Indentation Rules, Anchors, Aliases & yq CLI Manipulation)](#12-yaml-indentation-rules-anchors-aliases--yq-cli-manipulation)
13. [13. Regular Expressions (BRE vs ERE vs PCRE, Quantifiers & Boundaries)](#13-regular-expressions-bre-vs-ere-vs-pcre-quantifiers--boundaries)
14. [14. Scheduling Script (Crontab Environment Gotchas, Systemd Timers & flock)](#14-scheduling-script-crontab-environment-gotchas-systemd-timers--flock)
15. [15. Idempotent Script (State Verifications, Atomic Symlinks & Safe Mutations)](#15-idempotent-script-state-verifications-atomic-symlinks--safe-mutations)
16. [16. Makefiles (Dependency DAGs, .PHONY Targets & Self-Documenting Help)](#16-makefiles-dependency-dags-phony-targets--self-documenting-help)
17. [17. Environment Files (Twelve-Factor Config, Dotenv Loaders & chmod 600)](#17-environment-files-twelve-factor-config-dotenv-loaders--chmod-600)
18. [18. Logging in Scripts (Structured Logs, ISO-8601 UTC & Stderr Sinks)](#18-logging-in-scripts-structured-logs-iso-8601-utc--stderr-sinks)
19. [19. Testing Script (ShellCheck Static Analysis, BATS Unit Tests & Mocking)](#19-testing-script-shellcheck-static-analysis-bats-unit-tests--mocking)
20. [20. Automation Mindset (The Rule of Three, Dry-Run Flags & Fail-Safe Design)](#20-automation-mindset-the-rule-of-three-dry-run-flags--fail-safe-design)

---

### 01. Bash Basics (Shebang, Subshells, Execution Tracing)
- **Mental Model**: A shell script is an interpreted executable batch file. The Shebang (`#!/usr/bin/env bash`) specifies the interpreter path portably across Linux, macOS, and BSD systems.
  - Subshells: Scripts execute in isolated child processes. Variables declared inside do not mutate the caller's environment unless sourced (`source script.sh`).
  - Execution Tracing: `set -x` prints every command and its expanded arguments before execution, providing instant runtime transparency.
- **Production Template**:
  ```bash
  #!/usr/bin/env bash
  set -euo pipefail
  IFS=$'\n\t'
  [[ "${DEBUG:-false}" == "true" ]] && set -x
  ```

---

### 02. Variable Loop (Array Expansions, While-Read & IFS Safety)
- **Mental Model**: Iteration in Bash requires defensive quoting to prevent word-splitting on spaces and accidental pathname expansion (globbing).
  - Array Iteration: Always quote expansions `"${items[@]}"`.
  - Stream Iteration: Use `while IFS= read -r line || [[ -n "$line" ]]; do ... done < file.txt`. The `IFS=` prevents stripping whitespace; `-r` prevents backslash character escapes.
  - Golden Rule: NEVER loop over `$(ls)`; use native shell globs (`for f in *.log; do`).

---

### 03. Conditionals (Double Brackets [[ vs [, Operators, Regex Matching)
- **Mental Model**:
  - Legacy `[ ... ]` (`test`): Subject to word-splitting errors if variables are unquoted. Requires escaping for logical conjunctions.
  - Modern `[[ ... ]]`: Built-in keyword. Prevents word-splitting on unquoted variables, supports regex matching (`=~`), and enables standard `&&` and `||` logical operators.
  - Operators: `-z` (string empty), `-n` (string non-empty), `-f` (regular file), `-d` (directory), `-s` (file non-empty), `-eq`/`-ne` (numeric integer equality).

---

### 04. Functions (Local Scoping, Positional Args & Stdout Returns)
- **Mental Model**: Reusable procedural blocks.
  - Scope: By default, ALL variables in Bash functions are **global**. Always declare variables with `local var="value"` to prevent contaminating the caller's environment.
  - Return Values: `return N` sets the numeric exit status (`$?`, 0–255), NOT data. To return data, write to `stdout` (`echo "$result"`) and capture at the call site: `res=$(my_func)`.
  - Diagnostics: Direct log messages to `stderr` (`echo "log" >&2`) so `stdout` remains pristine for data assignment.

---

### 05. Exit Codes ($?, Exit Status Contracts & Sysexits Standards)
- **Mental Model**: Every command terminates with an 8-bit integer exit code (0–255) accessible via `$?`.
  - `0`: Success.
  - `1`: General unclassified error.
  - `126`: Command found but non-executable (permissions).
  - `127`: Command not found (PATH issue).
  - `128+N`: Fatal signal `N` (e.g. `137` = $128 + 9$ = killed by OOM killer).
- **Rule**: Explicitly exit with non-zero (`exit 1`) on fatal validation errors; never let a broken script silently reach EOF with implicit code 0.

---

### 06. Arguments and Flags (Positional $1, Shift & getopts CLI Parsing)
- **Mental Model**: Scripts accept positional parameters: `$1, $2, ... $9`, `${10}`, `$#` (count), `$@` (array of arguments).
  - `shift`: Slides positional parameters leftward (`$2` becomes `$1`, `$#` decrements).
  - `getopts`: The POSIX built-in option parser for handling short flags (`-e production -p 3000 -v`).

---

### 07. Text Processing (Unix Streaming Trio: cut, tr, sort, uniq, paste)
- **Mental Model**: The core Unix pipeline filters:
  - `cut -d':' -f1`: Extracts specific delimiter-separated fields.
  - `tr -d '\r'`: Translates or strips characters (mandatory for sanitizing Windows CRLF line endings).
  - `sort -nr`: Orders lines numerically in reverse.
  - `uniq -c`: Deduplicates and counts occurrences (**input MUST be sorted first**).
  - `xargs -0`: Safely converts null-delimited stream tokens into command arguments.

---

### 08. Error Handling (The Strict Mode: set -euo pipefail & Trap Handlers)
- **The Unofficial Bash Strict Mode**:
  - `set -e`: Exit immediately if any command returns non-zero.
  - `set -u`: Exit immediately if an uninitialized variable is referenced.
  - `set -o pipefail`: Propagate failures inside piped commands (`cmd1 | cmd2`).
- **Trap Handlers**:
  ```bash
  scratch_dir=$(mktemp -d)
  cleanup() {
      rm -rf "$scratch_dir"
  }
  trap cleanup EXIT ERR INT TERM
  ```

---

### 09. Python for Automation (subprocess.run, pathlib, argparse & Complexity Threshold)
- **Mental Model**: Switch from Bash to Python whenever scripts exceed 100 lines, require complex nested JSON parsing, associative arrays, REST APIs, or mathematical calculations.
  - Use `subprocess.run([...], check=True, text=True, capture_output=True)` (never `shell=True`).
  - Use `pathlib.Path` for cross-platform object-oriented filesystem operations.
  - Use `argparse` for strongly typed CLI interfaces.

---

### 10. Caching API (HTTP Headers, ETags, Conditional Requests & Local TTL Stores)
- **Mental Model**: Prevent third-party API rate-limit lockouts (GitHub, Stripe, AWS) in automated CI/CD scripts.
  - Send `If-None-Match: "<etag>"`: Server returns `HTTP 304 Not Modified` with zero body and zero quota consumption.
  - File-Based Caching: Cache responses locally to `/tmp/api_cache_<hash>.json` with a TTL expiration check before triggering network calls.

---

### 11. JSON with jq (Identity Selectors, Raw Strings, Slicing & Reshaping)
- **Mental Model**: The stream-based command-line JSON processor.
  - `jq -r '.field'`: Raw string output (mandatory for shell variable assignment without quotes).
  - `.[ ] | select(.status == "active")`: Filtering objects inside arrays.
  - `jq -n --arg id "$ID" '{userId: $id}'`: Safely construct valid JSON payloads without string interpolation syntax bugs.

---

### 12. YAML (Indentation Rules, Anchors, Aliases & yq CLI Manipulation)
- **Mental Model**: Human-readable configuration language (Kubernetes, Docker Compose, GitHub Actions).
  - **Tabs are strictly forbidden** (spaces only, standard 2-space indentation).
  - Anchors (`&name`) and Aliases (`*name`): Keep large manifests DRY by reusing configuration blocks.
  - Merging (`<<: *name`): Inherit shared settings into service definitions.
  - Manipulation: Use `yq` for CLI querying and in-place mutation.

---

### 13. Regular Expressions (BRE vs ERE vs PCRE, Quantifiers & Boundaries)
- **Mental Model**:
  - BRE (Basic): Metacharacters `+`, `?`, `|`, `()` require backslashes (`\+`, `\|`).
  - ERE (Extended, `grep -E`): Full operator support without backslash escaping.
  - PCRE (Perl, `grep -P`): Lookaheads `(?=...)`, lookbehinds `(?<=...)`, and non-greedy quantifiers `.*?`.
  - Anchors: `^` (line start), `$` (line end), `\b` (word boundary).

---

### 14. Scheduling Script (Crontab Environment Gotchas, Systemd Timers & flock)
- **Mental Model**:
  - Cron (`crontab -e`): Stripped environment trap (`PATH=/usr/bin:/bin`). Always specify absolute binary paths (`/usr/local/bin/node`).
  - Systemd Timers (`.timer` + `.service`): Modern standard with automatic systemd journal logging, resource limits (`MemoryMax`), and dependency ordering.
  - Non-Overlapping Lock: Always use `flock -n /tmp/job.lock <script>` to prevent runaway overlapping instances.

---

### 15. Idempotent Script (State Verifications, Atomic Symlinks & Safe Mutations)
- **Mental Model**: Running an automation script 10 times must produce the exact same system state as running it once ($f(f(x)) = f(x)$).
  - Check before mutating (`grep -qxF 'KEY=val' file || echo 'KEY=val' >> file`).
  - Use `mkdir -p` (no error if exists), `rm -f` (no error if missing), and `ln -sfn` (atomic force symlink replace).
  - Zero-Downtime Deployment: Build to `/var/releases/v2` and atomically point `/var/current` via `ln -sfn`.

---

### 16. Makefiles (Dependency DAGs, .PHONY Targets & Self-Documenting Help)
- **Mental Model**: The universal developer task runner interface.
  - Construct Directed Acyclic Graphs (DAGs) where targets depend on prerequisites.
  - File Caching: Skips target if the target file is newer than prerequisite files.
  - `.PHONY`: Declares that targets are action recipes, not filenames on disk.
  - **TAB MANDATE**: Recipe commands MUST be indented with true TAB characters, never spaces.

---

### 17. Environment Files (Twelve-Factor Config, Dotenv Loaders & chmod 600)
- **Mental Model**: Strict separation of configuration from application code.
  - Format: `KEY=value` lines.
  - Security: Restrict permissions to `chmod 600 .env` (owner read/write only).
  - Git Hygiene: Always add `.env*` to `.gitignore` and commit a documented `.env.example`.
  - Safe Bash Loader: `set -a; [ -f .env ] && . .env; set +a`.

---

### 18. Logging in Scripts (Structured Logs, ISO-8601 UTC & Stderr Sinks)
- **Mental Model**: Observability at the script execution layer.
  - Write diagnostic logs to `stderr` (`>&2`) so `stdout` remains clean for data piping.
  - Timestamp format: Always use ISO-8601 in UTC (`date -u +"%Y-%m-%dT%H:%M:%SZ"`).
  - Standard Levels: `[DEBUG]`, `[INFO]`, `[WARN]`, `[ERROR]`.
  - Dual Output: Use `tee -a /var/log/deploy.log` to stream to terminal and persistent disk logs simultaneously.

---

### 19. Testing Script (ShellCheck Static Analysis, BATS Unit Tests & Mocking)
- **Mental Model**: Treating infrastructure scripts with the same engineering rigor as production software.
  - Static Linter: `shellcheck -x script.sh` catches unquoted variables, syntax anomalies, and portability bugs.
  - Syntax Check: `bash -n script.sh` validates grammar without running commands.
  - BATS (Bash Automated Testing System): TAP-compliant unit testing with `@test` blocks, assertions, setup, and teardown.

---

### 20. Automation Mindset (The Rule of Three, Dry-Run Flags & Fail-Safe Design)
- **The Philosophy of Leverage**:
  1. The Rule of Three: Do it manually once. Document it twice. Automate it the third time.
  2. Dry-Run Discipline: Every destructive script MUST implement a `--dry-run` flag that previews mutations without applying them.
  3. Fail-Closed / Fail-Safe: On any unexpected condition, immediately abort with a loud non-zero exit code (never guess).
  4. Minimize Blast Radius: Process records in small batches, apply locks, and verify preconditions.

