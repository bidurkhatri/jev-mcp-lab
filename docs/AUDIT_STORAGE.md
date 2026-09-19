# Audit storage

The JSONL audit store serializes concurrent appends, redacts credential-bearing fields before hashing, flushes each record, verifies the chain during recovery and rotates only after a configured size threshold.

Rotation starts a new chain. The rotated filename includes the prior tail hash so an operator can bind segments in an external manifest. This project does not implement that signed manifest, cross-process locking, retention deletion, encryption at rest, remote collection or crash recovery for a partially written final line. Those controls are required before treating audit storage as production-ready.
