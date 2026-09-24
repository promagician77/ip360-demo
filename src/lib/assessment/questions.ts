/**
 * PairKnow™ assessment question bank.
 *
 * The bank is versioned. A profile always records which bank version produced it so
 * future revisions of the questions never silently change historical results.
 */

export const ASSESSMENT_VERSION = "1.0.0";

export type DimensionKey =
  | "values"
  | "emotional"
  | "lifestyle"
  | "communication"
  | "goals"
  | "intimacy";

export const DIMENSION_KEYS: DimensionKey[] = [
  "values",
  "emotional",
  "lifestyle",
  "communication",
  "goals",
  "intimacy",
];

export interface DimensionMeta {
  key: DimensionKey;
  label: string;
  shortLabel: string;
  description: string;
  /** How this dimension is compared during matching. */
  comparison: "similarity" | "blended";
}

export const DIMENSIONS: Record<DimensionKey, DimensionMeta> = {
  values: {
    key: "values",
    label: "Core Values",
    shortLabel: "Values",
    description: "What you consider most important: family, honesty, ambition, tradition and community.",
    comparison: "similarity",
  },
  emotional: {
    key: "emotional",
    label: "Emotional Style",
    shortLabel: "Emotional",
    description: "How you trust, depend on and stay steady with a partner.",
    comparison: "blended",
  },
  lifestyle: {
    key: "lifestyle",
    label: "Lifestyle Rhythm",
    shortLabel: "Lifestyle",
    description: "Your energy, routines, activity level and how you like to spend time.",
    comparison: "similarity",
  },
  communication: {
    key: "communication",
    label: "Communication",
    shortLabel: "Communication",
    description: "How you express yourself, listen, and repair after conflict.",
    comparison: "blended",
  },
  goals: {
    key: "goals",
    label: "Life Direction",
    shortLabel: "Goals",
    description: "Commitment, children, career and where you see your life going.",
    comparison: "similarity",
  },
  intimacy: {
    key: "intimacy",
    label: "Connection & Affection",
    shortLabel: "Connection",
    description: "How you give and receive closeness, affection and space.",
    comparison: "similarity",
  },
};

/** A 1–5 agreement item. `reverse` flips the scale before scoring. */
export interface LikertQuestion {
  id: string;
  type: "likert";
  dimension: DimensionKey;
  text: string;
  reverse?: boolean;
  /** Optional facet used for trait derivation (e.g. attachment style). */
  facet?: string;
}

export interface ChoiceOption {
  value: string;
  label: string;
  description?: string;
}

export interface ChoiceQuestion {
  id: string;
  type: "choice";
  section: "about" | "intent" | "lifestyle" | "preferences";
  text: string;
  help?: string;
  options: ChoiceOption[];
}

export interface MultiChoiceQuestion {
  id: string;
  type: "multi";
  section: "about" | "intent" | "lifestyle" | "preferences";
  text: string;
  help?: string;
  options: ChoiceOption[];
  min?: number;
}

export interface ScaleQuestion {
  id: string;
  type: "scale";
  section: "about" | "intent" | "lifestyle" | "preferences";
  text: string;
  help?: string;
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
}

export interface NumberQuestion {
  id: string;
  type: "number";
  section: "about" | "intent" | "lifestyle" | "preferences";
  text: string;
  help?: string;
  min: number;
  max: number;
  unit?: string;
}

export interface TextQuestion {
  id: string;
  type: "text";
  section: "about" | "intent" | "lifestyle" | "preferences";
  text: string;
  help?: string;
  maxLength: number;
  optional?: boolean;
}

export type Question =
  | LikertQuestion
  | ChoiceQuestion
  | MultiChoiceQuestion
  | ScaleQuestion
  | NumberQuestion
  | TextQuestion;

export const LIKERT_LABELS: Record<number, string> = {
  1: "Strongly disagree",
  2: "Disagree",
  3: "Neutral",
  4: "Agree",
  5: "Strongly agree",
};

/* -------------------------------------------------------------------------- */
/*  Likert items (30)                                                          */
/* -------------------------------------------------------------------------- */

export const LIKERT_QUESTIONS: LikertQuestion[] = [
  // Core Values
  { id: "v1", type: "likert", dimension: "values", text: "Family is one of the most important parts of my life." },
  { id: "v2", type: "likert", dimension: "values", text: "I would rather be honest than comfortable, even when the truth is hard." },
  { id: "v3", type: "likert", dimension: "values", text: "Ambition and personal growth matter a great deal to me." },
  { id: "v4", type: "likert", dimension: "values", text: "I value traditions and rituals, like holidays and family customs." },
  { id: "v5", type: "likert", dimension: "values", text: "Giving back to my community is important to me." },

  // Emotional Style
  { id: "e1", type: "likert", dimension: "emotional", facet: "secure", text: "I find it easy to trust a partner." },
  { id: "e2", type: "likert", dimension: "emotional", facet: "anxious", reverse: true, text: "I often worry that a partner might lose interest in me." },
  { id: "e3", type: "likert", dimension: "emotional", facet: "secure", text: "I'm comfortable depending on a partner and having them depend on me." },
  { id: "e4", type: "likert", dimension: "emotional", facet: "avoidant", reverse: true, text: "When I'm upset, I prefer to keep my feelings to myself." },
  { id: "e5", type: "likert", dimension: "emotional", facet: "secure", text: "I can stay calm and talk things through during a disagreement." },

  // Lifestyle Rhythm
  { id: "l1", type: "likert", dimension: "lifestyle", facet: "extrovert", text: "I feel most energized when I'm around other people." },
  { id: "l2", type: "likert", dimension: "lifestyle", facet: "structured", text: "I like having a routine and knowing what to expect each week." },
  { id: "l3", type: "likert", dimension: "lifestyle", facet: "active", text: "I'm physically active most days of the week." },
  { id: "l4", type: "likert", dimension: "lifestyle", facet: "flexible", reverse: true, text: "My perfect weekend is spontaneous and unplanned." },
  { id: "l5", type: "likert", dimension: "lifestyle", facet: "introvert", reverse: true, text: "I prefer quiet nights at home to going out." },

  // Communication
  { id: "c1", type: "likert", dimension: "communication", facet: "direct", text: "I say what I mean directly, even if it's uncomfortable." },
  { id: "c2", type: "likert", dimension: "communication", facet: "listening", text: "When my partner is talking, I focus on understanding before responding." },
  { id: "c3", type: "likert", dimension: "communication", facet: "humor", text: "I use humor to lighten tense moments." },
  { id: "c4", type: "likert", dimension: "communication", facet: "repair", text: "After an argument, I make an effort to repair things quickly." },
  { id: "c5", type: "likert", dimension: "communication", facet: "avoidance", reverse: true, text: "I'd rather avoid a difficult conversation than start one." },

  // Life Direction
  { id: "g1", type: "likert", dimension: "goals", text: "I want a lifelong committed partnership within the next few years." },
  { id: "g2", type: "likert", dimension: "goals", text: "Raising children is part of the life I picture for myself." },
  { id: "g3", type: "likert", dimension: "goals", text: "I'm willing to make career sacrifices for my relationship." },
  { id: "g4", type: "likert", dimension: "goals", text: "I have a clear picture of where I want to live long-term." },
  { id: "g5", type: "likert", dimension: "goals", text: "Financial stability is a top priority before settling down." },

  // Connection & Affection
  { id: "i1", type: "likert", dimension: "intimacy", facet: "physical", text: "Daily physical affection, like hugs and holding hands, is important to me." },
  { id: "i2", type: "likert", dimension: "intimacy", facet: "quality_time", text: "Quality one-on-one time is how I feel most loved." },
  { id: "i3", type: "likert", dimension: "intimacy", facet: "independence", reverse: true, text: "I need a lot of independence and personal space in a relationship." },
  { id: "i4", type: "likert", dimension: "intimacy", facet: "openness", text: "I'm comfortable talking openly about intimacy with a partner." },
  { id: "i5", type: "likert", dimension: "intimacy", facet: "gestures", text: "Small daily gestures mean more to me than grand romantic ones." },
];

/* -------------------------------------------------------------------------- */
/*  Structured items                                                           */
/* -------------------------------------------------------------------------- */

export const GENDER_OPTIONS: ChoiceOption[] = [
  { value: "woman", label: "Woman" },
  { value: "man", label: "Man" },
  { value: "nonbinary", label: "Non-binary" },
];

export const STRUCTURED_QUESTIONS: Exclude<Question, LikertQuestion>[] = [
  // About you
  { id: "displayName", type: "text", section: "about", text: "What should we call you?", maxLength: 40 },
  { id: "age", type: "number", section: "about", text: "How old are you?", min: 18, max: 99, unit: "years" },
  { id: "gender", type: "choice", section: "about", text: "How do you identify?", options: GENDER_OPTIONS },
  { id: "city", type: "text", section: "about", text: "Which city do you live in?", maxLength: 60 },
  { id: "bio", type: "text", section: "about", text: "In one sentence, what makes you feel most alive?", maxLength: 160, optional: true },

  // Intent
  {
    id: "intent",
    type: "choice",
    section: "intent",
    text: "What are you looking for right now?",
    options: [
      { value: "marriage", label: "Marriage", description: "I'm ready for a lifelong commitment." },
      { value: "long_term", label: "Long-term relationship", description: "Serious and committed, open to where it leads." },
      { value: "exploring", label: "Exploring", description: "Getting to know people without a fixed timeline." },
    ],
  },
  {
    id: "children",
    type: "choice",
    section: "intent",
    text: "How do you feel about having children?",
    options: [
      { value: "want", label: "I want children" },
      { value: "open", label: "I'm open either way" },
      { value: "dont_want", label: "I don't want children" },
      { value: "have_want_more", label: "I have children and want more" },
      { value: "have_done", label: "I have children and don't want more" },
    ],
  },
  {
    id: "relocation",
    type: "choice",
    section: "intent",
    text: "Would you relocate for the right relationship?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "maybe", label: "Maybe" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "faithImportance",
    type: "scale",
    section: "intent",
    text: "How important is faith or spirituality in your life?",
    min: 1,
    max: 5,
    minLabel: "Not at all",
    maxLabel: "Central to my life",
  },

  // Lifestyle habits
  {
    id: "smoking",
    type: "choice",
    section: "lifestyle",
    text: "Do you smoke?",
    options: [
      { value: "never", label: "Never" },
      { value: "socially", label: "Socially" },
      { value: "regularly", label: "Regularly" },
    ],
  },
  {
    id: "drinking",
    type: "choice",
    section: "lifestyle",
    text: "Do you drink alcohol?",
    options: [
      { value: "never", label: "Never" },
      { value: "socially", label: "Socially" },
      { value: "regularly", label: "Regularly" },
    ],
  },

  // Preferences
  { id: "seeking", type: "multi", section: "preferences", text: "Who would you like to meet?", options: GENDER_OPTIONS, min: 1 },
  { id: "ageMin", type: "number", section: "preferences", text: "Youngest age you'd consider", min: 18, max: 99 },
  { id: "ageMax", type: "number", section: "preferences", text: "Oldest age you'd consider", min: 18, max: 99 },
  { id: "maxDistanceKm", type: "number", section: "preferences", text: "How far are you willing to match?", min: 5, max: 5000, unit: "km" },
  {
    id: "dealbreakers",
    type: "multi",
    section: "preferences",
    text: "Which of these are absolute dealbreakers for you?",
    help: "A dealbreaker removes a match entirely, no matter how compatible you are elsewhere.",
    options: [
      { value: "smoker", label: "Regular smoker" },
      { value: "heavy_drinker", label: "Drinks regularly" },
      { value: "kids_mismatch", label: "Undecided or mismatched on children" },
      { value: "faith_mismatch", label: "Very different importance of faith" },
      { value: "different_intent", label: "Looking for something different than me" },
    ],
  },
];

/** Importance weight questions: one per dimension. */
export const WEIGHT_OPTIONS: ChoiceOption[] = [
  { value: "1", label: "Nice to have" },
  { value: "2", label: "Important" },
  { value: "3", label: "Essential" },
];

export const ALL_QUESTIONS: Question[] = [...STRUCTURED_QUESTIONS, ...LIKERT_QUESTIONS];

export function likertByDimension(key: DimensionKey): LikertQuestion[] {
  return LIKERT_QUESTIONS.filter((q) => q.dimension === key);
}

export function questionById(id: string): Question | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id);
}
