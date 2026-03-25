# ReplyMax paywall notes

## Purpose
This is a pressure-test paywall, not permanent billing architecture.

## Current behavior
- each browser gets 3 free generations using localStorage
- after 3 uses, generation is blocked
- user is shown an upgrade CTA
- upgrade opens Stripe hosted checkout

## Why this is acceptable for MVP
- fastest path to payment intent
- no auth required
- no database required
- good enough to test whether users will pay at all

## Known weakness
- localStorage can be cleared
- no entitlement verification
- no webhook sync
- no real subscription state

## Do not build yet
- full account system
- seat management
- team workspaces
- annual plan logic
- coupon systems
- billing portal

## Build next only after users click or pay
1. Stripe webhook
2. auth
3. user table
4. entitlement check in API route
5. usage history
