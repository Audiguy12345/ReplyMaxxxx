# Codex handoff

Build and verify the ReplyMax paywall layer exactly as described.

## Requirements
- preserve current one-page structure
- add client-side free usage gating
- add Stripe checkout CTA through env var
- add copy buttons to outputs
- keep UI dark and minimal
- no auth
- no database
- no extra pages

## Verify
1. app compiles
2. generate route still works
3. free generations decrement correctly
4. locked state blocks generation
5. checkout button renders when env var exists
6. TypeScript passes

## Constraint
Do not expand scope into full subscriptions architecture.
