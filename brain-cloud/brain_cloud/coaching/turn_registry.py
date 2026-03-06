"""Turn registry for the 9-turn Clarity Session.

Linear progression (OB-D-006): Turn 1 → 2 → ... → 9. No branching.
Signals modify the PROMPT, not the turn progression.
"""

from dataclasses import dataclass, field


@dataclass(frozen=True)
class TurnSpec:
    turn_number: int
    turn_name: str
    template_name: str
    data_to_capture: dict[str, str] = field(default_factory=dict)


# The 9 turns are a static registry. No database lookup needed.
_TURNS: dict[int, TurnSpec] = {
    1: TurnSpec(
        turn_number=1,
        turn_name="one_year_vision",
        template_name="clarity_session/turn_1",
        data_to_capture={"one_year_vision_raw": "text", "one_year_vision_refined": "text"},
    ),
    2: TurnSpec(
        turn_number=2,
        turn_name="domain_vision",
        template_name="clarity_session/domain_vision",
        data_to_capture={"domain_vision_raw": "text"},
    ),
    3: TurnSpec(
        turn_number=3,
        turn_name="quarterly_goal",
        template_name="clarity_session/turn_2",
        data_to_capture={"quarterly_goal_raw": "text", "quarterly_goal_refined": "text"},
    ),
    4: TurnSpec(
        turn_number=4,
        turn_name="goal_why",
        template_name="clarity_session/turn_3",
        data_to_capture={"goal_why": "text"},
    ),
    5: TurnSpec(
        turn_number=5,
        turn_name="halfway_milestone",
        template_name="clarity_session/turn_4",
        data_to_capture={"halfway_milestone": "text"},
    ),
    6: TurnSpec(
        turn_number=6,
        turn_name="next_action_step",
        template_name="clarity_session/turn_5",
        data_to_capture={"next_action_step": "text"},
    ),
    7: TurnSpec(
        turn_number=7,
        turn_name="identity_shift",
        template_name="clarity_session/turn_6",
        data_to_capture={"identity_traits": "list"},
    ),
    8: TurnSpec(
        turn_number=8,
        turn_name="release",
        template_name="clarity_session/turn_7",
        data_to_capture={"release_items": "list"},
    ),
    9: TurnSpec(
        turn_number=9,
        turn_name="summary_close",
        template_name="clarity_session/turn_8",
        data_to_capture={},
    ),
}


class TurnRegistry:
    """Linear 9-turn Clarity Session progression."""

    def get_turn(self, turn_number: int) -> TurnSpec:
        """Return the spec for a given turn number (1-9).

        Raises KeyError if turn_number is outside 1-9.
        """
        if turn_number not in _TURNS:
            raise KeyError(f"Turn {turn_number} does not exist (valid: 1-9)")
        return _TURNS[turn_number]

    def get_next_turn(self, current_turn: int) -> int:
        """Always returns current_turn + 1. No branching (OB-D-006)."""
        return current_turn + 1

    def is_complete(self, turn_number: int) -> bool:
        """Returns True if turn_number > 9 (session finished)."""
        return turn_number > 9
