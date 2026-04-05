# OAPS Domain Protocol Map

## Purpose

Domain protocols are larger OAPS-native families that deserve their own semantic space.

They are not wrappers around one adjacent ecosystem. They are OAPS-owned families that can align to adjacent ecosystems where useful.

## Current Domain Families

| Domain family | Current entry point | Status | Notes |
| --- | --- | --- | --- |
| Commerce | [`spec/domain/commerce-draft.md`](../spec/domain/commerce-draft.md) | Draft | order intent, merchant authorization, fulfillment, and commercial evidence |
| Provisioning | [`profiles/osp-draft.md`](../profiles/osp-draft.md) and related provisioning notes | Draft | resource lifecycle, credential delivery, rotation, suspend, and deprovision |
| Jobs | Planned | Concept | larger job/workflow families remain directional |

## Domain Boundaries

A domain protocol may define its own richer vocabulary, but it should still:

- reuse core OAPS semantics where possible
- map to existing ecosystems when they already solve the narrow problem well
- keep evidence and approval behavior explicit
- avoid smuggling product-specific workflow into the core

## Commerce In Practice

Commerce is the clearest domain-family example in the current repo.

It maps toward ACP and UCP without becoming a checkout clone.

## Provisioning In Practice

Provisioning is the other current domain-family example.

It maps toward OSP while keeping lifecycle semantics and approval boundaries portable.
