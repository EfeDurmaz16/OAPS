# Stripe + AICP Payment Governance Demo

Demonstrates AICP (Agent Interaction Control Protocol) governance over a Stripe payment authorization. An AI agent requests a payment, but only after its **mandate** is verified — and every step is recorded in a tamper-evident **evidence chain**.

## What this shows

1. **Mandate creation** — A human principal authorizes an agent to spend up to a specified amount
2. **Mandate verification** — `assertMandateAuthorizes` validates scope and expiry before any payment
3. **Stripe PaymentIntent** — The agent creates a Stripe PaymentIntent with OAPS metadata
4. **Evidence chain** — Every step (mandate creation, verification, authorization, confirmation) is hash-linked and verifiable

## Run the demo

With a real Stripe test key:

```bash
cd examples/integrations/stripe-aicp-demo
pnpm install
STRIPE_SECRET_KEY=sk_test_... npx tsx src/demo.ts
```

Without a key (simulated Stripe response):

```bash
npx tsx src/demo.ts
```

## Run tests

No Stripe API key needed:

```bash
npx tsx --test src/demo.test.ts
```

Tests cover:
- Valid mandate acceptance
- Expired mandate rejection (`MANDATE_EXPIRED`)
- Scope mismatch rejection (`MANDATE_SCOPE_MISMATCH`)
- Evidence chain integrity and tamper detection
- Full governance flow with mocked Stripe
