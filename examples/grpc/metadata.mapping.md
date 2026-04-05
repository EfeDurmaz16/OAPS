# gRPC metadata and header mapping notes

Recommended request metadata keys:

- `authorization`
- `x-oaps-idempotency-key`
- `x-oaps-spec-version`
- `x-oaps-min-supported-version`
- `x-oaps-max-supported-version`
- `x-oaps-actor-id`
- `x-oaps-request-id`
- `x-oaps-replay-after`
- `x-oaps-replay-limit`

Recommended response or trailer metadata keys:

- `x-oaps-interaction-id`
- `x-oaps-next-after`
- `x-oaps-error-code`
- `x-oaps-error-category`
- `x-oaps-retryable`

The same idempotency key used in metadata should also remain available in the
request message when the implementation wants explicit logging or replay-safe
middleware inspection.
