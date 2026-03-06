import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createNDJSONHandler, type StreamEmitter } from '../claude';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createMockEmitter() {
  return {
    chatStream: vi.fn(),
    chatActivity: vi.fn(),
    sessionComplete: vi.fn(),
    chatComplete: vi.fn(),
    chatError: vi.fn(),
  } satisfies StreamEmitter;
}

/** Build a JSON NDJSON line for type='assistant' with text content */
function assistantLine(text: string, sessionId?: string, toolUse?: { id: string; name: string }) {
  const content: Array<Record<string, unknown>> = [];
  if (text) {
    content.push({ type: 'text', text });
  }
  if (toolUse) {
    content.push({ type: 'tool_use', id: toolUse.id, name: toolUse.name, input: {} });
  }
  return JSON.stringify({
    type: 'assistant',
    ...(sessionId ? { session_id: sessionId } : {}),
    message: { role: 'assistant', content },
  });
}

/** Build a JSON NDJSON line for type='user' with a tool_result */
function userLine(toolResult: string) {
  return JSON.stringify({
    type: 'user',
    message: {
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: 'toolu_1', content: toolResult }],
    },
  });
}

/** Build a type='result' line */
function resultLine(sessionId = 'sess-1', costUsd = 0.05, durationMs = 1500) {
  return JSON.stringify({
    type: 'result',
    session_id: sessionId,
    cost_usd: costUsd,
    duration_ms: durationMs,
  });
}

/** Build a type='system' line */
function systemLine(sessionId = 'sess-1') {
  return JSON.stringify({ type: 'system', session_id: sessionId });
}

// ===========================================================================
// Tests
// ===========================================================================

describe('createNDJSONHandler — is_partial finalization', () => {
  let emit: ReturnType<typeof createMockEmitter>;

  beforeEach(() => {
    emit = createMockEmitter();
  });

  // -----------------------------------------------------------------------
  // Test 1: Streaming sends is_partial: true
  // -----------------------------------------------------------------------
  it('sends is_partial: true during assistant streaming', () => {
    const { handleLine } = createNDJSONHandler(emit);

    handleLine(assistantLine('Hello', 'sess-1'));
    handleLine(assistantLine('Hello, world', 'sess-1'));
    handleLine(assistantLine('Hello, world! How are you?', 'sess-1'));

    expect(emit.chatStream).toHaveBeenCalledTimes(3);
    for (const call of emit.chatStream.mock.calls) {
      expect(call[0].is_partial).toBe(true);
    }
  });

  // -----------------------------------------------------------------------
  // Test 2: assistant→user sends is_partial: false
  // -----------------------------------------------------------------------
  it('sends is_partial: false when transitioning from assistant to user', () => {
    const { handleLine } = createNDJSONHandler(emit);

    handleLine(assistantLine('Close text here', 'sess-1'));
    expect(emit.chatStream).toHaveBeenCalledTimes(1);
    expect(emit.chatStream.mock.calls[0][0].is_partial).toBe(true);

    // Tool result arrives — finalization should fire
    handleLine(userLine('{"stored": true}'));

    expect(emit.chatStream).toHaveBeenCalledTimes(2);
    expect(emit.chatStream.mock.calls[1][0]).toEqual({
      session_id: 'sess-1',
      content: 'Close text here',
      is_partial: false,
    });
  });

  // -----------------------------------------------------------------------
  // Test 3: assistant→result sends is_partial: false
  // -----------------------------------------------------------------------
  it('sends is_partial: false when transitioning from assistant to result', () => {
    const { handleLine } = createNDJSONHandler(emit);

    handleLine(assistantLine('Final answer', 'sess-1'));
    handleLine(resultLine('sess-1'));

    expect(emit.chatStream).toHaveBeenCalledTimes(2);
    expect(emit.chatStream.mock.calls[1][0]).toEqual({
      session_id: 'sess-1',
      content: 'Final answer',
      is_partial: false,
    });
    expect(emit.chatComplete).toHaveBeenCalledTimes(1);
  });

  // -----------------------------------------------------------------------
  // Test 4: Text-less assistant→user — no finalization
  // -----------------------------------------------------------------------
  it('does not send finalization for assistant messages with only tool_use (no text)', () => {
    const { handleLine } = createNDJSONHandler(emit);

    // Assistant with only a tool_use block, no text
    const toolOnlyLine = JSON.stringify({
      type: 'assistant',
      session_id: 'sess-1',
      message: {
        role: 'assistant',
        content: [{ type: 'tool_use', id: 'toolu_1', name: 'brain_recall', input: {} }],
      },
    });
    handleLine(toolOnlyLine);

    // No chatStream calls (no visible text)
    expect(emit.chatStream).toHaveBeenCalledTimes(0);

    // Tool result arrives
    handleLine(userLine('{"results": []}'));

    // Still no chatStream calls — no finalization needed
    expect(emit.chatStream).toHaveBeenCalledTimes(0);
  });

  // -----------------------------------------------------------------------
  // Test 5: Two assistant messages finalize independently
  // -----------------------------------------------------------------------
  it('finalizes each assistant message independently across tool calls', () => {
    const { handleLine } = createNDJSONHandler(emit);

    // First assistant message
    handleLine(assistantLine('First response', 'sess-1'));
    handleLine(userLine('{"stored": true}'));

    // Second assistant message
    handleLine(assistantLine('Second response', 'sess-1'));
    handleLine(userLine('{"stored": true}'));

    expect(emit.chatStream).toHaveBeenCalledTimes(4);
    // Event 1: first response, is_partial: true
    expect(emit.chatStream.mock.calls[0][0]).toEqual({
      session_id: 'sess-1', content: 'First response', is_partial: true,
    });
    // Event 2: first response finalized, is_partial: false
    expect(emit.chatStream.mock.calls[1][0]).toEqual({
      session_id: 'sess-1', content: 'First response', is_partial: false,
    });
    // Event 3: second response, is_partial: true
    expect(emit.chatStream.mock.calls[2][0]).toEqual({
      session_id: 'sess-1', content: 'Second response', is_partial: true,
    });
    // Event 4: second response finalized, is_partial: false
    expect(emit.chatStream.mock.calls[3][0]).toEqual({
      session_id: 'sess-1', content: 'Second response', is_partial: false,
    });
  });

  // -----------------------------------------------------------------------
  // Test 6: Content deduplication
  // -----------------------------------------------------------------------
  it('deduplicates identical content (does not re-send same text)', () => {
    const { handleLine } = createNDJSONHandler(emit);

    handleLine(assistantLine('Same text', 'sess-1'));
    handleLine(assistantLine('Same text', 'sess-1')); // duplicate

    expect(emit.chatStream).toHaveBeenCalledTimes(1);
  });

  // -----------------------------------------------------------------------
  // Test 7: session-complete detected from tool result
  // -----------------------------------------------------------------------
  it('emits sessionComplete when tool result contains session_complete + goal_cascade', () => {
    const { handleLine } = createNDJSONHandler(emit);

    const goalCascade = {
      vision: 'Build a thriving practice',
      quarterly_goal: 'Land 3 new clients',
      goal_why: 'Financial freedom',
      identity_traits: ['bold', 'consistent'],
      release_items: ['perfectionism'],
      next_action_step: 'Update rate sheet',
      next_action_due: '2026-03-15',
    };

    handleLine(assistantLine('Close narrative', 'sess-1'));
    handleLine(userLine(JSON.stringify({
      stored: true,
      session_complete: true,
      goal_cascade: goalCascade,
    })));

    expect(emit.sessionComplete).toHaveBeenCalledTimes(1);
    expect(emit.sessionComplete.mock.calls[0][0]).toEqual({
      session_id: 'sess-1',
      goal_cascade: goalCascade,
    });
  });

  // -----------------------------------------------------------------------
  // Test 8: Non-matching tool result — no sessionComplete
  // -----------------------------------------------------------------------
  it('does not emit sessionComplete for non-matching tool results', () => {
    const { handleLine } = createNDJSONHandler(emit);

    handleLine(assistantLine('Response', 'sess-1'));
    handleLine(userLine(JSON.stringify({ stored: true, turn_advanced_to: 5, session_complete: false })));

    expect(emit.sessionComplete).toHaveBeenCalledTimes(0);
  });

  // -----------------------------------------------------------------------
  // Test 9: REGRESSION — Full Turn 9 sequence
  // Replays the exact NDJSON sequence from a Turn 9 completion.
  // This is the test that would have caught all three debug log failures.
  // -----------------------------------------------------------------------
  it('full Turn 9 sequence: correct event order (stream→finalize→sessionComplete→chatComplete)', () => {
    const { handleLine } = createNDJSONHandler(emit);

    const closeText = 'Your 1-year vision → your #1 quarterly goal → your next action step. ' +
      "That's what you just built. Most people never get that clear.\n\n" +
      "And I'll be here to help you stay aligned with it — not just today, but as it evolves.\n\n" +
      "Here's how we stay connected:\nEvery morning, I'll help you get oriented.\n" +
      "Every evening, we'll close out your day.\nEvery week, we'll check your trajectory.\n\n" +
      "Your next move this week: 'Update my rate sheet'. Ten minutes. " +
      "Don\u2019t worry about perfection \u2014 just start.";

    const goalCascade = {
      vision: 'Build a thriving coaching practice',
      quarterly_goal: 'Land 3 new clients',
      goal_why: 'Financial independence',
      identity_traits: ['bold', 'consistent'],
      release_items: ['perfectionism'],
      next_action_step: 'Update my rate sheet',
      next_action_due: '2026-03-15',
    };

    // 1. System message
    handleLine(systemLine('sess-turn9'));

    // 2. AI streams the narrative + close (progressive snapshots)
    handleLine(assistantLine('Your 1-year vision', 'sess-turn9'));
    handleLine(assistantLine(closeText.slice(0, 200), 'sess-turn9'));
    handleLine(assistantLine(closeText, 'sess-turn9'));

    // 3. Tool result from coaching_store_turn(9) — session complete
    handleLine(userLine(JSON.stringify({
      stored: true,
      turn_advanced_to: 10,
      session_complete: true,
      goal_cascade: goalCascade,
    })));

    // 4. CLI process ends
    handleLine(resultLine('sess-turn9'));

    // --- Verify complete event sequence ---

    // chatStream events: 3 partial + 1 finalization + 0 (result finalizes but nothing new)
    // Actually: 3 partial during streaming, then finalization at user transition,
    // then result tries to finalize but hasUnfinalizedAssistantMessage is false
    expect(emit.chatStream).toHaveBeenCalledTimes(4);

    // Events 1-3: streaming (is_partial: true)
    expect(emit.chatStream.mock.calls[0][0].is_partial).toBe(true);
    expect(emit.chatStream.mock.calls[1][0].is_partial).toBe(true);
    expect(emit.chatStream.mock.calls[2][0].is_partial).toBe(true);

    // Event 4: finalization (is_partial: false) — triggered by type='user'
    expect(emit.chatStream.mock.calls[3][0]).toEqual({
      session_id: 'sess-turn9',
      content: closeText,
      is_partial: false,
    });

    // sessionComplete: fires once, with goal cascade
    expect(emit.sessionComplete).toHaveBeenCalledTimes(1);
    expect(emit.sessionComplete.mock.calls[0][0].goal_cascade).toEqual(goalCascade);

    // chatComplete: fires once at the end
    expect(emit.chatComplete).toHaveBeenCalledTimes(1);

    // ORDER: finalization (chatStream:false) fires BEFORE sessionComplete
    // Both are in the 'user' case handler, synchronous.
    const streamCallOrder = emit.chatStream.mock.invocationCallOrder;
    const sessionCallOrder = emit.sessionComplete.mock.invocationCallOrder;
    const completeCallOrder = emit.chatComplete.mock.invocationCallOrder;

    // Finalization (last chatStream call) happens before sessionComplete
    expect(streamCallOrder[3]).toBeLessThan(sessionCallOrder[0]);
    // sessionComplete happens before chatComplete
    expect(sessionCallOrder[0]).toBeLessThan(completeCallOrder[0]);
  });

  // -----------------------------------------------------------------------
  // Test 10: Post-close new assistant message gets its own lifecycle
  // Simulates Test 2 scenario: AI generates text AFTER tool call.
  // With the fix, this is a new message — not an overwrite.
  // -----------------------------------------------------------------------
  it('post-close AI response creates a separate message lifecycle (no overwrite)', () => {
    const { handleLine } = createNDJSONHandler(emit);

    // AI generates close text
    handleLine(assistantLine('Close: Don\u2019t worry about perfection', 'sess-1'));

    // Tool call + result
    handleLine(userLine(JSON.stringify({ stored: true, session_complete: true, goal_cascade: {} })));

    // AI generates ANOTHER response (Test 2 failure mode)
    handleLine(assistantLine('Your session is complete! Let me...', 'sess-1'));

    // CLI ends
    handleLine(resultLine('sess-1'));

    // chatStream events:
    // 1: close text (partial: true)
    // 2: close text finalized (partial: false) — at user transition
    // 3: new AI text (partial: true) — separate message
    // 4: new AI text finalized (partial: false) — at result transition
    expect(emit.chatStream).toHaveBeenCalledTimes(4);

    // Event 1: close text, streaming
    expect(emit.chatStream.mock.calls[0][0].content).toBe('Close: Don\u2019t worry about perfection');
    expect(emit.chatStream.mock.calls[0][0].is_partial).toBe(true);

    // Event 2: close text, finalized
    expect(emit.chatStream.mock.calls[1][0].content).toBe('Close: Don\u2019t worry about perfection');
    expect(emit.chatStream.mock.calls[1][0].is_partial).toBe(false);

    // Event 3: NEW content (not close text), streaming
    expect(emit.chatStream.mock.calls[2][0].content).toBe('Your session is complete! Let me...');
    expect(emit.chatStream.mock.calls[2][0].is_partial).toBe(true);

    // Event 4: NEW content finalized
    expect(emit.chatStream.mock.calls[3][0].content).toBe('Your session is complete! Let me...');
    expect(emit.chatStream.mock.calls[3][0].is_partial).toBe(false);
  });
});
