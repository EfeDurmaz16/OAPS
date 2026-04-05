# gRPC server-streaming follow example

Method: `oaps.bindings.grpc.v1.ReplayService/WatchEvents`

Starting request:

- `interaction_id`: `ix_grpc_1`
- `after`: `evt_grpc_2`

Illustrative stream sequence:

1. `evt_grpc_3` — `mcp.tool_call.completed`
2. `evt_grpc_4` — `interaction.completed`

The streaming watch is a follow surface only. If the stream disconnects, the
client resumes from the last durable `event_id` by calling `ListEvents` again.
