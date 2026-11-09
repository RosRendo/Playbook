export interface ScriptingCommand {
  cmd: string;
  desc: string;
  level: "read" | "write" | "hazardous";
}

export interface ScriptingConceptDetail {
  id: string;
  number: string;
  title: string;
  tagline: string;
  category:
    | "Bash Core & Flow Control"
    | "Robustness & Error Resilience"
    | "Data Formats & Parsing"
    | "Automation Tools & Python"
    | "Production Discipline & Mindset";
  mentalModel: string;
  keySyntax: string;
  productionCommands: ScriptingCommand[];
  productionRules: string[];
  failureModes: string[];
  realWorldScenario: string;
}

export const SCRIPTING_CONCEPTS: ScriptingConceptDetail[] = [
  {
    id: "bash-basics",
    number: "01",
    title: "Bash basics",
    tagline: "The foundation of Unix automation: Shebangs, subshells, execution modes, and tracing",
    category: "Bash Core & Flow Control",
    mentalModel:
      "A shell script is an interpreted executable batch file containing sequential commands. The first line is the Shebang (`#!/usr/bin/env bash`), which tells the kernel's `execve` system call which interpreter binary to spawn. Using `/usr/bin/env bash` is portable across Linux, macOS, and BSD systems where bash may reside in `/bin` or `/usr/local/bin`.\nScripts execute in an isolated child subshell process; variables created inside do not mutate the parent calling shell unless the script is sourced (`source script.sh` or `. script.sh`).\nEnable execution tracing with `set -x` (prints each command before execution) for immediate runtime visibility.",
    keySyntax:
      "Standard Production Script Header:\n#!/usr/bin/env bash\n# Description: Production database backup pipeline\n# Author: DevOps Team\n\nset -euo pipefail\nIFS=$'\\n\\t'\n\n# Enable debug trace if DEBUG env var is set\n[[ \"${DEBUG:-false}\" == \"true\" ]] && set -x",
    productionCommands: [
      { cmd: "chmod +x deploy.sh", desc: "Grant execute permissions (Owner/Group/World RX) to make script runnable.", level: "write" },
      { cmd: "./deploy.sh", desc: "Execute script in a separate isolated child subshell process.", level: "read" },
      { cmd: "source ./env.sh", desc: "Source script into current active shell session, preserving exported variables.", level: "write" },
      { cmd: "bash -n script.sh", desc: "Dry-run syntax validation without executing any commands.", level: "read" },
      { cmd: "bash -x script.sh", desc: "Run script with full command tracing enabled (prints every line with arguments).", level: "read" }
    ],
    productionRules: [
      "Always use '#!/usr/bin/env bash' instead of '#!/bin/bash' for cross-platform POSIX portability.",
      "Always run 'bash -n script.sh' in CI/CD pipelines to catch syntax typos before deployment.",
      "Never run production scripts downloaded with 'curl | bash' without inspecting the script text first."
    ],
    failureModes: [
      "Forgetting 'chmod +x' results in 'bash: ./deploy.sh: Permission denied' in automated CI/CD runners.",
      "Hardcoding `#!/bin/bash` breaks on systems (FreeBSD, Alpine, NixOS) where bash is installed in `/usr/local/bin/bash` or `/run/current-system/sw/bin/bash`."
    ],
    realWorldScenario:
      "A developer's deployment script hangs mysteriously on step 4. Running `bash -x deploy.sh` instantly reveals the script stalled on `ssh user@host` waiting for an interactive host-key confirmation prompt that was hidden without tracing."
  },
  {
    id: "variable-loop",
    number: "02",
    title: "Variable loop",
    tagline: "Iteration patterns: For-in arrays, C-style bounds, while-read pipelines, and IFS safety",
    category: "Bash Core & Flow Control",
    mentalModel:
      "Looping in Bash requires extreme vigilance against word splitting and pathname expansion (globbing).\n- Array Iteration: Always quote array expansions `\"${items[@]}\"`. Without quotes, array elements containing spaces (e.g. `\"My Documents\"`) are split into separate tokens.\n- Stream Iteration: Use `while IFS= read -r line; do ... done < file.txt`. The `IFS=` prevents trimming leading/trailing whitespace, and `-r` prevents backslash character escapes.\n- Avoid looping over command substitutions (`for f in $(ls)`). If a filename contains a space or newline, it breaks catastrophically. Use globbing (`for f in *.log; do`) instead.",
    keySyntax:
      "Array Loop:\nservers=(\"web-01\" \"web-02\" \"worker-01\")\nfor server in \"${servers[@]}\"; do\n    echo \"Pinging: ${server}\"\ndone\n\nSafe File Reader Loop:\nwhile IFS= read -r line || [[ -n \"$line\" ]]; do\n    echo \"Processing: ${line}\"\ndone < \"/etc/hosts\"",
    productionCommands: [
      { cmd: "for s in $(cat servers.txt); do ssh \"$s\" uptime; done", desc: "Iterate across server hostnames and check cluster load averages.", level: "read" },
      { cmd: "for f in /var/log/nginx/*.log; do [[ -f \"$f\" ]] && gzip -c \"$f\" > \"${f}.gz\"; done", desc: "Safely compress matching log files without parsing ls output.", level: "write" },
      { cmd: "while ! nc -z localhost 5432; do sleep 1; done", desc: "Poll loop waiting for PostgreSQL port to accept TCP connections.", level: "read" }
    ],
    productionRules: [
      "NEVER parse the output of 'ls' in loops ('for f in $(ls *.txt)'); use direct shell globs ('for f in *.txt').",
      "Always quote variables inside loop bodies ('\"$item\"') to prevent word splitting on spaces.",
      "Include '|| [[ -n \"$line\" ]]' in while-read loops so files missing a trailing newline are not dropped."
    ],
    failureModes: [
      "Looping over `$(ls)` deletes `My` and `Reports.pdf` when encountering a file named `My Reports.pdf`.",
      "Infinite loop when a while condition tests a variable without updating it inside the block."
    ],
    realWorldScenario:
      "An automated backup script loops over database tables. One table is named `user audit logs`. Because the variable `$table` was unquoted in `pg_dump -t $table`, the command failed on 'user', skipping critical audit tables. Adding quotes `\"$table\"` fixes the export."
  },
  {
    id: "conditionals",
    number: "03",
    title: "Conditionals",
    tagline: "Test operators: Double brackets [[ vs single [, string evaluations, and file checks",
    category: "Bash Core & Flow Control",
    mentalModel:
      "Bash provides two testing constructs:\n- Legacy `[ ... ]` (or `test`): POSIX standard but fragile. Subject to word-splitting and filename expansion errors if variables are unquoted. Requires awkward escaping for boolean logic (`-a`, `-o`).\n- Modern `[[ ... ]]`: Bash keyword built-in. Safer, faster, does not word-split unquoted variables, supports regex matching via `=~`, and allows standard `&&` and `||` logical operators.\nOperators:\n- String: `-z` (string length is 0 / empty), `-n` (string is not empty), `==`, `!=`\n- File: `-f` (is regular file), `-d` (is directory), `-s` (file exists and size > 0), `-e` (exists)\n- Numeric: `-eq`, `-ne`, `-lt`, `-gt`, `-le`, `-ge` (or arithmetic `(( count > 5 ))`).",
    keySyntax:
      "Modern Conditional Idioms:\nif [[ -f \"/etc/app.env\" && -s \"/etc/app.env\" ]]; then\n    source \"/etc/app.env\"\nelif [[ ! -d \"/var/log/app\" ]]; then\n    mkdir -p \"/var/log/app\"\nelse\n    echo \"Default fallback\"\nfi\n\nRegex Pattern Match:\nif [[ \"$email\" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$ ]]; then\n    echo \"Valid email\"\nfi",
    productionCommands: [
      { cmd: "[[ -f .env ]] && echo 'Config exists' || echo 'Missing .env'", desc: "Inline short-circuit check verifying environment configuration file presence.", level: "read" },
      { cmd: "[[ -n \"${DATABASE_URL:-}\" ]] || { echo 'ERROR: DATABASE_URL not set' >&2; exit 1; }", desc: "Validate critical mandatory environment variable before execution.", level: "read" },
      { cmd: "[[ $(id -u) -eq 0 ]] || { echo 'Must be run as root' >&2; exit 1; }", desc: "Assert root privilege execution requirement.", level: "read" }
    ],
    productionRules: [
      "Always prefer '[[ ... ]]' over '[ ... ]' in Bash scripts to avoid silent word-splitting syntax errors.",
      "Use '-z' and '-n' to check for empty strings instead of comparing against empty quotes ('\"$var\" == \"\"').",
      "Use arithmetic contexts '(( x > 10 ))' for mathematical comparisons instead of string tests."
    ],
    failureModes: [
      "Using `[ $var -eq 1 ]` when `$var` is empty throws `bash: [: -eq: unary operator expected` and crashes.",
      "Accidentally using single equals in legacy `[` tests for numbers instead of `-eq`."
    ],
    realWorldScenario:
      "A deploy script checks if the database is seeded. Using `if [ $SEEDED = true ]` crashed when `$SEEDED` was uninitialized. Rewriting to `if [[ \"${SEEDED:-false}\" == \"true\" ]]` handles undefined variables gracefully without breaking execution."
  },
  {
    id: "functions",
    number: "04",
    title: "Functions",
    tagline: "Encapsulation & modularity: Local scopes, positional arguments, and stdout return patterns",
    category: "Bash Core & Flow Control",
    mentalModel:
      "Functions in Bash group reusable command blocks. Critical mechanics:\n- Variable Scope: By default, ALL variables declared inside functions are **global**! They mutate variables of the same name outside the function. Always use `local my_var=\"value\"` inside function bodies to encapsulate state.\n- Arguments: Functions receive their own isolated positional arguments (`$1`, `$2`, `$@`, `$#`). They do NOT overwrite the main script's arguments.\n- Return vs Output: `return 0..255` sets the **exit status code** (`$?`), NOT a return value. To return strings, arrays, or data objects, write to `stdout` (`echo \"$result\"`) and capture it at the call site with command substitution `result=$(my_func)`.",
    keySyntax:
      "Production Function Pattern:\nbackup_database() {\n    local db_name=\"$1\"\n    local output_dir=\"${2:-/tmp/backups}\"\n    local timestamp\n    timestamp=$(date +%F_%H%M%S)\n\n    mkdir -p \"$output_dir\"\n    pg_dump \"$db_name\" > \"${output_dir}/${db_name}_${timestamp}.sql\"\n    \n    # Echo result data to stdout\n    echo \"${output_dir}/${db_name}_${timestamp}.sql\"\n    return 0\n}\n\n# Call site\nbackup_file=$(backup_database \"production_db\" \"/var/backups\")",
    productionCommands: [
      { cmd: "log_info() { echo \"[$(date +%T)] [INFO] $*\" >&2; }", desc: "Define reusable timestamped log helper directing to stderr.", level: "read" },
      { cmd: "cleanup() { rm -f /tmp/lock.*; }", desc: "Define idempotent cleanup function for script exit traps.", level: "write" },
      { cmd: "type log_info", desc: "Inspect definition and body of a loaded shell function.", level: "read" }
    ],
    productionRules: [
      "Always declare variables with 'local' inside functions; accidental global variable pollution is the #1 cause of bash state bugs.",
      "Send diagnostic log messages inside functions to stderr (`>&2`) so stdout remains clean for data capture.",
      "Always validate expected argument counts at the top of functions (`[[ $# -ge 1 ]] || return 1`)."
    ],
    failureModes: [
      "Omitting 'local' causes a loop counter `i` inside a helper function to overwrite the outer loop's `i`, creating an infinite loop.",
      "A developer tries `return \"hello\"`; Bash returns `numeric argument required` and sets exit code 255."
    ],
    realWorldScenario:
      "A developer writes `fetch_token()` which outputs `echo 'Fetching token...'` and `echo '$token'`. At the call site, `TOKEN=$(fetch_token)` captured the log text inside the token variable! The fix: redirect the log message to stderr (`echo 'Fetching...' >&2`), leaving stdout pristine for the raw token."
  },
  {
    id: "exit-codes",
    number: "05",
    title: "Exit codes",
    tagline: "The contract of Unix success: 0 for glory, 1-255 for failure, and sysexits standards",
    category: "Robustness & Error Resilience",
    mentalModel:
      "Every command, script, and process exits with an 8-bit integer exit status (0–255) accessible via `$?`.\n- `0`: SUCCESS. The operation completed without error.\n- `1–255`: FAILURE. Standard conventions:\n  - `1`: General catch-all error\n  - `2`: Misuse of shell builtins / syntax error\n  - `126`: Command invoked cannot execute (permission problem)\n  - `127`: Command not found (binary not in PATH)\n  - `128+N`: Fatal error signal `N` (e.g. `137` = $128 + 9$ = process killed by SIGKILL / OOM Killer; `130` = $128 + 2$ = Ctrl+C SIGINT).\nCI/CD pipelines check `$?` after every step; an exit code >0 halts the deployment pipeline immediately.",
    keySyntax:
      "Checking and Propagation:\npg_dump my_db > backup.sql\nexit_code=$?\n\nif [[ $exit_code -ne 0 ]]; then\n    echo \"Backup failed with exit code: ${exit_code}\" >&2\n    exit \"$exit_code\"\nfi\n\nStandard Sysexits (/usr/include/sysexits.h):\nEX_USAGE=64       # Command line usage error\nEX_DATAERR=65     # Data format error\nEX_NOINPUT=66     # Cannot open input file\nEX_UNAVAILABLE=69 # Service unavailable\nEX_CONFIG=78      # Configuration error",
    productionCommands: [
      { cmd: "echo $?", desc: "Print exit status code of the immediately preceding command.", level: "read" },
      { cmd: "false; echo $?", desc: "Verify exit status of a failed command (outputs 1).", level: "read" },
      { cmd: "node -e 'process.exit(42)'; echo $?", desc: "Demonstrate propagation of application exit codes to shell.", level: "read" },
      { cmd: "exit 1", desc: "Terminate script immediately signaling generic failure to caller/CI.", level: "hazardous" }
    ],
    productionRules: [
      "Always save `$?` into a local variable immediately if you plan to inspect it; running any other command (even `echo`) overwrites `$?`.",
      "Explicitly exit with non-zero (`exit 1`) on fatal validation errors; never let a broken script silently reach the end with implicit code 0.",
      "Use meaningful exit codes so automated orchestrators know whether to retry (temporary service down) or abort (bad config)."
    ],
    failureModes: [
      "A database backup fails, but the script executes `echo 'Finished'` as the final line; the script exits with code 0, reporting false success to CI/CD.",
      "Process killed by OOM killer exits with code 137; sysadmin assumes it was a manual kill instead of checking kernel dmesg."
    ],
    realWorldScenario:
      "A migration script failed during step 2 of 5, but didn't have error handling. It continued to step 5, printed 'Deploy Complete', and exited 0. The CI pipeline reported green while the database was partially migrated. Adding explicit exit checks on `$?` stopped false-positive deploys."
  },
  {
    id: "arguments-and-flag",
    number: "06",
    title: "Arguments and flag",
    tagline: "CLI interface engineering: Positional variables, shift, and POSIX flag parsing with getopts",
    category: "Bash Core & Flow Control",
    mentalModel:
      "Scripts receive arguments through positional parameters:\n- `$0`: Script name\n- `$1, $2, ... $9`: Individual positional arguments (use `${10}` for 10 and above)\n- `$#`: Total count of arguments passed\n- `$@`: Array of all arguments (preserves quotes when quoted: `\"$@\"`)\n- `$*`: Single string of all arguments joined by first character of IFS\n- `shift`: Shifts positional parameters to the left (`$2` becomes `$1`, `$#` decrements).\nFor production CLIs with flags (`-e production -v -p 3000`), use the Bash built-in `getopts` parser to handle options cleanly.",
    keySyntax:
      "Production getopts Pattern:\n#!/usr/bin/env bash\n\nenvironment=\"staging\"\nverbose=false\nport=3000\n\nwhile getopts \":e:p:vh\" opt; do\n    case \"${opt}\" in\n        e) environment=\"${OPTARG}\" ;;\n        p) port=\"${OPTARG}\" ;;\n        v) verbose=true ;;\n        h) echo \"Usage: $0 [-e env] [-p port] [-v]\"; exit 0 ;;\n        \\?) echo \"Invalid option: -${OPTARG}\" >&2; exit 1 ;;\n        :)  echo \"Option -${OPTARG} requires an argument\" >&2; exit 1 ;;\n    esac\ndone\nshift $((OPTIND - 1))  # Remove parsed flags; remaining are positional args",
    productionCommands: [
      { cmd: "./deploy.sh -e production -p 8080 -v", desc: "Execute script with configured flag arguments.", level: "read" },
      { cmd: "echo \"Args count: $# | First arg: ${1:-none}\"", desc: "Inspect argument count and safe fallback for $1.", level: "read" }
    ],
    productionRules: [
      "Always pass arguments to child commands using '\"$@\"' (quoted); never use '$*' or unquoted '$@', which breaks arguments with spaces.",
      "Always include a `-h` / `--help` flag displaying usage and default values.",
      "Validate required arguments immediately after `getopts` finishes processing."
    ],
    failureModes: [
      "Passing a filename with spaces (`file name.txt`) to a script using unquoted `$@` splits it into two separate arguments.",
      "Using `$10` without braces; Bash evaluates it as `$1` followed by the literal character `0`."
    ],
    realWorldScenario:
      "A script expected `deploy.sh prod`. When run with `deploy.sh --dry-run prod`, it deployed to a database named `--dry-run`! Implementing `getopts` allowed flags and positional arguments to be parsed in any order safely."
  },
  {
    id: "text-processing",
    number: "07",
    title: "Text processing",
    tagline: "Stream manipulation: cut, tr, sort, uniq, paste, and column transformations",
    category: "Data Formats & Parsing",
    mentalModel:
      "Unix text processing revolves around streams of newline-delimited ASCII/UTF-8 records.\n- `cut`: Extracts specific character fields or delimiter-separated columns (`cut -d':' -f1`).\n- `tr`: Translates, squeezes, or deletes characters (e.g. converting uppercase to lowercase, stripping carriage returns `\r`).\n- `sort`: Orders lines alphabetically or numerically (`-n`), reverse (`-r`), or human-readable sizes (`-h`).\n- `uniq`: Filters duplicate lines (NOTE: input **MUST be sorted** first; `uniq` only detects adjacent duplicates). Flags: `-c` (count occurrences), `-d` (show only duplicates).\n- `xargs`: Converts standard input lines into arguments for another command.",
    keySyntax:
      "Common Unix Filtering Pipelines:\ncat /etc/passwd | cut -d: -f1,7     → Extract usernames and login shells\necho \"HELLO\" | tr '[:upper:]' '[:lower:]' → Convert to lowercase\ncat file.txt | tr -d '\\r'          → Strip Windows CRLF carriage returns\nsort -u file.txt                   → Sort and deduplicate in a single step\nawk '{print $1}' access.log | sort | uniq -c | sort -nr | head -10",
    productionCommands: [
      { cmd: "cat /etc/passwd | cut -d: -f1 | sort", desc: "Extract and sort all local system user account names.", level: "read" },
      { cmd: "tr -d '\\r' < windows_script.sh > unix_script.sh", desc: "Sanitize Windows CRLF line endings to POSIX LF line endings.", level: "write" },
      { cmd: "sort -k2,2nr /var/log/metrics.tsv", desc: "Sort TSV data numerically in reverse by second column.", level: "read" },
      { cmd: "find . -type f -name '*.tmp' -print0 | xargs -0 rm -f", desc: "Safely delete thousands of files handling spaces in filenames via null delimiter.", level: "write" }
    ],
    productionRules: [
      "Always sort before piping into 'uniq'; 'uniq' only groups consecutive adjacent identical lines.",
      "Always use '-print0' with find and '-0' with xargs to handle filenames with spaces or special characters safely.",
      "Beware of Windows `\r\n` (CRLF) line endings in shell scripts created on Windows; they fail with `\r: command not found` on Linux."
    ],
    failureModes: [
      "Running `uniq -c` on an unsorted file outputs separate count entries for non-adjacent identical records.",
      "Executing a bash script edited in Windows fails with `^M: bad interpreter: No such file or directory` due to CRLF line endings."
    ],
    realWorldScenario:
      "A developer commits a shell script from Windows. On the Linux server, running it throws `deploy.sh: line 2: $'\r': command not found`. Running `tr -d '\r' < deploy.sh > deploy_fixed.sh` strips the DOS carriage returns and restores execution."
  },
  {
    id: "error-handling",
    number: "08",
    title: "Error handling",
    tagline: "The Unofficial Bash Strict Mode: set -euo pipefail and trap signal cleanups",
    category: "Robustness & Error Resilience",
    mentalModel:
      "By default, Bash is astonishingly forgiving: if a command fails, it blithely continues to the next line. If you reference an undefined variable, it evaluates to empty string. If the first command in a pipeline fails, it ignores it.\n**The Unofficial Bash Strict Mode** transforms Bash into a defensive, resilient runtime:\n- `set -e`: Exit immediately if any command returns a non-zero status.\n- `set -u`: Exit immediately if an uninitialized variable is referenced.\n- `set -o pipefail`: Pipeline return code is that of the last failed command (not the last command overall).\n- `trap 'cleanup' EXIT ERR`: Registers an exit handler that runs on termination, guaranteed to clean up temporary files and locks even if the script crashes.",
    keySyntax:
      "Strict Mode + Trap Boilerplate:\n#!/usr/bin/env bash\nset -euo pipefail\n\nscratch_dir=$(mktemp -d)\n\ncleanup() {\n    local exit_code=$?\n    echo \"Cleaning up scratch dir: ${scratch_dir}\" >&2\n    rm -rf \"${scratch_dir}\"\n    exit \"$exit_code\"\n}\n\ntrap cleanup EXIT ERR INT TERM\n\n# Safe variable expansion with default fallback\nAPI_KEY=\"${INPUT_KEY:-default_secret}\"",
    productionCommands: [
      { cmd: "trap 'echo \"Script aborted by user\" >&2' INT", desc: "Catch Ctrl+C interrupt signal and execute graceful alert.", level: "read" },
      { cmd: "mktemp -d /tmp/app_build.XXXXXX", desc: "Safely create unique, collision-proof temporary working directory.", level: "write" }
    ],
    productionRules: [
      "Every production bash script MUST begin with 'set -euo pipefail'.",
      "Use '${VAR:-default}' or '${VAR:?\"Error: VAR is required\"}' when referencing optional or required variables under 'set -u'.",
      "Always clean up temporary files using an EXIT trap; it executes on successful exit, failure exit, and SIGINT."
    ],
    failureModes: [
      "THE INFAMOUS DISASTER: `TARGET_DIR=\"\" ; rm -rf $TARGET_DIR/` with uninitialized variable and NO `set -u` executes `rm -rf /`, destroying the root filesystem.",
      "Pipeline mask: `cat broken.sql | psql` succeeds with code 0 without `pipefail` because `psql` succeeded even though `cat` failed."
    ],
    realWorldScenario:
      "A script has `rm -rf /tmp/build/$BUILD_ID`. Due to an environment misconfiguration, `$BUILD_ID` was empty. Without `set -u`, it executed `rm -rf /tmp/build/`, wiping out all concurrent builds on the CI server. With `set -u`, Bash crashed with `BUILD_ID: unbound variable` before touching the disk."
  },
  {
    id: "python-for-automation",
    number: "09",
    title: "Python for automation",
    tagline: "When Bash hits its complexity ceiling: subprocess.run, pathlib, and structured scripting",
    category: "Automation Tools & Python",
    mentalModel:
      "Bash excels at glue code piping files between existing binaries (<100 lines). When a task requires complex data structures (nested JSON, hash maps), REST API integrations, mathematical calculations, or multi-platform portability, Bash becomes unreadable and brittle. Python is the premier system automation language.\nModern Python Automation Rules:\n- Use `subprocess.run([...], check=True, text=True, capture_output=True)` (never `os.system` or `shell=True`).\n- Use `pathlib.Path` for object-oriented filesystem operations instead of string concatenations.\n- Use `argparse` for rich CLI flags, typing, and automated `--help` generation.",
    keySyntax:
      "Production Python Automation Script:\n#!/usr/bin/env python3\nimport sys\nimport subprocess\nfrom pathlib import Path\n\ndef run_backup(target_dir: Path) -> None:\n    target_dir.mkdir(parents=True, exist_ok=True)\n    backup_file = target_dir / \"dump.sql\"\n    \n    try:\n        res = subprocess.run(\n            [\"pg_dump\", \"production_db\", \"-f\", str(backup_file)],\n            check=True,\n            capture_output=True,\n            text=True\n        )\n        print(f\"Backup saved: {backup_file}\")\n    except subprocess.CalledProcessError as err:\n        print(f\"Backup failed: {err.stderr}\", file=sys.stderr)\n        sys.exit(err.returncode)\n\nif __name__ == \"__main__\":\n    run_backup(Path(\"/var/backups\"))",
    productionCommands: [
      { cmd: "python3 -m venv .venv && source .venv/bin/activate", desc: "Create and activate isolated Python virtual environment.", level: "write" },
      { cmd: "pip install requests httpx pydantic", desc: "Install modern Python automation and HTTP client libraries.", level: "write" },
      { cmd: "python3 -c 'import json, sys; print(json.load(sys.stdin)[\"status\"])'", desc: "One-line JSON stream extraction in Python.", level: "read" }
    ],
    productionRules: [
      "Always set 'check=True' in 'subprocess.run'; without it, failed shell commands fail silently and return exit code 0.",
      "Never pass 'shell=True' to subprocess with untrusted input; it introduces command-injection vulnerabilities.",
      "Switch from Bash to Python whenever your script requires nested loops, JSON mutation, or regex parsing >50 lines."
    ],
    failureModes: [
      "Using `subprocess.Popen` without reading output buffers causes the child process to deadlock when OS pipe buffers fill up.",
      "Writing a 500-line Bash script with associative arrays and regex that no other engineer on the team can safely maintain."
    ],
    realWorldScenario:
      "An engineer attempts to parse a nested 20MB AWS EC2 API response in Bash using awk and sed. It breaks every time AWS adds a new JSON field. Rewriting it into a 25-line Python script using `boto3` and list comprehensions eliminates all parsing errors."
  },
  {
    id: "caching-api",
    number: "10",
    title: "Caching API",
    tagline: "Reducing latency & cost: Conditional HTTP requests, ETags, cache-control, and local key-value stores",
    category: "Data Formats & Parsing",
    mentalModel:
      "Automated scripts querying external APIs (GitHub, Stripe, Cloudflare, internal microservices) face rate limits and latency penalties. Proper API caching strategies:\n1. HTTP Header Caching: Inspect `Cache-Control: max-age=N` and `Expires`.\n2. Conditional Requests (ETags): Send `If-None-Match: \"<etag>\"`. If data hasn't changed, the server returns `HTTP 304 Not Modified` with zero body payload, consuming 0 rate-limit quota.\n3. File-Based Script Caching: Save API responses locally to `/tmp/api_cache_<hash>.json` with a TTL expiration check before triggering a network request.",
    keySyntax:
      "Conditional ETag Curl Request:\n# Save etag on initial fetch\ncurl -I -H \"Authorization: Bearer token\" https://api.github.com/repos/org/repo\n# Returns: ETag: \"a1b2c3d4...\"\n\n# Subsequent automated query sending ETag:\ncurl -H \"If-None-Match: \\\"a1b2c3d4...\\\"\" \\\n     -H \"Authorization: Bearer token\" \\\n     -s -w \"%{http_code}\" \\\n     https://api.github.com/repos/org/repo\n# If 304 -> Use local cached file!\n# If 200 -> Save new data and update cached ETag!",
    productionCommands: [
      { cmd: "curl -sI https://api.github.com/users/octocat | grep -i -E 'etag|cache-control|x-ratelimit'", desc: "Inspect API caching directives and rate limit allowances.", level: "read" },
      { cmd: "find /tmp/api_cache -type f -mmin +60 -delete", desc: "Purge cached API responses older than 60 minutes.", level: "write" }
    ],
    productionRules: [
      "Always implement client-side caching for CI/CD scripts polling third-party APIs to avoid rate-limit lockouts.",
      "Store cached responses in hashed filenames based on request URL and parameters (`md5sum <<< \"$URL\"`).",
      "Handle HTTP 429 Too Many Requests gracefully by reading the `Retry-After` header and implementing exponential backoff."
    ],
    failureModes: [
      "A CI pipeline making 100 API queries per commit hits GitHub's 60 req/hr unauthenticated rate limit, blocking all deploys.",
      "Caching sensitive API responses in `/tmp` with world-readable permissions (777), exposing customer data."
    ],
    realWorldScenario:
      "A deployment script queries the Slack API on every test run. During a busy afternoon with 200 commits, Slack returns `HTTP 429 Too Many Requests` and locks the bot for 1 hour. Adding a 5-minute local cache drops Slack requests by 95%."
  },
  {
    id: "json-with-jq",
    number: "11",
    title: "JSON with jq",
    tagline: "The command-line JSON processor: Selectors, array transformations, slicing, and raw output",
    category: "Data Formats & Parsing",
    mentalModel:
      "`jq` is a lightweight, blazingly fast command-line JSON processor. It reads standard input, applies filters, and formats output.\nKey Concepts:\n- Identity filter `.`: Pretty-prints formatted JSON.\n- Field access `.name`: Extracts object key.\n- Raw output `-r`: Strips JSON string quotes (mandatory for shell variable assignment: `TOKEN=$(echo $res | jq -r .token)`).\n- Array iteration `.[ ]`: Expands array elements.\n- Filters & Select: `select(.status == \"active\")`.\n- Object construction: `jq -n --arg id \"123\" '{userId: $id}'`.",
    keySyntax:
      "jq Cheat Sheet:\n.user.email                → Extract nested key value\n.items[0]                  → Access first array element\n.items[] | .name           → Extract 'name' from all items in array\n.[] | select(.age >= 18)   → Filter objects where age >= 18\n[.data[].id]               → Map and collect IDs into a new array\n{name: .title, id: .uuid}  → Reshape and construct new JSON object\njq -r '.token'             → Raw string output (no enclosing quotes)",
    productionCommands: [
      { cmd: "curl -s https://api.github.com/repos/stedolan/jq | jq -r '.stargazers_count'", desc: "Extract numeric field directly from remote API response.", level: "read" },
      { cmd: "cat package.json | jq '.scripts'", desc: "Pretty-print specific scripts object from package manifest.", level: "read" },
      { cmd: "echo '[{\"name\":\"web\",\"up\":true},{\"name\":\"db\",\"up\":false}]' | jq -r '.[] | select(.up == false) | .name'", desc: "Query names of all services whose 'up' status is false.", level: "read" },
      { cmd: "jq -n --arg v \"1.0.0\" --arg e \"prod\" '{version: $v, env: $e}'", desc: "Construct valid JSON object from shell variables without string interpolation bugs.", level: "read" }
    ],
    productionRules: [
      "Always use 'jq -r' when capturing values into shell variables; otherwise, the variable contains literal quotes (`\"my_token\"`).",
      "Always construct JSON payloads with 'jq -n --arg key \"$var\"' instead of string interpolation (`echo \"{\\\"key\\\": \\\"$var\\\"}\"`); string interpolation fails on quotes and newlines.",
      "Validate JSON syntax in CI scripts using 'jq empty config.json'."
    ],
    failureModes: [
      "Passing variable with quotes into an interpolated JSON string creates invalid JSON syntax: `{\"desc\": \"foo\"bar\"}`.",
      "Extracting missing key without `-e` flag returns literal `null`, which shell treats as a valid non-empty string."
    ],
    realWorldScenario:
      "A deploy script needs to find the AWS container image digest. Parsing with `grep` and `awk` broke whenever AWS changed JSON whitespace. Replacing with `IMAGE_DIGEST=$(echo \"$AWS_OUT\" | jq -r '.taskDefinition.containerDefinitions[0].image')` creates a permanent, indestructible parser."
  },
  {
    id: "yaml-processing",
    number: "12",
    title: "YAML",
    tagline: "Human-readable configuration: Docker Compose, Kubernetes manifests, anchors, and yq CLI",
    category: "Data Formats & Parsing",
    mentalModel:
      "YAML (YAML Ain't Markup Language) is the de facto standard for infrastructure configuration (Kubernetes, Docker Compose, GitHub Actions, Ansible). Unlike JSON, YAML is indentation-sensitive (spaces only, **tabs are strictly forbidden**).\nAdvanced Features:\n- Anchors (`&name`) and Aliases (`*name`): Define reusable configuration blocks to eliminate duplicate settings.\n- Merge Key (`<<: *name`): Inherits attributes from an anchor.\n- Multi-document streams: Separated by three dashes (`---`).\nCLI Processing: Use `yq` (the YAML equivalent of `jq`) to inspect and mutate YAML files programmatically.",
    keySyntax:
      "YAML Architecture with Anchors:\nversion: '3.8'\n\n# Define reusable anchor\nx-logging: &default-logging\n  driver: 'json-file'\n  options:\n    max-size: '10m'\n    max-file: '3'\n\nservices:\n  web:\n    image: nginx:alpine\n    logging: *default-logging  # Reference alias\n  api:\n    image: node:18\n    <<: *default-logging      # Merge keys",
    productionCommands: [
      { cmd: "yq eval '.services.web.image' docker-compose.yml", desc: "Query image field from Docker Compose manifest.", level: "read" },
      { cmd: "yq eval -i '.version = \"2.0.0\"' config.yaml", desc: "In-place programmatic mutation of YAML configuration file.", level: "write" },
      { cmd: "python3 -c 'import yaml, sys; yaml.safe_load(sys.stdin)' < config.yaml", desc: "Validate YAML syntax using Python's PyYAML parser.", level: "read" }
    ],
    productionRules: [
      "NEVER use Tab characters in YAML files; standard YAML parsers throw syntax errors on tabs (configure editor to insert 2 spaces).",
      "Always quote strings containing special characters or colons (`name: \"service:prod\"`).",
      "Use YAML anchors (`&`) and aliases (`*`) to keep large Docker Compose or Kubernetes manifests DRY."
    ],
    failureModes: [
      "Accidental tab character inserted by an editor causes `yaml.scanner.ScannerError: mapping values are not allowed here` in production deployments.",
      "The Norway Problem: An unquoted country code `country: NO` is evaluated as boolean `country: false` by YAML 1.1 parsers."
    ],
    realWorldScenario:
      "A Kubernetes cluster fails to deploy a service because an unquoted port was entered as `port: 80:80`. The parser interpreted it as a nested mapping rather than a string. Adding quotes `port: \"80:80\"` resolves the deployment error."
  },
  {
    id: "regular-expressions",
    number: "13",
    title: "Regular Expressions",
    tagline: "Pattern matching engines: BRE vs ERE, character classes, anchors, and lookarounds",
    category: "Data Formats & Parsing",
    mentalModel:
      "Regular expressions (Regex) define text search and replacement patterns.\n- Basic Regular Expressions (BRE): Default in `grep` and `sed`. Metacharacters `+`, `?`, `|`, `(`, `)` require backslash escaping (`\+`, `\|`).\n- Extended Regular Expressions (ERE): Enabled via `grep -E` or `sed -E`. Characters `+`, `?`, `|`, `()`, `{}` act as operators without backslashes.\n- PCRE (Perl-Compatible Regex): Supported in `grep -P`, Python, JavaScript. Adds lookaheads (`(?=...)`), non-capturing groups (`(?:...)`), and non-greedy quantifiers (`*?`).\nCore Anchors: `^` (start of line), `$` (end of line), `\b` (word boundary).",
    keySyntax:
      "Regex Metacharacter Cheat Sheet:\n^          → Start of line anchor\n$          → End of line anchor\n[0-9]+     → 1 or more numeric digits\n[a-zA-Z]   → Alphabetical character class\n\\b         → Word boundary anchor\n(A|B)      → Alternation (matches A OR B)\n.*         → Greedy match (any character 0 or more times)\n.*?        → Non-greedy / lazy match (stops at first occurrence)\n(?<=key=)  → Positive lookbehind",
    productionCommands: [
      { cmd: "grep -E '^[0-9]{1,3}(\\.[0-9]{1,3}){3}$' ips.txt", desc: "Validate IPv4 address format using Extended Regular Expressions.", level: "read" },
      { cmd: "grep -oP '(?<=transaction_id=)[a-zA-Z0-9]+' app.log", desc: "Extract only the transaction ID using PCRE positive lookbehind.", level: "read" },
      { cmd: "sed -E 's/([0-9]{4})-([0-9]{2})-([0-9]{2})/\\3\/\\2\/\\1/g' dates.txt", desc: "Reorder date components using capture groups and backreferences.", level: "write" }
    ],
    productionRules: [
      "Always use 'grep -E' instead of legacy BRE to avoid messy backslash escapes on parentheses and pipes.",
      "Beware of greedy matching with '.*'; it consumes all characters up to the final occurrence on the line. Use '[^\" ]*' instead.",
      "Test complex regular expressions on regex101.com before baking them into automated deployment scripts."
    ],
    failureModes: [
      "Catastrophic Backtracking: A poorly structured nested regex (e.g. `(a+)+$`) freezes CPU at 100% when parsing non-matching input strings.",
      "Greedy match `sed 's/<.*>//g'` strips everything from the first `<` to the LAST `>` on the line, deleting all content in between."
    ],
    realWorldScenario:
      "An automated log scrubber needs to redact credit card numbers. Running `sed -E 's/[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}/[REDACTED]/g' payment.log` sanitizes sensitive customer data before logs are shipped to Datadog."
  },
  {
    id: "scheduling-script",
    number: "14",
    title: "Scheduling script",
    tagline: "Automated recurring execution: Cron vs Systemd Timers, flock locks, and environment traps",
    category: "Automation Tools & Python",
    mentalModel:
      "Automated tasks run via two primary Linux schedulers:\n1. Cron (`crontab -e`): Simple, lightweight 5-field schedule. PITFALL: Executes with a stripped environment (`PATH=/usr/bin:/bin`). Commands calling `node` or `pnpm` fail unless absolute paths are specified.\n2. Systemd Timers (`.timer` + `.service`): Modern enterprise standard. Advantages over cron:\n   - Built-in logging via `journalctl -u mytask.service`\n   - System resource constraints (`MemoryMax=500M`)\n   - Dependency sequencing (`After=network.target`)\n   - Persistent catch-up (`Persistent=true` runs missed jobs if server was powered off)\nAlways prevent overlapping execution with `flock` (File Lock).",
    keySyntax:
      "Systemd Timer Unit Template (/etc/systemd/system/backup.timer):\n[Unit]\nDescription=Daily Database Backup Timer\n\n[Timer]\nOnCalendar=*-*-* 02:00:00\nPersistent=true\nRandomizedDelaySec=300\n\n[Install]\nWantedBy=timers.target\n\nNon-Overlapping Cron with flock:\n0 2 * * * /usr/bin/flock -n /tmp/backup.lock /usr/local/bin/backup.sh >> /var/log/backup.log 2>&1",
    productionCommands: [
      { cmd: "systemctl list-timers", desc: "List all active systemd timers, next trigger times, and elapsed durations.", level: "read" },
      { cmd: "crontab -l", desc: "List user scheduled cron jobs.", level: "read" },
      { cmd: "sudo systemctl enable --now backup.timer", desc: "Activate systemd timer to schedule recurring service triggers.", level: "write" }
    ],
    productionRules: [
      "Always wrap recurring jobs in 'flock -n' to prevent a slow job from running concurrently with the next trigger cycle.",
      "Prefer Systemd Timers over cron for critical enterprise tasks requiring dependency ordering and resource limits.",
      "Always redirect cron stdout and stderr (`>> /var/log/job.log 2>&1`) to avoid lost error traces."
    ],
    failureModes: [
      "A database backup taking 25 minutes runs on a 15-minute cron schedule without flock; 10 overlapping backups crash the database server.",
      "Cron job silently fails because `node` was installed in `/usr/local/bin` and cron's stripped PATH did not include it."
    ],
    realWorldScenario:
      "A billing sync cron job occasionally hung on external network timeouts. Every hour, a new instance spawned until 24 instances locked the database connection pool. Adding `flock -n /tmp/billing.lock` ensures only one instance ever executes at a time."
  },
  {
    id: "idempotent-script",
    number: "15",
    title: "Idempotent Script",
    tagline: "The golden law of DevOps: Running a script 10 times produces the exact same desired state",
    category: "Production Discipline & Mindset",
    mentalModel:
      "An operation is **Idempotent** if applying it multiple times produces the exact same system state as applying it once:\n$$f(f(x)) = f(x)$$\nNon-idempotent scripts break when retried after partial network failures or crashes. They fail on `mkdir` (folder already exists), append duplicate lines to `/etc/hosts`, or insert duplicate records into databases.\nIdempotency Tactics:\n- State Checks: Test if state exists before modifying (`grep -q line file || echo line >> file`).\n- Safe Flags: Use `mkdir -p` (no error if exists), `ln -sfn` (atomic force symlink replace), `rm -f` (no error if missing).\n- Declarative Configuration: Define the desired end state rather than imperative mutation steps.",
    keySyntax:
      "Idempotent Script Patterns:\n# 1. Directory creation\nmkdir -p /var/www/app\n\n# 2. Append line to config ONLY if not already present\ngrep -qxF 'net.ipv4.ip_forward = 1' /etc/sysctl.conf || \\\n    echo 'net.ipv4.ip_forward = 1' | sudo tee -a /etc/sysctl.conf\n\n# 3. Safe symlink creation/switch\nln -sfn /var/www/releases/v2.1.0 /var/www/current\n\n# 4. Idempotent user creation\nid -u deploy &>/dev/null || useradd -m -s /bin/bash deploy",
    productionCommands: [
      { cmd: "mkdir -p /var/log/app", desc: "Idempotently create directory tree (silently succeeds if already present).", level: "write" },
      { cmd: "ln -sfn /var/www/releases/v2 /var/www/current", desc: "Atomically update deployment symlink to new release directory.", level: "write" },
      { cmd: "grep -qxF 'FOO=bar' .env || echo 'FOO=bar' >> .env", desc: "Idempotently ensure setting exists in file without creating duplicates.", level: "write" }
    ],
    productionRules: [
      "Every setup, provision, and deployment script MUST be 100% idempotent; assume it will crash and be re-run at any step.",
      "Never use bare 'mkdir' or 'ln -s' without '-p' and '-sfn' flags in automation scripts.",
      "Use atomic symlink swaps (`ln -sfn`) for zero-downtime application deployments."
    ],
    failureModes: [
      "Re-running a non-idempotent setup script appends duplicate `alias` and `PATH` exports to `~/.bashrc` 15 times.",
      "Deploy script fails halfway through; re-running it throws `mkdir: cannot create directory: File exists` and aborts."
    ],
    realWorldScenario:
      "A CI deploy script failed at step 4. When re-triggered, step 1 threw `User 'deploy' already exists` with exit code 9, terminating the build. Rewriting to `id -u deploy &>/dev/null || useradd deploy` made the provisioning idempotent and retry-safe."
  },
  {
    id: "makefiles",
    number: "16",
    title: "Makefiles",
    tagline: "The timeless task runner: Dependency DAGs, phony targets, and self-documenting help",
    category: "Automation Tools & Python",
    mentalModel:
      "`make` is the universal developer workflow interface. It provides a standardized command entry point across different languages and stacks (`make build`, `make test`, `make deploy`).\nKey Mechanics:\n- Targets and Prerequisites: `target: dep1 dep2`. Make constructs a Directed Acyclic Graph (DAG) and executes prerequisites before targets.\n- File-based cache: If target file is newer than prerequisite files, Make skips execution!\n- `.PHONY` Targets: Directs Make that a target is an action command, NOT a filename on disk (e.g. `make test` is not creating a file named `test`).\n- TAB INDENTATION: Make commands **MUST be indented with a TAB character**, never spaces!",
    keySyntax:
      "Self-Documenting Production Makefile:\n.DEFAULT_GOAL := help\n.PHONY: help build test deploy clean\n\nhelp: ## Display available targets\n\t@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \\\n\t\tawk 'BEGIN {FS = \":.*?## \"}; {printf \"\\033[36m%-15s\\033[0m %s\\n\", $$1, $$2}'\n\nbuild: ## Compile production Next.js build\n\tpnpm --prefix apps/web build\n\ntest: ## Execute automated test suite\n\tpnpm test\n\ndeploy: test build ## Run tests, build, and deploy to production\n\t./scripts/deploy.sh",
    productionCommands: [
      { cmd: "make help", desc: "List all available project automation targets with aligned descriptions.", level: "read" },
      { cmd: "make build", desc: "Trigger build pipeline target with prerequisite dependency resolution.", level: "write" },
      { cmd: "make -n deploy", desc: "Dry-run: print commands that would be executed without running them.", level: "read" }
    ],
    productionRules: [
      "Always declare all action targets in '.PHONY' so Make doesn't check the filesystem for a file matching the target name.",
      "Always use true TAB characters for recipe line indentation; spaces cause '*** missing separator' syntax errors.",
      "Implement a self-documenting 'help' default goal so team members can discover tasks via 'make'."
    ],
    failureModes: [
      "A developer creates a directory named `test/`. Running `make test` outputs `make: 'test' is up to date.` and skips running tests because `.PHONY: test` was omitted.",
      "Editor replaces tabs with 4 spaces in Makefile, causing `Makefile:4: *** missing separator.  Stop.`."
    ],
    realWorldScenario:
      "A monorepo has 10 microservices across Go, Python, and TypeScript. Developers struggled with mismatched commands (`pnpm build`, `cargo build`, `go build`). Standardizing on `make build`, `make test`, and `make dev` unified the developer experience across all 10 projects."
  },
  {
    id: "environment-files",
    number: "17",
    title: "Environment files",
    tagline: "Twelve-Factor app config: Dotenv patterns, export parsing, permissions, and templates",
    category: "Data Formats & Parsing",
    mentalModel:
      "The Twelve-Factor App methodology mandates strict separation of config from code. Configuration that varies between environments (database URLs, Stripe keys, port numbers) lives in `.env` files.\nSecurity & Parsing Rules:\n- Format: `KEY=value` lines. Quotes are optional unless values contain spaces or special characters.\n- Loading in Shell: Never run `source .env` blindly; if a value contains spaces without quotes or special shell characters (`$`), it can trigger unintended command execution.\n- Git Security: Always list `.env*` in `.gitignore` and commit a redacted template `.env.example`.\n- Permissions: Set `.env` to `chmod 600` on production servers.",
    keySyntax:
      "Safe Dotenv Loader in Bash:\n# Export all variables from .env safely without sourcing arbitrary code\nset -a\n[ -f .env ] && . <(grep -v '^#' .env | sed -E 's/^([^=]+)=(.*)$/\\1=\"\\2\"/')\nset +a\n\nStandard .env.example Template:\nPORT=3000\nNODE_ENV=production\nDATABASE_URL=postgresql://user:password@localhost:5432/dbname\nSTRIPE_SECRET_KEY=sk_live_...\nNEXTAUTH_SECRET=generate_with_openssl_rand_base64_32",
    productionCommands: [
      { cmd: "chmod 600 .env", desc: "Restrict .env file read/write permissions strictly to owner user.", level: "write" },
      { cmd: "openssl rand -base64 32", desc: "Generate cryptographically secure 256-bit secret string for auth tokens.", level: "read" },
      { cmd: "diff <(cut -d= -f1 .env | sort) <(cut -d= -f1 .env.example | sort)", desc: "Compare production .env keys against template to identify missing settings.", level: "read" }
    ],
    productionRules: [
      "Never commit '.env' or secret keys to version control; check '.env*' into '.gitignore'.",
      "Always maintain an updated '.env.example' containing dummy values and documentation for every variable.",
      "Enforce 'chmod 600 .env' so unprivileged system accounts cannot read database credentials."
    ],
    failureModes: [
      "A junior developer commits `.env` containing production AWS credentials to a public GitHub repository; bots drain cloud quotas within 5 minutes.",
      "Missing an environment variable causes production application crash on startup because validation was missing."
    ],
    realWorldScenario:
      "A developer pulls the latest codebase and runs `pnpm start`. The app crashes with 'undefined database connection'. Running `diff <(cut -d= -f1 .env) <(cut -d= -f1 .env.example)` immediately identifies that a newly added `REDIS_URL` was missing from their local `.env`."
  },
  {
    id: "logging-in-scripts",
    number: "18",
    title: "Logging in scripts",
    tagline: "Structured observability: ISO-8601 timestamps, severity levels, ANSI colors, and stderr sinks",
    category: "Robustness & Error Resilience",
    mentalModel:
      "Scripts without structured logging are opaque black boxes during production incidents. Effective script logging principles:\n1. Separate Data from Diagnostics: Normal data output (e.g. generated token) goes to `stdout` (`echo \"$data\"`). Diagnostic log messages MUST go to `stderr` (`echo \"[INFO] ...\" >&2`). This allows pipelines like `TOKEN=$(script.sh)` to function without corrupting data.\n2. ISO-8601 Timestamps: Always prefix logs with UTC timestamps (`date -u +\"%Y-%m-%dT%H:%M:%SZ\"`).\n3. Log Levels: `DEBUG`, `INFO`, `WARN`, `ERROR`.\n4. Dual Logging (`tee`): Output to terminal AND append to permanent log file (`/var/log/automation.log`).",
    keySyntax:
      "Production Logging Boilerplate:\n#!/usr/bin/env bash\n\nLOG_FILE=\"/var/log/deploy.log\"\n\nlog() {\n    local level=\"$1\"\n    shift\n    local timestamp\n    timestamp=$(date -u +\"%Y-%m-%dT%H:%M:%SZ\")\n    local msg=\"[${timestamp}] [${level}] $*\"\n    \n    # Echo to stderr for terminal\n    echo \"${msg}\" >&2\n    # Append to log file if directory writable\n    [[ -w \"$(dirname \"${LOG_FILE}\")\" ]] && echo \"${msg}\" >> \"${LOG_FILE}\"\n}\n\nlog_info()  { log \"INFO\"  \"$*\"; }\nlog_warn()  { log \"WARN\"  \"\\033[33m$*\\033[0m\"; }\nlog_error() { log \"ERROR\" \"\\033[31m$*\\033[0m\"; }",
    productionCommands: [
      { cmd: "tail -f /var/log/deploy.log", desc: "Follow live structured log stream from background automation jobs.", level: "read" },
      { cmd: "logger -t my_script -p user.err 'Database connection timeout'", desc: "Inject structured log directly into Linux systemd journal / syslog.", level: "write" }
    ],
    productionRules: [
      "Always write log messages to stderr (`>&2`) so stdout remains clean for data piping and variable assignment.",
      "Always log timestamps in UTC (ISO-8601) to prevent timezone confusion during cross-region incident post-mortems.",
      "Never log raw credentials, tokens, or credit card numbers in automation logs."
    ],
    failureModes: [
      "Diagnostic log `echo 'Starting backup...'` emitted to stdout gets captured inside `$BACKUP_FILE`, corrupting downstream file paths.",
      "Logging without timestamps makes it impossible to correlate script actions with database crash events in server telemetry."
    ],
    realWorldScenario:
      "A database restoration failed at 3 AM. The on-call engineer checks `/var/log/deploy.log`. Because the script implemented structured timestamps and log levels, they correlate `[ERROR] Failed to mount /mnt/backup` directly with an AWS EBS detachment event at the exact same second."
  },
  {
    id: "testing-script",
    number: "19",
    title: "Testing script",
    tagline: "Test automation for automation: ShellCheck static analysis, BATS unit tests, and mocking",
    category: "Production Discipline & Mindset",
    mentalModel:
      "The phrase 'it's just a shell script' has caused catastrophic production outages. Automation scripts require the same testing rigor as application code:\n1. Static Analysis (`shellcheck`): Catches 90% of bugs before execution (unquoted variables, useless cat, syntax errors, unreachable code).\n2. Syntax Validation (`bash -n`): Validates parsing without running commands.\n3. Unit Testing with BATS (Bash Automated Testing System): TAP-compliant testing framework providing `@test` blocks, assertions, setup, and teardown.\n4. Mocking: Overriding destructive binaries (e.g. replacing `aws` with a fake mock shell function) to test logic safely.",
    keySyntax:
      "BATS Test Suite Example (test/deploy.bats):\n#!/usr/bin/env bats\n\nsetup() {\n    load 'test_helper/bats-support/load'\n    load 'test_helper/bats-assert/load'\n    source ./scripts/helpers.sh\n}\n\n@test \"sanitize_name removes spaces and uppercase\" {\n    run sanitize_name \"My Project\"\n    assert_success\n    assert_output \"my-project\"\n}\n\n@test \"deploy fails when target directory missing\" {\n    run ./scripts/deploy.sh -d \"/nonexistent\"\n    assert_failure\n    assert_output --partial \"Error: Target directory does not exist\"",
    productionCommands: [
      { cmd: "shellcheck -x scripts/*.sh", desc: "Run ShellCheck static linter on all scripts, following sourced files.", level: "read" },
      { cmd: "bats test/", desc: "Execute automated BATS unit and integration test suite.", level: "read" },
      { cmd: "shellcheck -s bash -e SC2086 script.sh", desc: "Audit script while specifically checking for unquoted variable expansions.", level: "read" }
    ],
    productionRules: [
      "Every production shell script must pass 'shellcheck -x' with zero warnings in CI/CD pull request gates.",
      "Never test destructive scripts (`rm -rf`, `mkfs`) against live production paths; use `mktemp -d` sandbox paths in test suites.",
      "Validate shell script syntax with 'bash -n' on every Git commit hook."
    ],
    failureModes: [
      "Deploying a bash script with a missing `fi` or unclosed quote that passes local testing because the code path wasn't triggered.",
      "Unquoted `$1` causing script to misinterpret user arguments containing spaces, flagged immediately by ShellCheck SC2086."
    ],
    realWorldScenario:
      "A developer submits a PR modifying `cleanup.sh`. The CI runner executes `shellcheck cleanup.sh` and blocks the PR, flagging: `In line 12: rm -rf $DIR/ - SC2086: Double quote to prevent globbing and word splitting`. Fixing the quote prevents a potential production disk wipe."
  },
  {
    id: "automation-mindset",
    number: "20",
    title: "Automation mindset",
    tagline: "The philosophy of leverage: The Rule of Three, dry-run safety, and blast-radius minimization",
    category: "Production Discipline & Mindset",
    mentalModel:
      "Automation is not about writing scripts; it is about building **resilient, self-healing systems** that multiply engineering leverage.\nCore Automation Philosophy:\n1. The Rule of Three: Do it manually once. Document it twice. Automate it the third time.\n2. Dry-Run Discipline: Every destructive script MUST support a `--dry-run` flag that prints planned mutations without modifying state.\n3. Fail-Closed / Fail-Safe: If an automation script encounters an unknown state, it must safely abort, send an alert, and exit non-zero (never guess).\n4. Minimize Blast Radius: Operate on batches (`batch-size 10`), apply locks, and verify pre-conditions before altering state.\n5. Infrastructure as Code (IaC): Treat scripts as code—versioned, linted, tested, and reviewed.",
    keySyntax:
      "Dry-Run Execution Pattern:\n#!/usr/bin/env bash\nset -euo pipefail\n\nDRY_RUN=false\n[[ \"${1:-}\" == \"--dry-run\" ]] && DRY_RUN=true\n\nexecute() {\n    if [[ \"$DRY_RUN\" == \"true\" ]]; then\n        echo \"[DRY-RUN] Would execute: $*\" >&2\n    else\n        echo \"[EXEC] $*\" >&2\n        \"$@\"\n    fi\n}\n\n# Usage\nexecute rm -rf /tmp/stale_cache\nexecute systemctl restart nginx",
    productionCommands: [
      { cmd: "./deploy.sh --dry-run", desc: "Execute automation script in preview mode without making destructive mutations.", level: "read" },
      { cmd: "git diff HEAD~1", desc: "Review automation code changes before merging to production branch.", level: "read" }
    ],
    productionRules: [
      "Every destructive automation tool MUST implement a '--dry-run' flag.",
      "Never automate a broken or undocumented manual process; fix and document the process first, then automate.",
      "Always design automation to fail cleanly and loudly; silent partial automation creates catastrophic hidden state desyncs."
    ],
    failureModes: [
      "Automating a process before understanding its edge cases, resulting in automated scripts deleting 10,000 active customer records in 3 seconds.",
      "Running an automation script without `--dry-run` directly against production infrastructure on a Friday afternoon."
    ],
    realWorldScenario:
      "An engineer needs to purge 500,000 orphaned S3 objects. Instead of running a blind `rm` loop, they build the script with `--dry-run`. Running with dry-run outputs the targeted keys to `preview.txt`. Reviewing the preview reveals 150 active customer avatars were caught in the filter. Fixing the regex saves the company from a major data loss incident."
  }
];

