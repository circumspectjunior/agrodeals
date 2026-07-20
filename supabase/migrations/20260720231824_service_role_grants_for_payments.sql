-- Phase 0's initial migration granted service_role access to the original
-- 7 tables. farmer_payments/payment_events were created later in Phase 2
-- and only got authenticated grants — service_role (used for admin
-- scripting/debugging, and meant to bypass restrictions generally) was
-- never extended to them. Same class of gap as the earlier
-- authenticated-grant fixes for batches/lots/lot_batches.

grant select, insert, update, delete on farmer_payments, payment_events to service_role;
