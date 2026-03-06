"""Tests for W4-4a Onboarding Port — role/style ID resolution and formatting."""
import pytest
from brain_cloud.coaching.prompt_assembler import (
    PromptAssembler,
    COACHING_STYLE_MODIFIERS,
    USER_TYPE_MODIFIERS,
    ROLE_PRIORITY,
    ROLE_FALLBACK,
    ROLE_DISPLAY_NAMES,
    LIMITING_BELIEFS,
    CLARITY_PROVIDES,
    format_declared_challenges,
)


class TestRoleResolution:
    """Verify _resolve_user_type accepts both production IDs and Theo legacy IDs."""

    def test_founder_resolves_to_business_owner(self):
        result = PromptAssembler._resolve_user_type({"roles": ["founder"]})
        assert result == USER_TYPE_MODIFIERS["business_owner"]

    def test_freelancer_resolves_to_business_owner(self):
        result = PromptAssembler._resolve_user_type({"roles": ["freelancer"]})
        assert result == USER_TYPE_MODIFIERS["business_owner"]

    def test_side_hustler_hyphen_resolves_to_business_owner(self):
        result = PromptAssembler._resolve_user_type({"roles": ["side-hustler"]})
        assert result == USER_TYPE_MODIFIERS["business_owner"]

    def test_employed_resolves_to_career_professional(self):
        result = PromptAssembler._resolve_user_type({"roles": ["employed"]})
        assert result == USER_TYPE_MODIFIERS["career_professional"]

    def test_theo_legacy_business_owner_still_works(self):
        """REGRESSION: Theo's profile has roles: ['business_owner'] — must not break."""
        result = PromptAssembler._resolve_user_type({"roles": ["business_owner"]})
        assert result == USER_TYPE_MODIFIERS["business_owner"]

    def test_theo_legacy_career_professional_still_works(self):
        result = PromptAssembler._resolve_user_type({"roles": ["career_professional"]})
        assert result == USER_TYPE_MODIFIERS["career_professional"]

    def test_theo_legacy_side_hustler_underscore_still_works(self):
        result = PromptAssembler._resolve_user_type({"roles": ["side_hustler"]})
        assert result == USER_TYPE_MODIFIERS["business_owner"]

    def test_student_resolves_to_default(self):
        result = PromptAssembler._resolve_user_type({"roles": ["student"]})
        assert result == USER_TYPE_MODIFIERS["default"]

    def test_empty_roles_resolves_to_default(self):
        result = PromptAssembler._resolve_user_type({"roles": []})
        assert result == USER_TYPE_MODIFIERS["default"]

    def test_no_roles_key_resolves_to_default(self):
        result = PromptAssembler._resolve_user_type({})
        assert result == USER_TYPE_MODIFIERS["default"]

    def test_multiple_roles_founder_takes_priority(self):
        result = PromptAssembler._resolve_user_type({"roles": ["student", "founder"]})
        assert result == USER_TYPE_MODIFIERS["business_owner"]

    def test_multiple_roles_employed_over_student(self):
        result = PromptAssembler._resolve_user_type({"roles": ["student", "employed"]})
        assert result == USER_TYPE_MODIFIERS["career_professional"]

    def test_roles_as_string_not_list(self):
        result = PromptAssembler._resolve_user_type({"roles": "founder"})
        assert result == USER_TYPE_MODIFIERS["business_owner"]


class TestPrimaryRoleResolution:
    """Verify _resolve_primary_role uses ROLE_PRIORITY correctly."""

    def test_founder_is_primary(self):
        result = PromptAssembler._resolve_primary_role({"roles": ["student", "founder"]})
        assert result == "founder"

    def test_business_owner_legacy_is_primary(self):
        result = PromptAssembler._resolve_primary_role({"roles": ["business_owner"]})
        assert result == "business_owner"

    def test_employed_is_primary_over_student(self):
        result = PromptAssembler._resolve_primary_role({"roles": ["student", "employed"]})
        assert result == "employed"

    def test_unknown_roles_return_default(self):
        result = PromptAssembler._resolve_primary_role({"roles": ["student", "athlete"]})
        assert result == "default"

    def test_empty_roles_return_default(self):
        result = PromptAssembler._resolve_primary_role({"roles": []})
        assert result == "default"

    def test_no_roles_return_default(self):
        result = PromptAssembler._resolve_primary_role({})
        assert result == "default"


class TestCoachingStyleResolution:
    """Verify coaching style ID aliases."""

    def test_peak_performance_hyphen_resolves(self):
        result = PromptAssembler._resolve_coaching_style({"coaching_style": "peak-performance"})
        assert "PEAK PERFORMANCE" in result

    def test_peak_performance_underscore_resolves(self):
        result = PromptAssembler._resolve_coaching_style({"coaching_style": "peak_performance"})
        assert "PEAK PERFORMANCE" in result

    def test_peak_alias_resolves(self):
        result = PromptAssembler._resolve_coaching_style({"coaching_style": "peak"})
        assert "PEAK PERFORMANCE" in result

    def test_balanced_resolves(self):
        result = PromptAssembler._resolve_coaching_style({"coaching_style": "balanced"})
        assert "BALANCED" in result

    def test_gentle_resolves(self):
        result = PromptAssembler._resolve_coaching_style({"coaching_style": "gentle"})
        assert "GENTLE" in result

    def test_direct_resolves(self):
        result = PromptAssembler._resolve_coaching_style({"coaching_style": "direct"})
        assert "DIRECT" in result

    def test_unknown_style_falls_back_to_balanced(self):
        result = PromptAssembler._resolve_coaching_style({"coaching_style": "nonexistent"})
        assert "BALANCED" in result

    def test_none_style_falls_back_to_balanced(self):
        result = PromptAssembler._resolve_coaching_style({})
        assert "BALANCED" in result


class TestFormatDeclaredChallenges:
    """Verify format_declared_challenges handles both hyphens and underscores."""

    def test_hyphenated_ids_display_correctly(self):
        result = format_declared_challenges(["imposter-syndrome", "fear-rejection"])
        assert "imposter syndrome" in result
        assert "fear rejection" in result
        assert "-" not in result  # no raw hyphens

    def test_underscored_ids_display_correctly(self):
        result = format_declared_challenges(["imposter_syndrome"])
        assert "imposter syndrome" in result

    def test_mixed_ids_display_correctly(self):
        result = format_declared_challenges(["imposter-syndrome", "self_doubt"])
        assert "imposter syndrome" in result
        assert "self doubt" in result

    def test_empty_challenges_returns_fallback(self):
        result = format_declared_challenges(None)
        assert "No challenges declared" in result

    def test_empty_list_returns_fallback(self):
        result = format_declared_challenges([])
        assert "No challenges declared" in result


class TestRoleLookupDicts:
    """Verify all role-keyed dicts have production IDs AND Theo legacy IDs."""

    @pytest.mark.parametrize("role_id", ["founder", "freelancer", "side-hustler", "employed", "default"])
    def test_role_fallback_has_production_ids(self, role_id):
        assert role_id in ROLE_FALLBACK

    @pytest.mark.parametrize("role_id", ["business_owner", "side_hustler", "career_professional"])
    def test_role_fallback_has_legacy_ids(self, role_id):
        assert role_id in ROLE_FALLBACK

    @pytest.mark.parametrize("role_id", ["founder", "freelancer", "side-hustler", "employed", "default"])
    def test_limiting_beliefs_has_production_ids(self, role_id):
        assert role_id in LIMITING_BELIEFS

    @pytest.mark.parametrize("role_id", ["business_owner", "side_hustler", "career_professional"])
    def test_limiting_beliefs_has_legacy_ids(self, role_id):
        assert role_id in LIMITING_BELIEFS

    @pytest.mark.parametrize("role_id", ["founder", "freelancer", "side-hustler", "employed", "default"])
    def test_clarity_provides_has_production_ids(self, role_id):
        assert role_id in CLARITY_PROVIDES

    @pytest.mark.parametrize("role_id", ["business_owner", "side_hustler", "career_professional"])
    def test_clarity_provides_has_legacy_ids(self, role_id):
        assert role_id in CLARITY_PROVIDES

    @pytest.mark.parametrize("role_id", ["founder", "freelancer", "side-hustler", "employed"])
    def test_role_display_names_has_production_ids(self, role_id):
        assert role_id in ROLE_DISPLAY_NAMES

    @pytest.mark.parametrize("role_id", ["business_owner", "side_hustler", "career_professional"])
    def test_role_display_names_has_legacy_ids(self, role_id):
        assert role_id in ROLE_DISPLAY_NAMES

    def test_theo_legacy_in_role_priority(self):
        """REGRESSION: Theo's 'business_owner' role must appear in ROLE_PRIORITY."""
        assert "business_owner" in ROLE_PRIORITY

    def test_role_priority_has_production_ids(self):
        assert "founder" in ROLE_PRIORITY
        assert "freelancer" in ROLE_PRIORITY
        assert "employed" in ROLE_PRIORITY
        assert "side-hustler" in ROLE_PRIORITY


class TestUpdateUser:
    """Verify the update_user method writes and reads back correctly."""

    @pytest.mark.asyncio
    async def test_update_user_writes_onboarding_fields(self, test_stores, test_user_id):
        """Verify brain_update_profile's underlying update_user writes and reads back."""
        stores = test_stores
        uuid = await stores.resolve_user_id(test_user_id)

        update_data = {
            "roles": ["founder", "creative"],
            "focus_area": "career-business",
            "coaching_style": "direct",
            "is_business_owner": True,
            "business_description": "Test design studio",
            "business_stage": "building",
            "declared_challenges": ["procrastination", "imposter-syndrome"],
            "onboarding_completed": True,
        }
        result = await stores.supabase.update_user(uuid, update_data)
        assert result["roles"] == ["founder", "creative"]
        assert result["focus_area"] == "career-business"
        assert result["is_business_owner"] is True
        assert result["declared_challenges"] == ["procrastination", "imposter-syndrome"]
        assert result["onboarding_completed"] is True

        # Read back and verify
        profile = await stores.supabase.get_user(uuid)
        assert profile["roles"] == ["founder", "creative"]
        assert profile["business_description"] == "Test design studio"
        assert profile["business_stage"] == "building"

    @pytest.mark.asyncio
    async def test_update_user_rejects_nonexistent_user(self, test_stores):
        """Verify update_user raises RuntimeError for non-existent UUID."""
        stores = test_stores
        with pytest.raises(RuntimeError, match="no user found"):
            await stores.supabase.update_user(
                "00000000-0000-0000-0000-000000000000", {"roles": ["test"]}
            )
