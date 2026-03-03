"""
Load Theo's coaching artifacts into Brain Cloud (all 4 stores).

Calls write_pipeline() for each artifact so content propagates to
Supabase (episodic), Neo4j (relational), Qdrant (vector), and Mem0 (semantic).

Artifacts sourced from: DATA_PROFILES/Theo_Nakamura/03_COACHING_DATA_DESIGN.md

Run from brain-cloud/:
  uv run python scripts/load_coaching_data.py

Source: Wave 3 S4 spec
"""

import asyncio
import logging
import time

from brain_cloud.config import Settings
from brain_cloud.pipelines.write import write_pipeline
from brain_cloud.stores import StoreManager

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("load_coaching_data")

USER_ID = "theo"  # Slug — write_pipeline resolves to UUID internally


# ---------------------------------------------------------------------------
# Artifact definitions — each is a (label, content) tuple.
# Content is natural language that write_pipeline extracts facts/entities from.
# ---------------------------------------------------------------------------

GOAL_CASCADE = [
    (
        "Goal Cascade — Clarity Session",
        "Clarity Session completed February 6, 2026. "
        "One-year vision: Running a self-sustaining creative practice — brand identity "
        "plus motion design — on freelance income alone. Financially stable: debt cleared, "
        "savings building. Recognized in Austin's creative community for excellent work. "
        "Quarterly goal (90 days): Establish $100/hour rate for all new clients, maintain "
        "3 concurrent brand identity projects, and complete School of Motion modules 1-6. "
        "Goal why: Financial freedom to choose projects I love, not just projects that pay. "
        "Every time I raise my rate and the client says yes, I feel less like I'm faking it. "
        "Motion design is where the industry's going — brand identity plus motion means I'm "
        "not just another logo guy. "
        "Halfway milestone (week 6): Quoted $100/hour on at least 2 new inquiries with at "
        "least one acceptance. Revision policy sent to every new client before the first call. "
        "Through Module 3 of School of Motion with a portfolio-ready piece. "
        "Next action step: Update my rate sheet and send to my next inquiry. "
        "Identity traits declared: Bold with my pricing, Disciplined with the unsexy stuff, "
        "Someone who finishes what he starts. "
        "Release items: Saying yes to projects I know are underpriced, The story that I still "
        "need the coffee shop to survive, Putting off systems until 'later'."
    ),
]

WEEKLY_SESSIONS = [
    (
        "Weekly Session 1 — Feb 13 — The Awakening",
        "Week 1 coaching session, February 13, 2026. First $100/hour quote sent on Tuesday — "
        "Theo typed $85 first, deleted it, typed $100, hands were shaking, sent it anyway. "
        "Pricing Growth Arc insight surfaced: 267% project value growth over 10 months, "
        "8 journal entries about undercharging, rate increase email template already drafted. "
        "The $100/hour rate isn't aspirational — it's catching up to what the market is already "
        "paying him. Austin Is Home insight resolved: 12 mentions of 'should I stay,' but every "
        "meaningful connection is in Austin. Behavior already answered the question. Running "
        "intention set: 3x/week sunset runs, Town Lake trail. Admin block set for Tuesday "
        "afternoon. School of Motion Module 1 starting Thursday evening. Priorities: hold the "
        "$100 rate, set up admin block, start School of Motion."
    ),
    (
        "Weekly Session 2 — Feb 20 — The Structure",
        "Week 2 coaching session, February 20, 2026. First $100/hour project converted — client "
        "said yes without hesitation. The resistance to pricing was always internal, not "
        "market-side. ADHD Pattern Map insight surfaced: creative hyperfocus works as a "
        "superpower in client work, but admin avoidance is the enemy. Every time unstructured "
        "admin is on the calendar, it gets eaten by creative work. Borrowed scaffolding concept "
        "named: most productive non-creative sessions happen at locations with external structure "
        "(UT library, coffee shop). Admin block moved from home to UT library — Tuesday 9-11 AM. "
        "Environment over discipline as the ADHD strategy. School of Motion Module 1 complete, "
        "Module 2 in progress. Running 2 of 3 this week. Austin Is Home fully settled."
    ),
    (
        "Weekly Session 3 — Feb 27 — The Enforcement",
        "Week 3 coaching session, February 27, 2026. UT library admin block worked — 90 minutes, "
        "3 invoices sent, 2 follow-up emails, project tracker updated. Same tasks that take 4 "
        "hours at home. Admin slipped Wednesday-Thursday when back-to-back client calls stacked — "
        "structural conflict, not avoidance. Second discovery call at $100/hour — client said yes, "
        "two projects at new rate now. Revision Boundary Loop surfaced: 7 months of saying 'I "
        "need a revision policy' while the policy existed in his Notion templates since August. "
        "Client onboarding template WITH revision policy, scope limits, revision counts already "
        "built. The gap isn't creation — it's sending. Commitment: scope doc to every new client "
        "before the first call. Financial Feelings vs Reality surfaced: $5,840 CC debt shame in "
        "8 journal entries, but freelance income now covers expenses without barista shifts. "
        "Payoff spreadsheet created months ago, never reopened. First extra CC payment made ($50 "
        "beyond minimum). Meta-pattern crystallizing: 'I already have the answers, the gap is doing.'"
    ),
    (
        "Weekly Session 4 — Mar 6 — The Synthesis",
        "Week 4 coaching session, March 6, 2026. Scope docs sent to 2 new clients before first "
        "calls — one responded 'this is really professional, I wish more freelancers did that.' "
        "Seven months of 'someday' and the first person to receive it gave a compliment. Third "
        "discovery call at $100/hour — didn't convert, didn't discount, didn't panic. Just said "
        "'I understand, good luck.' Invisible Pipeline surfaced: portfolio posts lead to traffic, "
        "traffic leads to inquiries, inquiries lead to delivery, delivery leads to referrals. "
        "That's not three lucky breaks — it's a flywheel Theo built without naming. Payoff "
        "spreadsheet opened and updated: CC debt kill date is October 2026 — 8 months, not years. "
        "'A tunnel with a date, not a hole.' School of Motion Module 3 complete with portfolio-"
        "ready Blender render, Module 4 starting — two weeks ahead of milestone. All 3 runs hit. "
        "Admin blocks at library are routine. Identity shift recognized: from surviving to "
        "building. All 6 cross-domain insights now surfaced across 4 weeks."
    ),
]

MONTHLY_REVIEW = [
    (
        "Monthly Review — Month 1 — Mar 7",
        "Monthly Review completed March 7, 2026. First month retrospective. "
        "Biggest win: pricing consistency — quoted $100/hour on 4 discovery calls, held every "
        "time, 2 converted to projects, zero discounts given. The behavioral change behind the "
        "number. Biggest learning: 'The gap was never about knowing what to do. It was about "
        "doing what I already knew.' The solutions existed — implementation was the bottleneck. "
        "Quarterly goal status: rate on track (quoting consistently), projects almost there "
        "(2 of 3, third pending from Monday discovery call), School of Motion ahead of schedule "
        "(Module 4, milestone was Module 3 by week 6). Month 2 Platinum Priorities: land third "
        "concurrent project, complete School of Motion through Module 6, second extra CC payment "
        "plus updated payoff timeline. Adjustments: admin blocks moving to UT library as "
        "non-negotiable, weekly portfolio post to feed pipeline intentionally, Sunday 5-minute "
        "financial check-in ritual. Identity trait check: bold with pricing showing up (4/4 rate "
        "holds), disciplined with admin mostly showing up (invoicing streak, slipped week 3), "
        "finishes what he starts showing up (Module 4 ahead of schedule). Whole-life: running "
        "3x/week anchoring evenings, financial anxiety persisting despite improving trajectory, "
        "social life healthy, energy better with structure, decision fatigue recognized as "
        "ADHD-specific pattern."
    ),
]

DAILY_CHECKINS = [
    (
        "Daily Check-in — Feb 7 Morning Brief",
        "Morning brief, February 7, 2026. First morning brief after Clarity Session. "
        "Top 3 priorities: update rate sheet with $100/hour rate, review client onboarding "
        "template (the one with the revision policy), schedule first School of Motion session "
        "for this weekend. Coaching signal: first action from Clarity Session is updating the "
        "rate sheet. Everything starts with the number. Theo confirmed: 'Let's do it.' "
        "Energy: ready."
    ),
    (
        "Daily Check-in — Feb 11 Evening Reflection",
        "Evening reflection, February 11, 2026. Sent first $100/hour quote today. Typed $85 "
        "first, deleted it, typed $100. Hands were shaking. Closed laptop and made coffee "
        "because couldn't watch inbox. Haven't heard back yet but the quote is sent. That's "
        "the win — held the number. Tomorrow intention: check email, don't send a follow-up "
        "discount. Mood: mixed — proud but nervous."
    ),
    (
        "Daily Check-in — Feb 18 Evening Reflection",
        "Evening reflection, February 18, 2026. Admin block was supposed to be 2 hours. "
        "Opened Figma to check one thing on the Meridian project. Three hours later, not a "
        "single invoice sent. Creative gravity pulled me in — the second Figma is open, admin "
        "doesn't exist. Frustrated with ADHD creative pull. Tomorrow intention: invoices before "
        "Figma, no exceptions. Mood: frustrated."
    ),
    (
        "Daily Check-in — Feb 21 Morning Brief",
        "Morning brief, February 21, 2026. First UT library admin block today. Top 3 "
        "priorities: admin block at UT library 9 AM (invoicing and follow-ups, no Figma), "
        "Meridian brand deck in afternoon at home studio, sunset run (second this week). "
        "Coaching signal: different location, same tasks — the scaffolding is there, go borrow "
        "it. Theo packed library bag. Mood: cautiously optimistic."
    ),
    (
        "Daily Check-in — Feb 25 Evening Reflection",
        "Evening reflection, February 25, 2026. UT library admin block worked. Ninety minutes: "
        "sent 3 invoices, followed up on 2 emails, updated project tracker. Same stuff that "
        "takes 4 hours at home, done in ninety minutes. Didn't even think about opening Figma. "
        "Feels like cracking a code — can't do admin near design tools, that's the whole insight. "
        "Tomorrow intention: keep Tuesday library blocks permanent. Mood: breakthrough energy."
    ),
    (
        "Daily Check-in — Feb 27 Evening Reflection",
        "Evening reflection, February 27, 2026. Sent scope doc to a new client before the first "
        "call — first time ever. Almost didn't — brain said 'they'll think you're difficult.' "
        "Attached it to the onboarding email and hit send. No pushback, no drama. The absence of "
        "drama IS the data — boundaries feel clear from the other side, not difficult. Tomorrow "
        "intention: do it again next time, make it automatic. Mood: quiet pride."
    ),
    (
        "Daily Check-in — Mar 2 Evening Reflection",
        "Evening reflection, March 2, 2026. Opened CC payoff spreadsheet for the first time. "
        "Updated with actual income from last two months. Kill date: October 2026. Eight months. "
        "Thought it would be years — literally thought carrying this until 30. It's October. "
        "Felt different than expected — relieved, not spiraling. 'A tunnel with a date on the "
        "other end. Not a hole. A tunnel.' Planning to set up extra payment as automatic — take "
        "the decision out of it. Mood: relieved."
    ),
    (
        "Daily Check-in — Mar 5 Evening Reflection",
        "Evening reflection, March 5, 2026. The client sent the scope doc to last week — had "
        "first call today. At the end she said: 'By the way, that scope document was really "
        "professional. I wish more freelancers did that.' Seven months of 'I need to write a "
        "revision policy' and the first person to receive it says it's professional. The thing "
        "was ready — Theo just wasn't sending it. Now he is. Tomorrow intention: keep sending "
        "it, every new client, automatic. Mood: validated."
    ),
]

BEHAVIORAL_DELTAS = [
    (
        "Behavioral Delta — Pricing Consistency",
        "Behavioral Delta measured March 7, 2026: Pricing Consistency. Rate hold on discovery "
        "calls went from 0 out of 0 (no calls at $100/hour pre-coaching, prior rate $55-85/hour) "
        "to 4 out of 4 (quoted $100 on every discovery call, held every time, zero discounts, "
        "2 conversions to projects). First quote February 11 with hands shaking. By week 4, "
        "stating rate without apology. Identity shift from 'I can't charge that' to 'this is my "
        "rate.' Linked to Pricing Growth Arc insight and 'bold with pricing' identity trait."
    ),
    (
        "Behavioral Delta — Admin Execution",
        "Behavioral Delta measured March 7, 2026: Admin Execution. Admin block completion rate "
        "went from 0% (no structured admin blocks existed pre-coaching) to 75% (3 of 4 weeks "
        "with successful admin blocks). Failed at home due to Figma creative gravity. Succeeded "
        "at UT library using borrowed scaffolding strategy. Week 3 slipped under client call "
        "pressure — diagnosed as structural conflict, not personal failure. Invoicing streak "
        "active. Linked to ADHD Pattern Map insight and 'disciplined with admin' identity trait."
    ),
    (
        "Behavioral Delta — Boundary Enforcement",
        "Behavioral Delta measured March 7, 2026: Boundary Enforcement. Scope document sent "
        "before first call went from 0 (revision policy existed in templates for 7 months since "
        "August 2025, never sent to a single client) to consistent sending to every new client "
        "in the final 2 weeks. One scope boundary enforced with Meridian project. Client praised "
        "scope doc as 'really professional — wish more freelancers did that.' The gap was never "
        "creation — the policy existed. The gap was implementation. Linked to Revision Boundary "
        "Loop insight and 'finishes what he starts' identity trait."
    ),
    (
        "Behavioral Delta — Financial Relationship",
        "Behavioral Delta measured March 7, 2026: Financial Relationship. Financial engagement "
        "shifted from avoidance (minimum CC payments only, payoff spreadsheet created but never "
        "reopened, 8 journal entries of debt shame, checking balance with dread) to proactive "
        "engagement (one extra CC payment made beyond minimum, payoff spreadsheet opened and "
        "updated, kill date calculated as October 2026, planning to automate extra payments). "
        "'A tunnel with a date, not a hole.' Narrative lag: feelings running on 2024 story while "
        "2026 finances tell a different one. Linked to Financial Feelings vs Reality insight."
    ),
    (
        "Behavioral Delta — Pipeline Intentionality",
        "Behavioral Delta measured March 7, 2026: Pipeline Intentionality. Business development "
        "awareness shifted from unconscious (referrals experienced as disconnected lucky breaks, "
        "posting portfolio work only when felt like it) to conscious (flywheel named: post work "
        "leads to traffic leads to inquiry leads to delivery leads to referral, first intentional "
        "portfolio post planned, connecting new inquiries to the pipeline pattern, weekly posting "
        "cadence set for Month 2). Youngest delta — awareness shift, behavioral change just "
        "beginning. Linked to Invisible Pipeline insight."
    ),
]

CALENDAR_EVENTS = [
    (
        "Calendar — Discovery Call Mar 9",
        "Calendar event for Monday March 9, 2026: Discovery call with new client inquiry at "
        "11:00 AM on Zoom, 45 minutes. Potential brand identity project. This is Theo's 4th "
        "discovery call at his new $100/hour rate. Two of the previous three converted. "
        "Coaching angle: confidence bridge — remind him of his track record, don't tell him "
        "what to do. Could be his third concurrent project (quarterly goal)."
    ),
    (
        "Calendar — Lunch with Dev Mar 9",
        "Calendar event for Monday March 9, 2026: Lunch with Dev (roommate) at Veracruz All "
        "Natural at 12:00 PM, 45 minutes. Casual social — no coaching signal needed. The "
        "restraint of not coaching on a casual lunch is itself meaningful."
    ),
    (
        "Calendar — Focus Block Meridian Mar 9",
        "Calendar event for Monday March 9, 2026: Focus block for Meridian brand deck from "
        "1:00 PM to 5:30 PM at home studio. Long afternoon design session for active client "
        "project. Theo is working within the scope document he sent — revision boundaries "
        "being tested in real-time."
    ),
    (
        "Calendar — Sunset Run Mar 9",
        "Calendar event for Monday March 9, 2026: Sunset run along Town Lake trail at 6:00 PM, "
        "35 minutes. Work-to-evening transition. Theo's weekly intention is to jog 3x/week — "
        "this would be his third run this week. Physical activity helps regulate ADHD energy "
        "and marks end of work day."
    ),
    (
        "Calendar — Austin Creatives Mar 9",
        "Calendar event for Monday March 9, 2026: Austin Creatives community hangout at Revelry "
        "Kitchen & Bar at 7:30 PM. Light social event with the local creative community. Theo "
        "has been attending 1-2x/month since coaching started. Social anxiety around networking "
        "has decreased. Connects to Invisible Pipeline (the flywheel includes community) and "
        "Austin Is Home."
    ),
]

COACHING_SCRIPTS = [
    (
        "Key Coaching Moment — The $85 to $100 Rewrite",
        "Key coaching moment from February 11, 2026. Theo was writing a rate quote email. "
        "He typed $85/hour — his comfortable old rate. Then he deleted it and typed $100/hour. "
        "His hands were literally shaking. He sent it, closed his laptop, and went to make "
        "coffee because he couldn't watch his inbox. This single moment — deleting $85 and "
        "typing $100 — encapsulates the entire pricing transformation. The coaching system "
        "later revealed he had journaled about undercharging 8 separate times and his project "
        "values had grown 267% without him noticing."
    ),
    (
        "Key Coaching Moment — You Already Have the Answers",
        "Key coaching moment from Week 3, February 27, 2026. The meta-learning that became "
        "the foundation of Theo's coaching: 'The gap was never about knowing what to do. It "
        "was about doing what I already knew.' The revision policy existed in his templates for "
        "7 months. The rate increase email was already drafted. The admin blocks worked at the "
        "library — he just wasn't going there on purpose. The payoff spreadsheet was already "
        "built. Every solution already existed. The coaching system's job was to show him what "
        "he already had, not to create something new."
    ),
    (
        "Key Coaching Moment — Borrowed Scaffolding",
        "Key coaching moment from Week 2, February 20, 2026. Theo named the concept 'borrowed "
        "scaffolding' — using external environments (UT library, coffee shop) to provide the "
        "structure his ADHD brain needs for admin tasks. His most productive non-creative "
        "sessions all happened in locations with other people working, a time limit, and no "
        "Figma access. The fix isn't discipline — it's environment. Admin block moved from home "
        "to UT library. Same time, different location. 90-minute clears instead of 4-hour fails."
    ),
    (
        "Key Coaching Moment — The Pipeline Naming",
        "Key coaching moment from Week 4, March 6, 2026. The coaching system connected Theo's "
        "disconnected experiences into a pattern: he posts portfolio work on Instagram, portfolio "
        "traffic grows, a client inquires, he delivers, they refer, a new client inquires. "
        "That's not three lucky breaks — that's a flywheel. Theo's response: 'That's actually "
        "a system? I thought I was just posting when I felt like it.' The Invisible Pipeline "
        "insight shifted him from accidental business development to intentional pipeline feeding. "
        "Weekly posting cadence planned for Month 2."
    ),
]


async def load_artifacts(
    stores: StoreManager,
    category_name: str,
    artifacts: list[tuple[str, str]],
) -> int:
    """Load a category of artifacts via write_pipeline. Returns count loaded."""
    loaded = 0
    for label, content in artifacts:
        try:
            result = await write_pipeline(
                content=content,
                user_id=USER_ID,
                stores=stores,
                session_id=None,  # Historical data, no active coaching session
            )
            loaded += 1
            logger.info(
                f"  [{category_name}] {label[:60]:60s} "
                f"— {result.facts_stored} facts, stores: {result.stores}"
            )
        except Exception as e:
            logger.error(f"  [{category_name}] FAILED: {label[:60]} — {e}")
    return loaded


async def main():
    settings = Settings()
    stores = await StoreManager.create(settings)

    try:
        logger.info("=" * 70)
        logger.info("Loading Theo's coaching artifacts into Brain Cloud")
        logger.info("=" * 70)

        total = 0
        start = time.time()

        categories = [
            ("Goal Cascade", GOAL_CASCADE),
            ("Weekly Sessions", WEEKLY_SESSIONS),
            ("Monthly Review", MONTHLY_REVIEW),
            ("Daily Check-ins", DAILY_CHECKINS),
            ("Behavioral Deltas", BEHAVIORAL_DELTAS),
            ("Calendar Events", CALENDAR_EVENTS),
            ("Coaching Scripts", COACHING_SCRIPTS),
        ]

        for cat_name, artifacts in categories:
            logger.info(f"\n--- {cat_name} ({len(artifacts)} artifacts) ---")
            count = await load_artifacts(stores, cat_name, artifacts)
            total += count

        elapsed = time.time() - start
        logger.info(f"\n{'=' * 70}")
        logger.info(f"Done. {total} artifacts loaded in {elapsed:.1f}s.")
        logger.info(f"{'=' * 70}")
    finally:
        await stores.close()


if __name__ == "__main__":
    asyncio.run(main())
