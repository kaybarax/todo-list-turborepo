# Autonomous Agent Workflow

This repository is configured for a spec-to-PR agent workflow.

## Required Secrets

Add these repository secrets in GitHub Settings -> Secrets and variables -> Actions:

- `OPENHANDS_API_KEY`: Required for the OpenHands coder/fix agents.

PR-Agent is configured to use local Ollama on a self-hosted runner, so it does not need paid model API keys.

Optional repository variable:

- `AGENT_AUTOMERGE_ENABLED=true`: Enables the guarded auto-merge workflow. Leave unset or false until agent PRs have proven reliable.
- `PR_AGENT_LOCAL_OLLAMA_ENABLED=true`: Enables PR-Agent on a self-hosted macOS ARM64 runner with Ollama running locally.

## Labels

- `agent:spec`: Identifies an issue as an implementation spec.
- `agent:ready`: Allows the coder agent to start.
- `agent:fix`: Re-runs the fix-loop agent on a PR.
- `agent:auto-merge`: Allows auto-merge when `AGENT_AUTOMERGE_ENABLED=true`.
- `review-this`: Manually asks review agents to review a PR.

## Spec to PR

1. Create an issue using the "Agent Spec" template.
2. Fill in the goal, acceptance criteria, scope, and required tests.
3. Keep or add the `agent:ready` label.
4. The `Agent Spec to PR` workflow sends the spec to OpenHands.
5. OpenHands should implement the work, run checks, and open a PR.

You can also trigger manually from Actions -> Agent Spec to PR.

## Review and Fix Loop

1. `PR Agent Review` runs on new/synchronized PRs and comments with findings when `PR_AGENT_LOCAL_OLLAMA_ENABLED=true`.
2. To ask the coder agent to fix comments or CI failures, add the `agent:fix` label to the PR.
3. Alternatively, comment `@agent-fix` on the PR.
4. The fix agent inspects comments/checks, pushes fixes, and comments with what changed.

### Local PR-Agent Runner

The review agent uses `ollama/qwen2.5-coder:32b` through a self-hosted GitHub runner on the Mac.

Security note: a self-hosted runner executes GitHub Actions jobs on this Mac. Keep this enabled only for trusted repositories and workflows, and leave `PR_AGENT_LOCAL_OLLAMA_ENABLED=false` when the runner is offline or not intentionally in use.

Prerequisites on the Mac:

```bash
OLLAMA_FLASH_ATTENTION=1 OLLAMA_KV_CACHE_TYPE=q8_0 ollama serve
ollama pull qwen2.5-coder:32b
```

Register a GitHub self-hosted runner for this repository and keep it online. GitHub should show labels including:

```text
self-hosted
macOS
ARM64
```

Then enable the workflow:

```bash
gh variable set PR_AGENT_LOCAL_OLLAMA_ENABLED --repo kaybarax/todo-list-turborepo --body true
```

## Merge

Default: humans merge after CI and review.

Optional autonomous merge:

1. Set repository variable `AGENT_AUTOMERGE_ENABLED=true`.
2. Add `agent:auto-merge` to a PR.
3. GitHub auto-merge is enabled with squash merge and branch deletion.

Keep auto-merge disabled until the workflow has successfully handled several low-risk specs.
