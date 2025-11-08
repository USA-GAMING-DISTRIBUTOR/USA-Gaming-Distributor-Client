# Atomic Inventory Update (RPC design)

Goal: update platform inventory and insert a purchase history row in a single transaction.

This avoids UI race conditions where a purchase history record is created but inventory fails (or vice versa).

## Postgres function (Supabase RPC)

Create a SQL function that:
- Validates inputs
- Reads current inventory
- Inserts a `purchase_history` row
- Updates `game_coins.inventory`
- Returns summary info

```sql
create or replace function public.record_purchase_and_update_inventory(
  p_platform_id uuid,
  p_quantity integer,
  p_cost_per_unit numeric,
  p_supplier text default null,
  p_notes text default null,
  p_purchased_by uuid
)
returns table (
  purchase_history_id uuid,
  previous_inventory integer,
  new_inventory integer,
  total_cost numeric
) as $$
declare
  v_prev integer;
  v_new integer;
  v_ph_id uuid;
begin
  if p_quantity <= 0 or p_cost_per_unit < 0 then
    raise exception 'Invalid quantity or cost';
  end if;

  select inventory into v_prev from public.game_coins where id = p_platform_id for update;
  if not found then
    raise exception 'Platform not found';
  end if;

  v_new := v_prev + p_quantity;

  insert into public.purchase_history (
    platform_id, quantity, cost_per_unit, total_cost,
    supplier, notes, previous_inventory, new_inventory, purchased_by
  ) values (
    p_platform_id, p_quantity, p_cost_per_unit, p_quantity * p_cost_per_unit,
    p_supplier, p_notes, v_prev, v_new, p_purchased_by
  ) returning id into v_ph_id;

  update public.game_coins set inventory = v_new, updated_at = now() where id = p_platform_id;

  return query select v_ph_id, v_prev, v_new, (p_quantity * p_cost_per_unit);
end;
$$ language plpgsql security definer;
```

Notes:
- `security definer` lets policies be evaluated as the function owner. Combine with strict input checks and RLS considerations.
- Add explicit RLS policies that allow calling this function only for authorized roles.

## Client usage pattern

Call via Supabase RPC and handle RepoResult ergonomically.

```ts
import { supabase } from '@/lib/supabase';

const { data, error } = await supabase.rpc('record_purchase_and_update_inventory', {
  p_platform_id: platformId,
  p_quantity: quantity,
  p_cost_per_unit: costPerUnit,
  p_supplier: supplier ?? null,
  p_notes: notes ?? null,
  p_purchased_by: userId,
});
```

See `src/services/inventoryRpc.ts` for a typed wrapper.

## Migration strategy
- Keep existing non-atomic flow while testing the RPC in staging.
- Toggle usage behind a small feature flag (`USE_ATOMIC_INVENTORY`) or environment boolean.
- When confident, switch the purchase flow to call the RPC and remove the old dual-call path.
