# GitHub Actions Pre-Job Failure — Recovery Runbook

**Last checked:** 21 October 2026  
**Repository:** `prince-web-beb/OKard` (private)  
**Status:** BLOCKING build verification. Earlier runs failed before runner allocation; newer runs report a job-level failure without retrievable step logs.

## Update — 21 October 2026, later checks

Recent pushes have progressed **past the old synthetic `startup_failure`**: the named `OKard Foundation CI` workflow now shows `conclusion: failure` and a `typecheck-build-tests` job object. Representative run: https://github.com/prince-web-beb/OKard/actions/runs/39638284240 (job 119354768464).

**Important limitation:** The GitHub connector returns an empty step list for the job, and the job-log retrieval returns `BlobNotFound`. Thus we **cannot verify whether dependency installation, compilation or tests actually ran**, nor attribute the failure to source code. This is now a **job failure with unavailable evidence**, not necessarily a pre-job failure. The owner/team should open that run in GitHub's Actions UI and capture the first failing step/log; if logs are genuinely absent, contact GitHub Support with the run/job IDs.

Keep the manual probe workflow for distinguishing runner allocation from application compilation. Continue with the Replit terminal test route in parallel. Neither Track 00.1 nor any feature verification checkbox can be closed yet.

## Observed symptoms

Push-triggered workflow runs repeatedly show:
- `conclusion: startup_failure`
- synthetic `path: BuildFailed`
- empty workflow name
- **zero jobs / no assigned runner / no step logs**

Representative runs:
- https://github.com/prince-web-beb/OKard/actions/runs/39634977827
- https://github.com/prince-web-beb/OKard/actions/runs/39631317381

This indicates a problem occurring *before* package installation, TypeScript compilation or test execution. It may result from repository workflow registration/permissions, billing limits or GitHub Actions control-plane behavior. Do **not** assume that changing TypeScript fixes an event dispatcher that never started.

## Repository diagnostic added

`.github/workflows/dispatcher-probe.yml` is a deliberately trivial workflow with **manual `workflow_dispatch`** and a single ubuntu-latest job. `.github/workflows/ci.yml` also supports manual dispatch now.

To test, open the private repository's **Actions** tab, select **OKard Dispatcher Probe**, and click **Run workflow** on the default branch. Verify the run creates a job and prints Node version. If the probe itself reports `startup_failure` with zero jobs, the fault is before repository code.

## Owner/team checklist

1. Confirm **Settings → Actions → General** allows workflows and approved GitHub actions. Check workflow permissions for this repository; confirm neither org rules nor rulesets block the workflow files.
2. Check the account/billing/Actions usage and private-repo minutes budget. A private repository with exhausted/disabled Actions minutes can prevent hosted jobs.
3. Confirm the default branch contains `.github/workflows/ci.yml` and `dispatcher-probe.yml` and files have nonempty valid YAML.
4. Try the minimal manual probe. Record workflow ID, URL, state, conclusion and number of jobs.
5. If zero jobs with synthetic `BuildFailed` continues for both probe and CI, **open GitHub Support** with repository/run URLs and state that no runner or job was created. Do not burn time tweaking application code without logs.
6. Independently run the build in a network-enabled Replit shell:
   ```sh
   corepack enable
   corepack pnpm install --no-frozen-lockfile
   corepack pnpm build
   corepack pnpm check
   corepack pnpm test
   ```
7. Commit the generated `pnpm-lock.yaml` **after confirming clean compatible dependency resolution** and change CI, Replit and Docker installs to `--frozen-lockfile`.
8. Attach real terminal/build output, package lockfile and Android screenshots/test notes to the progress ledger. No completion box may be checked just because files exist.

## References

Other repositories have reported the same synthetic pre-job failure signature:
- https://github.com/orgs/community/discussions/208822
- https://github.com/orgs/community/discussions/207492

These are public issue reports, **not a confirmation of the precise cause in this OKard repository**.

## Current release decision

**Track 00.1 remains unchecked** until package resolution, build, typecheck, tests, Replit server startup and real Android review succeed. The separate Scene Graph/Renderer work likewise remains source-implemented but not runtime-verified.
