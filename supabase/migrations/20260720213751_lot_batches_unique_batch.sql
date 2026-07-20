-- "A batch belongs to at most one lot" (Phase 2 spec) was only a UI
-- convention until now — the (lot_id, batch_id) primary key doesn't stop
-- the same batch_id from appearing under a second lot_id. Make it a real
-- guarantee.
alter table lot_batches add constraint lot_batches_batch_id_unique unique (batch_id);
