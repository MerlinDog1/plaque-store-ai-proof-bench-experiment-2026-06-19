

# Cross-machine source handover

Read [HANDOVER.md](HANDOVER.md) at task start.

## Working between Windows and Cody's VPS

- At task start run `git status --short --branch`, `git fetch --no-recurse-submodules origin`, read HANDOVER.md and compare remote branches with work from the other machine. Never infer production from main, the latest commit, or the latest deployment.
- Use a task branch and preferably a separate worktree. Do not edit the same branch concurrently on both machines. Keep source checkouts used by a running service unchanged; use the separate development worktree.
- Preserve all existing edits, stashes and branches. No hard reset, force push, branch deletion or overwriting another machine's work. Label unfinished work with a wip/ branch and notes.
- Commit at meaningful checkpoints. Review staged diffs and scan for secrets before pushing. Never commit credentials, real .env files, customer data, backups, machine state, dependencies or generated private artifacts. New repositories must be private.
- Check every deployment integration and workflow before a push, merge or default-branch change. Push only to branches known not to publish a site. Repository housekeeping never authorises deployment.
- Before switching machines or ending a task, push reviewed safe work and leave a short handover recording branch, full SHA, checks, known failures and next step. Say clearly when work is incomplete or a push is blocked.
- Merge only verified work. Deploy only when explicitly requested; then record and independently verify the live revision/alias or installed runtime hashes. Preserve separate bot identities and credentials.
- Install dependencies independently on each machine. Retrieve secrets through the existing project/service-specific secret store; do not copy node_modules, virtual environments or machine environment files between computers.
