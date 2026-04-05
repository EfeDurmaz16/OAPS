// This file is generated from ../../../../schemas/*.json by scripts/generate-core-schema-constants.mjs.
// Do not edit by hand.

export const RISK_CLASS_ORDER = [
  "R0",
  "R1",
  "R2",
  "R3",
  "R4",
  "R5"
] as const;

export const CAPABILITY_KINDS = [
  "tool",
  "resource",
  "prompt",
  "commerce.checkout",
  "payment.authorization",
  "approval",
  "browser_action",
  "message",
  "query"
] as const;

export const ENDPOINT_KINDS = [
  "interaction",
  "discovery",
  "events",
  "evidence",
  "approval",
  "mcp",
  "a2a",
  "acp",
  "commerce",
  "payment"
] as const;

export const AUTH_SCHEMES = [
  "bearer",
  "oauth2",
  "httpsig",
  "none"
] as const;

export const CHANNELS = [
  "oaps-http",
  "mcp",
  "a2a",
  "acp",
  "commerce",
  "payment",
  "human-approval"
] as const;

export const ACTOR_TYPES = [
  "human",
  "agent",
  "organization",
  "merchant",
  "tool-provider",
  "service",
  "payment-provider"
] as const;

export const IDENTITY_PROFILES = [
  "uri",
  "urn",
  "did"
] as const;

export const EXECUTION_STATUSES = [
  "success",
  "failure",
  "partial"
] as const;

export const MESSAGE_TYPES = [
  "intent.request",
  "intent.response",
  "interaction.created",
  "interaction.updated",
  "approval.request",
  "approval.decision",
  "execution.request",
  "execution.result",
  "error",
  "evidence.event"
] as const;

export const INTERACTION_STATES = [
  "discovered",
  "authenticated",
  "verified",
  "intent_received",
  "quoted",
  "delegated",
  "pending_approval",
  "approved",
  "executing",
  "partially_completed",
  "challenged",
  "failed",
  "compensated",
  "completed",
  "revoked",
  "settled",
  "archived"
] as const;

export const TASK_STATES = [
  "created",
  "queued",
  "running",
  "pending_approval",
  "challenged",
  "blocked",
  "partially_completed",
  "completed",
  "failed",
  "compensated",
  "revoked",
  "cancelled"
] as const;

export const SCHEMA_VERSION_PATTERN = "^0\\.[0-9]+(?:\\.[0-9]+)?(?:-draft)?$" as const;

export const MONEY_VALUE_PATTERN = "^[0-9]+(\\.[0-9]{1,8})?$" as const;

export const ISO_CURRENCY_PATTERN = "^[A-Z]{3}$" as const;
