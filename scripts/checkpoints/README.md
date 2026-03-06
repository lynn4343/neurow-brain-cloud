# User Data Checkpoints

Versioned SQL snapshots for restoring user profiles to known-good states during development.

**Full spec:** `BUILD_SPECS/User_Data_Checkpoint_Spec.md` (in the hackathon sprint folder)

## Quick restore

1. Open the checkpoint file (e.g., `theo_v1.sql`)
2. Run Section 1 (VALIDATE) via `mcp__supabase__execute_sql`
3. Run Section 2 (RESTORE PROFILE) if fields need fixing
4. Run Section 3 (CLEAN) previews, then uncomment DELETEs if needed
5. Reset localStorage: `localStorage.removeItem('neurow_profiles'); location.reload();`

## Checkpoints

| File | User | Date | Description |
|------|------|------|-------------|
| `theo_v1.sql` | Theo Nakamura | 2026-03-05 | Post-OBL-004 cleanup. Original demo values. 193 + 212 memories. |
