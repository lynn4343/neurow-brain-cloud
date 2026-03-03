"""Signal detection for coaching sessions.

Regex-based detection of 4 signal types in user messages.
Signals modify the PROMPT content (via prompt_assembler), not turn progression.
"""

import re


# Patterns are checked case-insensitively via re.IGNORECASE.
# Crisis is checked first and takes priority in the return list.
_SIGNAL_PATTERNS: dict[str, list[str]] = {
    "crisis": [
        r"hurt myself",
        r"suicide",
        r"want to die",
        r"self[- ]?harm",
        r"end it all",
    ],
    "flooding": [
        r"overwhelmed",
        r"too much",
        r"can'?t handle",
        r"breaking down",
        r"crying",
        r"falling apart",
    ],
    "idk": [
        r"i don'?t know",
        r"no idea",
        r"not sure",
        r"can'?t think of",
        r"drawing a blank",
        r"no clue",
    ],
    "disagreement": [
        r"don'?t agree",
        r"don'?t think that",
        r"doesn'?t apply",
        r"wrong question",
        r"that'?s not",
        r"i disagree",
        r"doesn'?t work for me",
    ],
}

# Pre-compile all patterns for performance.
_COMPILED: dict[str, list[re.Pattern]] = {
    signal: [re.compile(pat, re.IGNORECASE) for pat in patterns]
    for signal, patterns in _SIGNAL_PATTERNS.items()
}

# Ordered list ensures crisis is always checked (and returned) first.
_CHECK_ORDER = ["crisis", "flooding", "idk", "disagreement"]


class SignalDetector:
    """Detect coaching-relevant signals in user messages."""

    def check(self, user_message: str) -> list[str]:
        """Return list of detected signal types.

        Empty list if no signals. Multiple signals possible.
        Crisis always appears first if detected.
        """
        if not user_message:
            return []

        detected: list[str] = []
        for signal in _CHECK_ORDER:
            for pattern in _COMPILED[signal]:
                if pattern.search(user_message):
                    detected.append(signal)
                    break  # One match per signal type is sufficient
        return detected
