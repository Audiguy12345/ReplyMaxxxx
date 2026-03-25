# ReplyMax MVP

ReplyMax is a one-screen cold outreach generator for founders, agencies, freelancers, and sales operators.

## What it does
- Generates 3 cold openers
- Generates 2 follow-ups
- Generates 3 objection replies
- Suggests 1 positioning angle
- Suggests 1 CTA

## Stack
- Next.js
- TypeScript
- Tailwind
- OpenAI Responses API

## MVP constraints
- no auth
- no database
- no saved history
- no dashboard
- no multi-page app

## Monetization test
- 3 free generations
- then locked
- upgrade button points to a hosted Stripe payment link

This is not secure subscription enforcement. It is a fast validation gate.

## Setup

1. Install dependencies
```bash
npm install
```
Create env file
```bash
cp .env.local.example .env.local
```
Add:
- OPENAI_API_KEY
- NEXT_PUBLIC_STRIPE_CHECKOUT_URL
- NEXT_PUBLIC_SITE_URL
- ALLOWED_ORIGIN
Run dev server
```bash
npm run dev
```
Open
`http://localhost:3000`

## Security

See [SECURITY.md](./SECURITY.md) for the current protections, remaining gaps, and deployment-level controls.