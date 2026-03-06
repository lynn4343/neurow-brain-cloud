"use client";

import { useState, useEffect } from "react";
import { Check } from "@phosphor-icons/react";
import { OnboardingLayout } from "./OnboardingLayout";
import { BUSINESS_STAGES } from "./onboarding-data";

// ---------------------------------------------------------------------------
// Data contract — fields written to UserProfile after onboarding
// ---------------------------------------------------------------------------

export interface OnboardingData {
  roles: string[];
  focus_area: string;
  coaching_style: string;
  is_business_owner: boolean;
  // Conditional screens
  side_hustle_goal?: string;
  love_partner_situation?: string;
  // Path A fields (business owners only)
  business_description?: string;
  business_stage?: string;
  current_business_focus?: string;
  business_challenges?: string[];
  // Path B fields (career professionals only)
  career_situation?: string;
  career_stage?: string;
  career_focus?: string;
  career_challenges?: string[];
  // Unified challenges — ALL paths populate this
  declared_challenges: string[];
}

interface OnboardingScreensProps {
  onComplete: (data: OnboardingData) => void;
}

// ---------------------------------------------------------------------------
// Option definitions
// ---------------------------------------------------------------------------

const ROLE_OPTIONS = [
  { value: "founder", label: "Founder/Entrepreneur" },
  { value: "freelancer", label: "Freelancer" },
  { value: "student", label: "Student" },
  { value: "employed", label: "Employed Professional" },
  { value: "parent", label: "Parent/Caregiver" },
  { value: "creative", label: "Creative/Artist/Performer" },
  { value: "athlete", label: "Athlete" },
  { value: "side-hustler", label: "Side Hustler" },
];

const FOCUS_OPTIONS = [
  { id: "career-business", label: "Career/Business", emoji: "\uD83D\uDCBC" },
  { id: "health", label: "Health & Wellness", emoji: "\uD83D\uDCAA" },
  { id: "family", label: "Family", emoji: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67" },
  { id: "love", label: "Love/Partner", emoji: "\u2764\uFE0F" },
  { id: "home", label: "Home", emoji: "\uD83C\uDFE0" },
  { id: "finance", label: "Personal Finance", emoji: "\uD83D\uDCB0" },
  { id: "education", label: "Education", emoji: "\uD83C\uDF93" },
  { id: "personal-growth", label: "Mental/Emotional (Personal Growth)", emoji: "\uD83E\uDDE0" },
  { id: "spirituality", label: "Spirituality", emoji: "\uD83D\uDE4F" },
];

const COACHING_STYLES = [
  {
    id: "gentle",
    emoji: "\uD83C\uDF38",
    title: "Gentle Guidance",
    description:
      "Warm, supportive, and encouraging, I'll be your cheerleader.",
  },
  {
    id: "balanced",
    emoji: "\u2696\uFE0F",
    title: "Balanced",
    tag: "(Recommended)",
    description:
      "I'll adapt based on what you need\u2014gentle when you're struggling, direct when you need momentum.",
  },
  {
    id: "direct",
    emoji: "\uD83C\uDFAF",
    title: "Direct",
    description: "Straightforward. Tell it to me blunt.",
  },
  {
    id: "peak-performance",
    emoji: "\uD83D\uDD25",
    title: "Peak Performance",
    description: "Full accountability mode. Push me to be my best.",
  },
];

// ---------------------------------------------------------------------------
// Business Stages (verified against production business-stage/page.tsx)
// ---------------------------------------------------------------------------

// BUSINESS_STAGES imported from ./onboarding-data (extracted for HMR stability)

// ---------------------------------------------------------------------------
// Business Challenges (verified against production business-challenges/page.tsx)
// ---------------------------------------------------------------------------

const BUSINESS_CHALLENGES: ChallengeCategory[] = [
  {
    label: "EXECUTION",
    challenges: [
      { id: "procrastination", label: "Procrastination" },
      {
        id: "difficulty-focusing",
        label: "Difficulty focusing / distractions",
      },
      { id: "starting-not-finishing", label: "Starting and not finishing" },
    ],
  },
  {
    label: "MENTAL/EMOTIONAL",
    challenges: [
      { id: "overwhelm", label: "Overwhelm" },
      { id: "perfectionism", label: "Perfectionism" },
      { id: "self-doubt", label: "Self-doubt" },
      { id: "imposter-syndrome", label: "Imposter syndrome" },
    ],
  },
  {
    label: "CLARITY",
    challenges: [
      { id: "dont-know-next", label: "Don't know what to do next" },
      {
        id: "questioning-goal",
        label: "Questioning if this is the right goal",
      },
      {
        id: "too-many-opportunities",
        label: "Too many opportunities / Can't focus",
      },
    ],
  },
  {
    label: "RESOURCES",
    challenges: [
      { id: "time-scarcity", label: "Time scarcity" },
      { id: "money-scarcity", label: "Money scarcity" },
      { id: "energy-burnout", label: "Energy / Burnout" },
      {
        id: "lack-of-support",
        label: "Lack of support / accountability",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Career Situations (verified against production career-situation/page.tsx)
// ---------------------------------------------------------------------------

const CAREER_SITUATIONS = [
  {
    id: "growing",
    emoji: "\uD83C\uDF31",
    title: "Growing where I am",
    description:
      "Advancing, getting promoted, or leveling up in my current role.",
  },
  {
    id: "making-move",
    emoji: "\uD83D\uDE80",
    title: "Making a move",
    description: "Employed but actively looking for something new.",
  },
  {
    id: "landing-next",
    emoji: "\uD83C\uDFAF",
    title: "Landing my next role",
    description:
      "Between jobs and focused on finding the right opportunity.",
  },
  {
    id: "finding-direction",
    emoji: "\uD83E\uDDED",
    title: "Finding my direction",
    description:
      "Figuring out what I want \u2014 open to exploring a new path.",
  },
];

// ---------------------------------------------------------------------------
// Career Stages (verified against production career-stage/page.tsx)
// ---------------------------------------------------------------------------

const CAREER_STAGES = [
  {
    id: "early",
    emoji: "\uD83C\uDF31",
    title: "Early career",
    description:
      "0\u20133 years of experience. Building skills and finding my path.",
  },
  {
    id: "mid",
    emoji: "\uD83D\uDCC8",
    title: "Mid career",
    description:
      "4\u20136 years of experience. Growing expertise and taking on more responsibility.",
  },
  {
    id: "senior",
    emoji: "\u2B50",
    title: "Senior",
    description:
      "7+ years of experience. Deep expertise, possibly managing others.",
  },
  {
    id: "executive",
    emoji: "\uD83D\uDC54",
    title: "Executive / Leadership",
    description: "Leading teams, departments, or organizations.",
  },
];

// ---------------------------------------------------------------------------
// Career Challenges (verified against production career-challenges/page.tsx)
// ---------------------------------------------------------------------------

const CAREER_CHALLENGES: ChallengeCategory[] = [
  {
    label: "CLARITY",
    challenges: [
      { id: "dont-know-what-want", label: "Don't know what I want next" },
      {
        id: "dont-know-how-progress",
        label: "Don't know how to progress/improve",
      },
      {
        id: "questioning-right-path",
        label: "Questioning if I'm on the right path",
      },
    ],
  },
  {
    label: "EXECUTION",
    challenges: [
      {
        id: "procrastination",
        label: "Procrastination on important actions",
      },
      {
        id: "avoiding-conversations",
        label: "Avoiding difficult conversations or decisions",
      },
      { id: "starting-not-finishing", label: "Starting and not finishing" },
    ],
  },
  {
    label: "CONFIDENCE",
    challenges: [
      { id: "imposter-syndrome", label: "Imposter syndrome" },
      { id: "fear-rejection", label: "Fear of rejection" },
      {
        id: "difficulty-advocating",
        label: "Difficulty advocating for myself",
      },
    ],
  },
  {
    label: "EXTERNAL",
    challenges: [
      { id: "feeling-stuck", label: "Feeling stuck or plateaued" },
      {
        id: "isolated-lacking-support",
        label: "Isolated/lacking the right support",
      },
      {
        id: "job-draining-energy",
        label: "Current job draining my energy",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Side Hustle Goal (verified against production side-hustle-goal/page.tsx)
// ---------------------------------------------------------------------------

const SIDE_HUSTLE_OPTIONS = [
  {
    id: "growing",
    emoji: "\uD83D\uDCC8",
    title: "I'm trying to GROW it",
    description:
      "Building something bigger \u2014 want it to be a real business or major income source.",
  },
  {
    id: "maintaining",
    emoji: "\uD83D\uDCB5",
    title: "It's just extra income",
    description:
      "Happy keeping it simple \u2014 not trying to scale or build a business.",
  },
];

// ---------------------------------------------------------------------------
// Love/Partner Situation (verified against production love-partner-situation/page.tsx)
// ---------------------------------------------------------------------------

const LOVE_SITUATIONS = [
  {
    id: "strengthening",
    emoji: "\uD83D\uDC91",
    title: "Strengthening my relationship",
    description:
      "In a relationship and want to deepen connection or work through challenges together.",
  },
  {
    id: "finding",
    emoji: "\uD83D\uDC98",
    title: "Finding love",
    description:
      "Single and ready to meet someone \u2014 or figuring out what I really want in a partner.",
  },
  {
    id: "complicated",
    emoji: "\uD83D\uDC94",
    title: "It's complicated",
    description:
      "Navigating a breakup, divorce, or a situation that feels uncertain.",
  },
];

// ---------------------------------------------------------------------------
// Life Area Challenges — 10 data sets (verified against production)
// All use 3 categories (CLARITY, EXECUTION, MINDSET) with 3 items each = 9 per area
// ---------------------------------------------------------------------------

const HEALTH_CHALLENGES: ChallengeCategory[] = [
  { label: "CLARITY", challenges: [
    { id: "motivated-no-direction", label: "Motivated but don't know where to start" },
    { id: "unsure-what-works", label: "Unsure what workout, nutrition, or routine is right for me" },
    { id: "overwhelmed-options", label: "Overwhelmed by options and conflicting advice" },
  ]},
  { label: "EXECUTION", challenges: [
    { id: "too-busy-tired", label: "Too busy or too tired to take care of myself" },
    { id: "starting-falling-off", label: "Starting strong, then falling off" },
    { id: "prioritizing-others", label: "Putting everyone else's needs before my own" },
  ]},
  { label: "MINDSET", challenges: [
    { id: "self-doubt-change", label: "Self-doubt about my ability to actually change" },
    { id: "losing-motivation", label: "Losing motivation or giving up too quickly" },
    { id: "past-attempts-hard", label: "Past attempts or setbacks making it hard to try again" },
  ]},
];

const FINANCE_CHALLENGES: ChallengeCategory[] = [
  { label: "CLARITY", challenges: [
    { id: "dont-know-where-money-goes", label: "Don't know where my money is going" },
    { id: "unclear-priorities", label: "Unclear what to prioritize (save, pay off, invest?)" },
    { id: "no-clear-picture", label: "No clear picture of where I want to be financially" },
  ]},
  { label: "EXECUTION", challenges: [
    { id: "spending-impulsively", label: "Spending impulsively or outside my own rules" },
    { id: "avoiding-finances", label: "Avoiding looking at my finances" },
    { id: "avoiding-actions", label: "Avoiding actions that could improve my situation" },
  ]},
  { label: "MINDSET", challenges: [
    { id: "money-anxiety", label: "Anxiety or stress when thinking about money" },
    { id: "never-enough", label: 'Never feeling like I have "enough" (even when I should)' },
    { id: "money-relationship-tension", label: "Money causing tension in relationships" },
  ]},
];

const FAMILY_CHALLENGES: ChallengeCategory[] = [
  { label: "CLARITY", challenges: [
    { id: "unclear-needs", label: "Unclear on what I need from my family relationships" },
    { id: "dont-know-how-improve", label: "Don't know how to improve a specific dynamic" },
    { id: "confusion-role", label: "Confusion about my role or what's expected of me" },
  ]},
  { label: "EXECUTION", challenges: [
    { id: "not-enough-quality-time", label: "Not making enough quality time for family" },
    { id: "avoiding-conversations", label: "Avoiding difficult conversations or decisions" },
    { id: "struggling-boundaries", label: "Struggling to set or maintain boundaries" },
  ]},
  { label: "MINDSET", challenges: [
    { id: "guilt-not-present", label: "Guilt about not being present or doing enough" },
    { id: "resentment-tension", label: "Resentment or unresolved tension with family members" },
    { id: "carrying-more-share", label: "Feeling like I'm carrying more than my share" },
  ]},
];

const HOME_CHALLENGES: ChallengeCategory[] = [
  { label: "CLARITY", challenges: [
    { id: "unclear-what-want", label: "Unclear on what I actually want my home to feel like" },
    { id: "not-sure-improvements", label: "Not sure what improvements would actually make a difference" },
    { id: "weighing-move", label: "Weighing a move or major change \u2014 or in the middle of one" },
  ]},
  { label: "EXECUTION", challenges: [
    { id: "procrastinating-tasks", label: "Procrastinating on tasks or projects" },
    { id: "starting-not-finishing", label: "Starting projects but not finishing them" },
    { id: "clutter-building", label: "Letting clutter or disorganization build up" },
  ]},
  { label: "MINDSET", challenges: [
    { id: "overwhelmed-attention", label: "Overwhelmed by everything that needs attention" },
    { id: "guilt-shame-state", label: "Guilt or shame about the state of my home" },
    { id: "stress-money-resources", label: "Stress about money or resources" },
  ]},
];

const EDUCATION_CHALLENGES: ChallengeCategory[] = [
  { label: "CLARITY", challenges: [
    { id: "unsure-credential", label: "Unsure which credential, specialization, or focus area is the right fit" },
    { id: "deciding-how-deep", label: "Deciding how deep to go \u2014 or whether to change direction" },
    { id: "connect-to-goals", label: "Not sure how to connect what I'm learning to real-world goals" },
  ]},
  { label: "EXECUTION", challenges: [
    { id: "procrastinating-coursework", label: "Procrastinating on coursework or applications" },
    { id: "difficulty-focusing", label: "Difficulty focusing or retaining what I learn" },
    { id: "balance-priorities", label: "Struggling to balance education with other priorities" },
  ]},
  { label: "MINDSET", challenges: [
    { id: "burnout-motivation", label: "Burnout or losing motivation" },
    { id: "imposter-behind", label: "Imposter syndrome or feeling behind my peers" },
    { id: "stress-time-cost", label: "Stress about the time, cost, or opportunity tradeoff" },
  ]},
];

const SPIRITUALITY_CHALLENGES: ChallengeCategory[] = [
  { label: "CLARITY", challenges: [
    { id: "deepen-practice", label: "Wanting to deepen my practice but not sure how" },
    { id: "searching-meaning", label: "Searching for more meaning, purpose, or connection" },
    { id: "beliefs-not-fitting", label: "Beliefs or practices no longer fitting like they used to" },
  ]},
  { label: "EXECUTION", challenges: [
    { id: "maintaining-practice", label: "Difficulty maintaining a consistent practice" },
    { id: "not-making-time", label: "Not making time for reflection, prayer, or stillness" },
    { id: "knowing-not-doing", label: "Knowing what feeds me spiritually but not doing it" },
  ]},
  { label: "MINDSET", challenges: [
    { id: "feeling-disconnected", label: "Feeling disconnected from myself or something greater" },
    { id: "doubt-guilt", label: "Doubt or guilt around my beliefs or lack of practice" },
    { id: "spiritual-dryness", label: "Spiritual dryness \u2014 going through the motions without feeling it" },
  ]},
];

const MENTAL_EMOTIONAL_CHALLENGES: ChallengeCategory[] = [
  { label: "CLARITY", challenges: [
    { id: "not-sure-where-start", label: "Wanting to focus on personal growth but not sure where to start" },
    { id: "not-sure-whats-bothering", label: "Not sure what's actually bothering me" },
    { id: "struggling-understand-patterns", label: "Struggling to understand my own patterns or triggers" },
  ]},
  { label: "EXECUTION", challenges: [
    { id: "avoiding-what-helps", label: "Avoiding things that would actually help me" },
    { id: "not-prioritizing-health", label: "Not prioritizing my mental or emotional health" },
    { id: "difficulty-asking-help", label: "Difficulty asking for help or support" },
  ]},
  { label: "MINDSET", challenges: [
    { id: "negative-self-talk", label: "Stuck in negative self-talk or self-criticism" },
    { id: "anxiety-low-mood", label: "Carrying anxiety, stress, or low mood that won't lift" },
    { id: "emotionally-drained", label: "Feeling emotionally drained or burned out" },
  ]},
];

const LOVE_STRENGTHENING_CHALLENGES: ChallengeCategory[] = [
  { label: "CLARITY", challenges: [
    { id: "uncertain-direction", label: "Uncertain about where this relationship is going" },
    { id: "dont-know-needs", label: "Don't know what I actually need from my partner" },
    { id: "feeling-disconnected", label: "Feeling disconnected but not sure why" },
  ]},
  { label: "EXECUTION", challenges: [
    { id: "avoiding-conversations", label: "Avoiding difficult conversations" },
    { id: "not-enough-time", label: "Not making enough time for the relationship" },
    { id: "holding-back", label: "Holding back what I really think or feel" },
  ]},
  { label: "MINDSET", challenges: [
    { id: "resentment-past-hurts", label: "Resentment or past hurts affecting the present" },
    { id: "fear-vulnerable", label: "Fear of being vulnerable or getting hurt" },
    { id: "carrying-more-load", label: "Feeling like I'm carrying more of the load" },
  ]},
];

const LOVE_FINDING_CHALLENGES: ChallengeCategory[] = [
  { label: "CLARITY", challenges: [
    { id: "dont-know-looking-for", label: "Don't know what I'm really looking for" },
    { id: "unclear-ready", label: "Unclear if I'm actually ready for a relationship" },
    { id: "not-sure-where-meet", label: "Not sure where or how to meet the right people" },
  ]},
  { label: "EXECUTION", challenges: [
    { id: "not-putting-out-there", label: "Not putting myself out there enough" },
    { id: "struggling-pacing", label: "Struggling with pacing \u2014 moving too fast or getting impatient" },
    { id: "difficulty-expressing", label: "Difficulty expressing what I want or setting boundaries" },
  ]},
  { label: "MINDSET", challenges: [
    { id: "fear-rejection", label: "Fear of rejection or getting hurt again" },
    { id: "negative-beliefs-dating", label: "Negative beliefs about dating that keep me guarded or discouraged" },
    { id: "past-relationships-affecting", label: "Past relationships affecting how I show up" },
  ]},
];

const LOVE_COMPLICATED_CHALLENGES: ChallengeCategory[] = [
  { label: "CLARITY", challenges: [
    { id: "not-sure-what-want", label: "Not sure what I actually want" },
    { id: "confused-where-stand", label: "Confused about where things really stand" },
    { id: "dont-know-stay-go", label: "Don't know if I should stay or go" },
  ]},
  { label: "EXECUTION", challenges: [
    { id: "avoiding-decision", label: "Avoiding making a real decision" },
    { id: "not-communicating-needs", label: "Not communicating what I actually need" },
    { id: "staying-patterns", label: "Staying in patterns that aren't working" },
  ]},
  { label: "MINDSET", challenges: [
    { id: "fear-wrong-choice", label: "Fear of making the wrong choice" },
    { id: "guilt-obligation", label: "Guilt or obligation keeping me stuck" },
    { id: "drained-uncertainty", label: "Feeling drained by the uncertainty" },
  ]},
];

// Lookup table: focus area (+ love sub-situation) → challenge data set
const LIFE_AREA_CHALLENGES: Record<string, ChallengeCategory[]> = {
  "health": HEALTH_CHALLENGES,
  "finance": FINANCE_CHALLENGES,
  "family": FAMILY_CHALLENGES,
  "home": HOME_CHALLENGES,
  "education": EDUCATION_CHALLENGES,
  "spirituality": SPIRITUALITY_CHALLENGES,
  "personal-growth": MENTAL_EMOTIONAL_CHALLENGES,
  "love-strengthening": LOVE_STRENGTHENING_CHALLENGES,
  "love-finding": LOVE_FINDING_CHALLENGES,
  "love-complicated": LOVE_COMPLICATED_CHALLENGES,
};

// Focus area labels for challenge screen headings
const FOCUS_AREA_CHALLENGE_LABELS: Record<string, string> = {
  "health": "health and wellness",
  "finance": "personal finance",
  "family": "family",
  "home": "home",
  "education": "education",
  "spirituality": "spirituality",
  "personal-growth": "personal growth",
  "love-strengthening": "your relationship",
  "love-finding": "finding love",
  "love-complicated": "your love life",
};

// ---------------------------------------------------------------------------
// Chip toggle (multi-select — production double-ring style)
// ---------------------------------------------------------------------------

function Chip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex h-10 items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm text-[#1e1e1e] transition-all duration-150 ${
        selected
          ? "border-[#e6e5e3] shadow-[0px_0px_0px_2px_white,0px_0px_0px_4px_#1e1e1e]"
          : "border-[#e6e5e3] hover:border-[#c9c8c6]"
      }`}
    >
      {/* Inline checkbox */}
      <span
        className={`flex size-4 items-center justify-center rounded border transition-colors ${
          selected
            ? "border-[#1e1e1e] bg-[#1e1e1e]"
            : "border-[#e6e5e3] bg-white"
        }`}
      >
        {selected && <Check size={10} weight="bold" className="text-white" />}
      </span>
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Radio option (single-select — production border-2 style)
// ---------------------------------------------------------------------------

function RadioOption({
  label,
  emoji,
  tag,
  description,
  selected,
  onSelect,
}: {
  label: string;
  emoji?: string;
  tag?: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-2.5 rounded-lg border bg-white px-3 py-2 text-left text-[15px] text-[#1e1e1e] transition-all duration-150 ${
        selected
          ? "border-[#1e1e1e] border-2"
          : "border-[#e6e5e3] hover:border-[#c9c8c6]"
      }`}
    >
      {/* Custom radio circle */}
      <span
        className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected
            ? "border-[#1e1e1e] bg-[#1e1e1e]"
            : "border-[#d4d4d4] bg-white"
        }`}
      >
        {selected && <span className="size-1.5 rounded-full bg-white" />}
      </span>
      <div className="flex flex-col">
        <span className="text-[15px]">
          {emoji && <span className="mr-1.5">{emoji}</span>}
          {label}
          {tag && (
            <span className="ml-1.5 text-sm text-[#5f5e5b]">{tag}</span>
          )}
        </span>
        {description && (
          <span className="text-sm text-[#5f5e5b]">{description}</span>
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// TextareaScreen — reusable for business-description, business-focus, career-focus
// ---------------------------------------------------------------------------

function TextareaScreen({
  heading,
  subtitle,
  placeholder,
  maxChars,
  value,
  onChange,
}: {
  heading: React.ReactNode;
  subtitle: string;
  placeholder: string;
  maxChars: number;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-3 text-[#1e1e1e]">
        <h1 className="font-albra text-[28px] font-medium leading-8">
          {heading}
        </h1>
        <p className="text-sm leading-5 text-[#5f5e5b]">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-1">
        <textarea
          rows={5}
          maxLength={maxChars}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="resize-none rounded-lg border border-[#e6e5e3] bg-white px-4 py-3 text-sm text-[#1e1e1e] focus:border-[#6579EE] focus:outline-none focus:ring-1 focus:ring-[#6579EE]"
        />
        <p className="text-right text-sm text-[#a8a49c]">
          {value.length}/{maxChars}
        </p>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// GridCardScreen — for business-stage
// ---------------------------------------------------------------------------

function GridCardScreen({
  heading,
  subtitle,
  options,
  selectedId,
  onSelect,
}: {
  heading: React.ReactNode;
  subtitle: string;
  options: { id: string; icon?: React.ReactNode; title: string; description: string }[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-3 text-[#1e1e1e]">
        <h1 className="font-albra text-[28px] font-medium leading-8">
          {heading}
        </h1>
        <p className="text-sm leading-5 text-[#5f5e5b]">{subtitle}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt.id)}
            className={`flex flex-col items-center gap-2 rounded-lg border bg-white px-3 py-4 text-center transition-all duration-150 ${
              selectedId === opt.id
                ? "border-[#1e1e1e] border-2"
                : "border-[#e6e5e3] hover:border-[#c9c8c6]"
            }`}
          >
            {opt.icon && <span className="mb-1">{opt.icon}</span>}
            <span className="text-sm font-medium text-[#1e1e1e]">
              {opt.title}
            </span>
            <span className="text-xs text-[#5f5e5b]">{opt.description}</span>
          </button>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// CategorizedChipScreen — for business-challenges, career-challenges, life-challenges
// ---------------------------------------------------------------------------

interface ChallengeCategory {
  label: string;
  challenges: { id: string; label: string }[];
}

function CategorizedChipScreen({
  heading,
  subtitle,
  categories,
  selected,
  onToggle,
}: {
  heading: React.ReactNode;
  subtitle: string;
  categories: ChallengeCategory[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-3 text-[#1e1e1e]">
        <h1 className="font-albra text-[28px] font-medium leading-8">
          {heading}
        </h1>
        <p className="text-sm leading-5 text-[#5f5e5b]">{subtitle}</p>
      </div>
      <div className="flex flex-col gap-5">
        {categories.map((cat) => (
          <div key={cat.label} className="flex flex-col gap-2">
            <span
              className="text-sm font-semibold uppercase leading-5"
              style={{ color: "#4f5bb3" }}
            >
              {cat.label}:
            </span>
            <div className="flex flex-wrap gap-2">
              {cat.challenges.map((ch) => (
                <Chip
                  key={ch.id}
                  label={ch.label}
                  selected={selected.includes(ch.id)}
                  onToggle={() => onToggle(ch.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/** Selection counter hint for categorized chip screens */
function ChipSelectionHint({ count }: { count: number }) {
  return (
    <p
      className="text-sm"
      style={{ color: count === 0 ? "#8a6ee4" : "#a8a49c" }}
    >
      {count === 0
        ? "0 selected, please select 1 or more to continue."
        : `${count} selected`}
    </p>
  );
}

/** Selection hint for single-select screens (radio, grid cards) */
function SingleSelectionHint({ selected }: { selected: boolean }) {
  return (
    <p
      className="text-sm"
      style={{ color: selected ? "#a8a49c" : "#8a6ee4" }}
    >
      {selected ? "1 selected" : "Please select one to continue."}
    </p>
  );
}

// ---------------------------------------------------------------------------
// SingleSelectScreen — for career-situation, career-stage, side-hustle-goal, love-partner-situation
// ---------------------------------------------------------------------------

function SingleSelectScreen({
  heading,
  subtitle,
  options,
  selectedId,
  onSelect,
}: {
  heading: React.ReactNode;
  subtitle?: string;
  options: {
    id: string;
    emoji?: string;
    title: string;
    description: string;
  }[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-3 text-[#1e1e1e]">
        <h1 className="font-albra text-[28px] font-medium leading-8">
          {heading}
        </h1>
        {subtitle && (
          <p className="text-sm leading-5 text-[#5f5e5b]">{subtitle}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <RadioOption
            key={opt.id}
            emoji={opt.emoji}
            label={opt.title}
            description={opt.description}
            selected={selectedId === opt.id}
            onSelect={() => onSelect(opt.id)}
          />
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Branching state machine — Screen type + routing functions
// ---------------------------------------------------------------------------

type Screen =
  | "roles"
  | "side-hustle-goal"
  | "focus"
  // PATH A: Business Owner
  | "business-description"
  | "business-stage"
  | "business-focus"
  | "business-challenges"
  // PATH B: Career Professional
  | "career-situation"
  | "career-stage"
  | "career-focus"
  | "career-challenges"
  // PATH C: Life Area
  | "love-partner-situation"
  | "life-challenges"
  // All paths
  | "coaching-style";

function needsSideHustleGoal(roles: string[]): boolean {
  return (
    roles.includes("side-hustler") &&
    !roles.includes("founder") &&
    !roles.includes("freelancer")
  );
}

function isBizOwner(roles: string[], sideHustleGoal?: string): boolean {
  if (roles.includes("founder") || roles.includes("freelancer")) return true;
  if (roles.includes("side-hustler") && sideHustleGoal === "growing")
    return true;
  return false;
}

function getNextScreenAfterRoles(roles: string[]): Screen {
  if (needsSideHustleGoal(roles)) return "side-hustle-goal";
  return "focus";
}

function getNextScreenAfterFocus(
  focusArea: string,
  isBusinessOwner: boolean,
): Screen {
  if (isBusinessOwner) return "business-description";
  if (focusArea === "career-business") return "career-situation";
  if (focusArea === "love") return "love-partner-situation";
  return "life-challenges";
}

function getNextScreenAfterBusinessChallenges(focusArea: string): Screen {
  if (focusArea === "career-business") return "coaching-style";
  return "life-challenges"; // PATH A2 — biz owner + non-biz focus
}

function getExpectedTotal(
  roles: string[],
  sideHustleGoal: string,
  focusArea: string,
  isBusinessOwner: boolean,
): number {
  let count = 2; // roles + focus (always)
  if (needsSideHustleGoal(roles)) count++; // side-hustle-goal
  if (isBusinessOwner) count += 4; // business screens
  if (!isBusinessOwner && focusArea === "career-business") count += 4; // career screens
  if (!isBusinessOwner && focusArea === "love") count++; // love-partner-situation (only non-biz-owner path)
  // Life challenges: PATH C always, PATH A2 if biz owner + non-biz focus
  if (!isBusinessOwner && focusArea !== "career-business") count++; // life-challenges
  if (isBusinessOwner && focusArea !== "career-business") count++; // PATH A2 life-challenges
  count++; // coaching-style (always last)
  return count;
}

// ---------------------------------------------------------------------------
// OnboardingScreens
// ---------------------------------------------------------------------------

export function OnboardingScreens({ onComplete }: OnboardingScreensProps) {
  // --- Screen history stack (replaces linear index) ---
  const [screenHistory, setScreenHistory] = useState<Screen[]>(["roles"]);
  const currentScreen = screenHistory[screenHistory.length - 1];

  function advance(nextScreen: Screen) {
    setScreenHistory((prev) => [...prev, nextScreen]);
  }

  function goBack() {
    if (screenHistory.length > 1) {
      setScreenHistory((prev) => prev.slice(0, -1));
    }
  }

  // --- State for ALL screens ---
  const [roles, setRoles] = useState<string[]>([]);
  const [sideHustleGoal, setSideHustleGoal] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [coachingStyle, setCoachingStyle] = useState("");
  // Path A
  const [businessDescription, setBusinessDescription] = useState("");
  const [businessStage, setBusinessStage] = useState("");
  const [currentBusinessFocus, setCurrentBusinessFocus] = useState("");
  const [businessChallenges, setBusinessChallenges] = useState<string[]>([]);
  // Path B
  const [careerSituation, setCareerSituation] = useState("");
  const [careerStage, setCareerStage] = useState("");
  const [careerFocus, setCareerFocus] = useState("");
  const [careerChallenges, setCareerChallenges] = useState<string[]>([]);
  // Path C
  const [lovePartnerSituation, setLovePartnerSituation] = useState("");
  const [lifeChallenges, setLifeChallenges] = useState<string[]>([]);

  // Derived state
  const isBusinessOwner = isBizOwner(roles, sideHustleGoal);
  const totalScreens = getExpectedTotal(
    roles,
    sideHustleGoal,
    focusArea,
    isBusinessOwner,
  );
  const progress = Math.round((screenHistory.length / totalScreens) * 100);

  function toggleMulti(
    value: string,
    current: string[],
    setter: (v: string[]) => void,
  ) {
    setter(
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    );
  }

  // Resolve life-area challenge key (love uses sub-situation)
  function getLifeChallengeKey(): string {
    if (focusArea === "love" && lovePartnerSituation) {
      return `love-${lovePartnerSituation}`;
    }
    return focusArea;
  }

  // Skip life-challenges screen if no challenge data exists for the focus area.
  // This is a useEffect (not inline render) to avoid side effects during render.
  useEffect(() => {
    if (currentScreen === "life-challenges") {
      const challengeKey = getLifeChallengeKey();
      if (!LIFE_AREA_CHALLENGES[challengeKey]) {
        advance("coaching-style");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen, focusArea, lovePartnerSituation]);

  // Final assembly when coaching-style completes
  function handleComplete() {
    onComplete({
      roles,
      focus_area: focusArea,
      coaching_style: coachingStyle,
      is_business_owner: isBusinessOwner,
      side_hustle_goal: sideHustleGoal || undefined,
      love_partner_situation: lovePartnerSituation || undefined,
      business_description: businessDescription || undefined,
      business_stage: businessStage || undefined,
      current_business_focus: currentBusinessFocus || undefined,
      business_challenges:
        businessChallenges.length > 0 ? businessChallenges : undefined,
      career_situation: careerSituation || undefined,
      career_stage: careerStage || undefined,
      career_focus: careerFocus || undefined,
      career_challenges:
        careerChallenges.length > 0 ? careerChallenges : undefined,
      // Only include challenges from the path actually traversed
      declared_challenges: [
        ...(isBusinessOwner ? businessChallenges : []),
        ...(!isBusinessOwner && focusArea === "career-business" ? careerChallenges : []),
        ...lifeChallenges,
      ],
    });
  }

  // --- ROLES ---
  if (currentScreen === "roles") {
    return (
      <OnboardingLayout
        progress={progress}
        ctaLabel="Next"
        ctaEnabled={roles.length > 0}
        ctaHint={<ChipSelectionHint count={roles.length} />}
        onCta={() => advance(getNextScreenAfterRoles(roles))}
      >
        <div className="flex flex-col gap-3 text-[#1e1e1e]">
          <h1 className="font-albra text-[28px] font-medium leading-8">
            What <em className="font-medium italic">hats</em> do you wear in{" "}
            <em className="font-medium italic">life?</em>
          </h1>
          <p className="text-sm leading-5">
            Select all that apply. This helps me personalize your experience.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ROLE_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={roles.includes(opt.value)}
              onToggle={() => toggleMulti(opt.value, roles, setRoles)}
            />
          ))}
        </div>
      </OnboardingLayout>
    );
  }

  // --- SIDE HUSTLE GOAL (conditional) ---
  if (currentScreen === "side-hustle-goal") {
    return (
      <OnboardingLayout
        progress={progress}
        onBack={goBack}
        ctaLabel="Next"
        ctaEnabled={sideHustleGoal !== ""}
        ctaHint={<SingleSelectionHint selected={sideHustleGoal !== ""} />}
        onCta={() => advance("focus")}
      >
        <SingleSelectScreen
          heading={
            <>
              What&apos;s your goal with your{" "}
              <em className="font-medium italic">side hustle</em>?
            </>
          }
          options={SIDE_HUSTLE_OPTIONS}
          selectedId={sideHustleGoal}
          onSelect={setSideHustleGoal}
        />
      </OnboardingLayout>
    );
  }

  // --- FOCUS AREA ---
  if (currentScreen === "focus") {
    return (
      <OnboardingLayout
        progress={progress}
        onBack={goBack}
        ctaLabel="Next"
        ctaEnabled={focusArea !== ""}
        ctaHint={<SingleSelectionHint selected={focusArea !== ""} />}
        onCta={() => advance(getNextScreenAfterFocus(focusArea, isBusinessOwner))}
        contentGap="gap-8"
      >
        <div className="flex flex-col gap-3 text-[#1e1e1e]">
          <h1 className="font-albra text-[28px] leading-8">
            What <span className="font-medium">ONE</span>{" "}
            <em className="font-medium italic">area</em> of life would you like
            the biggest{" "}
            <em className="font-medium italic">breakthrough</em> in 3 months?
          </h1>
          <p className="text-base leading-6" style={{ color: "#6579EE" }}>
            Select the most impactful one. The{" "}
            <span className="font-bold">ONE</span> area that would make the{" "}
            <span className="underline">
              most impact on all other areas of your life.
            </span>
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {FOCUS_OPTIONS.map((opt) => (
            <RadioOption
              key={opt.id}
              label={`${opt.emoji}  ${opt.label}`}
              selected={focusArea === opt.id}
              onSelect={() => setFocusArea(opt.id)}
            />
          ))}
        </div>
      </OnboardingLayout>
    );
  }

  // --- PATH A: BUSINESS DESCRIPTION ---
  if (currentScreen === "business-description") {
    return (
      <OnboardingLayout
        progress={progress}
        onBack={goBack}
        ctaLabel="Next"
        ctaEnabled={businessDescription.trim().length > 0}
        onCta={() => advance("business-stage")}
      >
        <TextareaScreen
          heading={
            <>
              Tell me about your{" "}
              <em className="font-medium italic">business</em>.
            </>
          }
          subtitle="Just a quick sentence—what do you do or what are you building?"
          placeholder="Example: I'm a career coach for mid-career professionals, I'm building a SaaS tool for freelancers, I run a content agency for B2B SaaS companies"
          maxChars={500}
          value={businessDescription}
          onChange={setBusinessDescription}
        />
      </OnboardingLayout>
    );
  }

  // --- PATH A: BUSINESS STAGE ---
  if (currentScreen === "business-stage") {
    return (
      <OnboardingLayout
        progress={progress}
        onBack={goBack}
        ctaLabel="Next"
        ctaEnabled={businessStage !== ""}
        ctaHint={<SingleSelectionHint selected={businessStage !== ""} />}
        onCta={() => advance("business-focus")}
      >
        <GridCardScreen
          heading={
            <>
              What <em className="font-medium italic">stage</em> is your{" "}
              <em className="font-medium italic">business</em> in?
            </>
          }
          subtitle="This helps me understand where you are in your journey."
          options={BUSINESS_STAGES}
          selectedId={businessStage}
          onSelect={setBusinessStage}
        />
      </OnboardingLayout>
    );
  }

  // --- PATH A: BUSINESS FOCUS ---
  if (currentScreen === "business-focus") {
    return (
      <OnboardingLayout
        progress={progress}
        onBack={goBack}
        ctaLabel="Next"
        ctaEnabled={currentBusinessFocus.trim().length > 0}
        onCta={() => advance("business-challenges")}
      >
        <TextareaScreen
          heading={
            <>
              What is your primary{" "}
              <em className="font-medium italic">focus</em> in your{" "}
              <em className="font-medium italic">business</em> right now?
            </>
          }
          subtitle="What are you actively working on this quarter?"
          placeholder={"Example:\n- Launching my first consulting/services program and getting 10 clients\n- Growing my revenue from $5K to $15K/month\n- Hiring a team member"}
          maxChars={600}
          value={currentBusinessFocus}
          onChange={setCurrentBusinessFocus}
        />
      </OnboardingLayout>
    );
  }

  // --- PATH A: BUSINESS CHALLENGES ---
  if (currentScreen === "business-challenges") {
    return (
      <OnboardingLayout
        progress={progress}
        onBack={goBack}
        ctaLabel="Next"
        ctaEnabled={businessChallenges.length > 0}
        ctaHint={<ChipSelectionHint count={businessChallenges.length} />}
        onCta={() =>
          advance(getNextScreenAfterBusinessChallenges(focusArea))
        }
      >
        <CategorizedChipScreen
          heading={
            <>
              What are your biggest{" "}
              <em className="font-medium italic">challenges</em> when making
              progress in your{" "}
              <em className="font-medium italic">business</em> right now?
            </>
          }
          subtitle="Select all that apply."
          categories={BUSINESS_CHALLENGES}
          selected={businessChallenges}
          onToggle={(id) =>
            toggleMulti(id, businessChallenges, setBusinessChallenges)
          }
        />
      </OnboardingLayout>
    );
  }

  // --- PATH B: CAREER SITUATION ---
  if (currentScreen === "career-situation") {
    return (
      <OnboardingLayout
        progress={progress}
        onBack={goBack}
        ctaLabel="Next"
        ctaEnabled={careerSituation !== ""}
        ctaHint={<SingleSelectionHint selected={careerSituation !== ""} />}
        onCta={() => advance("career-stage")}
      >
        <SingleSelectScreen
          heading={
            <>
              What&apos;s your{" "}
              <em className="font-medium italic">career situation</em> right
              now?
            </>
          }
          subtitle="This helps me understand what type of support you need."
          options={CAREER_SITUATIONS}
          selectedId={careerSituation}
          onSelect={setCareerSituation}
        />
      </OnboardingLayout>
    );
  }

  // --- PATH B: CAREER STAGE ---
  if (currentScreen === "career-stage") {
    return (
      <OnboardingLayout
        progress={progress}
        onBack={goBack}
        ctaLabel="Next"
        ctaEnabled={careerStage !== ""}
        ctaHint={<SingleSelectionHint selected={careerStage !== ""} />}
        onCta={() => advance("career-focus")}
      >
        <SingleSelectScreen
          heading={
            <>
              What <em className="font-medium italic">stage</em> is your{" "}
              <em className="font-medium italic">career</em> right now?
            </>
          }
          subtitle="This helps me calibrate my guidance to your experience level."
          options={CAREER_STAGES}
          selectedId={careerStage}
          onSelect={setCareerStage}
        />
      </OnboardingLayout>
    );
  }

  // --- PATH B: CAREER FOCUS ---
  if (currentScreen === "career-focus") {
    return (
      <OnboardingLayout
        progress={progress}
        onBack={goBack}
        ctaLabel="Next"
        ctaEnabled={careerFocus.trim().length > 0}
        onCta={() => advance("career-challenges")}
      >
        <TextareaScreen
          heading={
            <>
              What&apos;s your current{" "}
              <em className="font-medium italic">career focus</em>?
            </>
          }
          subtitle="What are you actively working toward this quarter in your career?"
          placeholder={'Example: "Getting promoted to team lead in 3-6 months", "Landing a senior product manager role at a tech company", "Transitioning from marketing to UX design", "Finding a remote job"'}
          maxChars={200}
          value={careerFocus}
          onChange={setCareerFocus}
        />
      </OnboardingLayout>
    );
  }

  // --- PATH B: CAREER CHALLENGES ---
  if (currentScreen === "career-challenges") {
    return (
      <OnboardingLayout
        progress={progress}
        onBack={goBack}
        ctaLabel="Next"
        ctaEnabled={careerChallenges.length > 0}
        ctaHint={<ChipSelectionHint count={careerChallenges.length} />}
        onCta={() => advance("coaching-style")}
      >
        <CategorizedChipScreen
          heading={
            <>
              What <em className="font-medium italic">challenges</em> do you
              experience in your{" "}
              <em className="font-medium italic">career</em>?
            </>
          }
          subtitle="Select all that apply."
          categories={CAREER_CHALLENGES}
          selected={careerChallenges}
          onToggle={(id) =>
            toggleMulti(id, careerChallenges, setCareerChallenges)
          }
        />
      </OnboardingLayout>
    );
  }

  // --- PATH C: LOVE/PARTNER SITUATION (conditional: focus === 'love') ---
  if (currentScreen === "love-partner-situation") {
    return (
      <OnboardingLayout
        progress={progress}
        onBack={goBack}
        ctaLabel="Next"
        ctaEnabled={lovePartnerSituation !== ""}
        ctaHint={<SingleSelectionHint selected={lovePartnerSituation !== ""} />}
        onCta={() => advance("life-challenges")}
      >
        <SingleSelectScreen
          heading={
            <>
              What&apos;s your{" "}
              <em className="font-medium italic">
                love/partner situation
              </em>{" "}
              right now?
            </>
          }
          subtitle="This helps me understand what type of support you need."
          options={LOVE_SITUATIONS}
          selectedId={lovePartnerSituation}
          onSelect={setLovePartnerSituation}
        />
      </OnboardingLayout>
    );
  }

  // --- PATH C (+ A2): LIFE AREA CHALLENGES ---
  if (currentScreen === "life-challenges") {
    const challengeKey = getLifeChallengeKey();
    const challengeData = LIFE_AREA_CHALLENGES[challengeKey];
    const areaLabel =
      FOCUS_AREA_CHALLENGE_LABELS[challengeKey] || focusArea;

    if (!challengeData) {
      // No challenge data for this focus area — skip to coaching-style.
      // Navigation is deferred to useEffect to avoid side effects during render.
      return null;
    }

    return (
      <OnboardingLayout
        progress={progress}
        onBack={goBack}
        ctaLabel="Next"
        ctaEnabled={lifeChallenges.length > 0}
        ctaHint={<ChipSelectionHint count={lifeChallenges.length} />}
        onCta={() => advance("coaching-style")}
      >
        <CategorizedChipScreen
          heading={
            <>
              What <em className="font-medium italic">challenges</em> come
              up in <em className="font-medium italic">{areaLabel}</em>?
            </>
          }
          subtitle="Select all that apply."
          categories={challengeData}
          selected={lifeChallenges}
          onToggle={(id) =>
            toggleMulti(id, lifeChallenges, setLifeChallenges)
          }
        />
      </OnboardingLayout>
    );
  }

  // --- COACHING STYLE (all paths — always last) ---
  return (
    <OnboardingLayout
      progress={100}
      onBack={goBack}
      ctaLabel="Next"
      ctaEnabled={coachingStyle !== ""}
      ctaHint={<p className="text-sm" style={{ color: "#7a90da" }}>You can update this in your settings anytime.</p>}
      onCta={handleComplete}
    >
      <div className="flex flex-col gap-3 text-[#1e1e1e]">
        <h1 className="font-albra text-[28px] font-medium leading-8">
          One last thing—how do you like to be{" "}
          <em className="font-medium italic">guided</em>?
        </h1>
        <p className="text-sm leading-5 text-[#5f5e5b]">
          I&apos;ll adjust my communication style to what works best for you.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {COACHING_STYLES.map((opt) => (
          <RadioOption
            key={opt.id}
            emoji={opt.emoji}
            label={opt.title}
            tag={opt.tag}
            description={opt.description}
            selected={coachingStyle === opt.id}
            onSelect={() => setCoachingStyle(opt.id)}
          />
        ))}
      </div>

    </OnboardingLayout>
  );
}
