-- ============================================================
-- CHECKPOINT: theo_v1
-- User: Theo Nakamura (0c4831b5-8df3-4fba-94be-57e4e3112116)
-- Created: 2026-03-05
-- Description: Post-OBL-004 cleanup. Theo's demo profile restored
--   to original curated values. 193 hackathon records (data_import)
--   + 212 coaching session memories + 1 completed demo clarity
--   session (Feb 6, 8 turns). All clean and verified.
-- Previous: none (first checkpoint)
--
-- SAFETY: Never run Section 2 or 3 without running Section 1 first.
--         Never run DELETEs without previewing with SELECT.
--         See BUILD_SPECS/User_Data_Checkpoint_Spec.md for full protocol.
-- ============================================================


-- ============================================
-- SECTION 1: VALIDATE (read-only)
-- Run this FIRST. If any check fails, STOP.
-- ============================================

-- 1a. Confirm Theo's profile exists and key fields match
SELECT id, display_name, first_name, roles, focus_area, coaching_style,
       declared_challenges, is_business_owner, onboarding_completed,
       clarity_session_completed, is_demo_user, context_summary,
       business_description, business_stage, current_business_focus,
       business_challenges
FROM user_profiles
WHERE id = '0c4831b5-8df3-4fba-94be-57e4e3112116';
-- EXPECTED:
--   display_name: "Theo Nakamura"
--   roles: ["business_owner"]
--   focus_area: "career-business"
--   coaching_style: "balanced"
--   declared_challenges: ["inconsistent income", "pricing and knowing my worth",
--                         "following through on plans", "managing finances"]
--   is_business_owner: true
--   onboarding_completed: true
--   clarity_session_completed: true
--   is_demo_user: true
--   context_summary: "Freelance graphic designer..."
--   All business_* fields: NULL

-- 1b. Confirm memory counts by source
SELECT source, COUNT(*) as count
FROM memories
WHERE user_id = '0c4831b5-8df3-4fba-94be-57e4e3112116'
GROUP BY source
ORDER BY count DESC;
-- EXPECTED: coaching_session: 212, data_import: 193

-- 1c. Confirm total memory count
SELECT COUNT(*) as total_memories
FROM memories
WHERE user_id = '0c4831b5-8df3-4fba-94be-57e4e3112116';
-- EXPECTED: 405

-- 1d. Confirm demo coaching session
SELECT id, session_type, status, current_turn, started_at, completed_at
FROM coaching_sessions
WHERE user_id = '0c4831b5-8df3-4fba-94be-57e4e3112116';
-- EXPECTED: 1 row — id d34df051-..., clarity_session, completed, turn 8,
--           started Feb 6 15:00 UTC, completed Feb 6 15:45 UTC

-- 1e. Confirm no test profiles exist (only Theo should be permanent)
SELECT id, display_name, is_demo_user, onboarding_completed, created_at
FROM user_profiles
WHERE is_demo_user = true;
-- EXPECTED: 1 row — Theo only


-- ============================================
-- SECTION 2: RESTORE PROFILE
-- Idempotent UPDATE — safe to run multiple times.
-- Only touches onboarding-related fields.
-- Does NOT touch: id, display_name, first_name, is_demo_user,
--   context_summary, created_at.
-- ============================================

UPDATE user_profiles
SET
  roles = '["business_owner"]'::jsonb,
  focus_area = 'career-business',
  coaching_style = 'balanced',
  declared_challenges = '["inconsistent income", "pricing and knowing my worth", "following through on plans", "managing finances"]'::jsonb,
  is_business_owner = true,
  onboarding_completed = true,
  clarity_session_completed = true,
  business_description = NULL,
  business_stage = NULL,
  current_business_focus = NULL,
  business_challenges = NULL,
  career_situation = NULL,
  career_stage = NULL,
  career_focus = NULL,
  career_challenges = NULL,
  side_hustle_goal = NULL,
  love_partner_situation = NULL
WHERE id = '0c4831b5-8df3-4fba-94be-57e4e3112116'
  AND display_name = 'Theo Nakamura';


-- ============================================
-- SECTION 3: CLEAN TEST ARTIFACTS
-- Removes data created AFTER 2026-03-05T22:00:00Z.
-- ALWAYS preview with SELECT before running DELETE.
-- DELETEs are commented out — uncomment after previewing.
-- ============================================

-- 3a. Preview test coaching sessions for Theo (after checkpoint date)
SELECT id, status, current_turn, started_at
FROM coaching_sessions
WHERE user_id = '0c4831b5-8df3-4fba-94be-57e4e3112116'
  AND started_at >= '2026-03-05T22:00:00Z';

-- 3b. Delete test coaching sessions (uncomment after previewing 3a)
-- DELETE FROM coaching_sessions
-- WHERE user_id = '0c4831b5-8df3-4fba-94be-57e4e3112116'
--   AND started_at >= '2026-03-05T22:00:00Z';

-- 3c. Preview test memories for Theo (coaching_session source, after checkpoint)
SELECT memory_id, source, LEFT(content, 80) as preview, created_at
FROM memories
WHERE user_id = '0c4831b5-8df3-4fba-94be-57e4e3112116'
  AND source = 'coaching_session'
  AND created_at >= '2026-03-05T22:00:00Z';

-- 3d. Delete test memories (uncomment after previewing 3c)
-- DELETE FROM memories
-- WHERE user_id = '0c4831b5-8df3-4fba-94be-57e4e3112116'
--   AND source = 'coaching_session'
--   AND created_at >= '2026-03-05T22:00:00Z';

-- 3e. Preview and delete test profiles (non-Theo, created after checkpoint)
SELECT id, display_name, onboarding_completed, created_at
FROM user_profiles
WHERE id != '0c4831b5-8df3-4fba-94be-57e4e3112116'
  AND created_at >= '2026-03-05T22:00:00Z';

-- To delete test profiles, first remove their child records:
-- DELETE FROM coaching_sessions
-- WHERE user_id IN (
--   SELECT id FROM user_profiles
--   WHERE id != '0c4831b5-8df3-4fba-94be-57e4e3112116'
--     AND created_at >= '2026-03-05T22:00:00Z'
-- );
-- DELETE FROM memories
-- WHERE user_id IN (
--   SELECT id FROM user_profiles
--   WHERE id != '0c4831b5-8df3-4fba-94be-57e4e3112116'
--     AND created_at >= '2026-03-05T22:00:00Z'
-- );
-- DELETE FROM user_profiles
-- WHERE id != '0c4831b5-8df3-4fba-94be-57e4e3112116'
--   AND created_at >= '2026-03-05T22:00:00Z';


-- ============================================
-- POST-RESTORE: Reset localStorage
-- Run in Electron DevTools Console (Cmd+Option+I):
--
--   localStorage.removeItem('neurow_profiles');
--   location.reload();
--
-- This reloads from the THEO_PROFILE constant in UserContext.tsx.
-- ============================================
