# Remarks Field — Memberships Design

**Date:** 2026-07-21  
**Status:** Approved

## Goal

Add an optional free-text `remarks` field to the assign seat and renew membership flows so staff can record notes per membership.

## Database

Add nullable text column to `memberships`:

```sql
ALTER TABLE memberships ADD COLUMN remarks text;
```

## Types

`AssignSeatInput` — add `remarks?: string`  
`RenewInput` — add `remarks?: string`  
`MembershipRow` — add `remarks: string | null`

## Server Actions (`src/app/dashboard/seats/actions.ts`)

`assignSeat` — include `remarks: input.remarks ?? null` in memberships insert payload.  
`renewMembership` — include `remarks: input.remarks ?? null` in memberships update payload.

## UI

Both modals (`AssignSeatModal`, `RenewMembershipModal`) get a textarea at the bottom of the form, above the submit button:

- Label: "Remarks"
- Optional — no validation
- Placeholder: "Any notes about this membership…"
- State var: `remarks` (string, default `""`)
- Passed through to the action on submit

## Out of Scope

Displaying remarks in the members table or seat popover is not part of this change.
