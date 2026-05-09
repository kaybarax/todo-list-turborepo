# Autonomous Agent Workflow

This repository is configured for a spec-to-PR agent workflow.

## Required Secrets

Add these repository secrets in GitHub Settings -> Secrets and variables -> Actions:

- `OPENHANDS_API_KEY`: Required for the OpenHands coder/fix agents.
- `OPENAI_KEY`: Required if PR-Agent uses OpenAI models.
- `ANTHROPIC_KEY`: Optional, if PR-Agent is configured for Anthropic models.
- `GEMINI_API_KEY`: Optional, if PR-Agent is configured for Gemini models.

Optional repository variable:

- `AGENT_AUTOMERGE_ENABLED=true`: Enables the guarded auto-merge workflow. Leave unset or false until agent PRs have proven reliable.

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

1. `PR Agent Review` runs on new/synchronized PRs and comments with findings.
2. To ask the coder agent to fix comments or CI failures, add the `agent:fix` label to the PR.
3. Alternatively, comment `@agent-fix` on the PR.
4. The fix agent inspects comments/checks, pushes fixes, and comments with what changed.

## Merge

Default: humans merge after CI and review.

Optional autonomous merge:

1. Set repository variable `AGENT_AUTOMERGE_ENABLED=true`.
2. Add `agent:auto-merge` to a PR.
3. GitHub auto-merge is enabled with squash merge and branch deletion.

Keep auto-merge disabled until the workflow has successfully handled several low-risk specs.
