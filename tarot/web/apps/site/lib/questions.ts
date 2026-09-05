import type { Card } from "@arcana/core"

/** The questions people actually type.
 *
 * The rest of the site is organised in the deck's language -- by card, by
 * suit, by spread. Nobody searches that way. They search "does he still have
 * feelings for me" and "should I quit my job", and those two vocabularies
 * barely overlap.
 *
 * Each entry binds one question to one spread and carries copy written for
 * that situation specifically. A template with the words swapped is what
 * every other tarot site already publishes, and it is why they read as
 * interchangeable.
 *
 * `honest` is not a disclaimer bolted on. It is the paragraph that separates
 * this from the sites promising to tell you what he is thinking, and it is
 * also what keeps the page inside §5 UWG: no claim of foresight, no promise
 * about another person's mind.
 */

export interface Question {
  slug: string
  /** As it would be typed into a search box. */
  title: string
  /** The <h1>. Often the same, sometimes gentler. */
  heading: string
  area: "love" | "career" | "money" | "self" | "people"
  spread: string
  /** What the visitor is actually asking underneath the question asked. */
  intro: string
  /** What the reading can address. */
  reframe: string
  /** What it cannot, said plainly. */
  honest: string
  /** Shown under the drawn cards, before the reading. */
  lens: string
  /** Suggest a person when the question is heavy enough to deserve one. */
  human?: boolean
}

export const AREAS: Record<Question["area"], { label: string; note: string }> = {
  love: {
    label: "Love and relationships",
    note: "The questions that arrive at two in the morning.",
  },
  career: {
    label: "Work and direction",
    note: "Usually a decision wearing the clothes of a job.",
  },
  money: {
    label: "Money",
    note: "Rarely about the amount.",
  },
  self: {
    label: "Yourself",
    note: "The ones with no other person in them.",
  },
  people: {
    label: "Family and friends",
    note: "The relationships you did not choose, and the ones you did.",
  },
}

export const QUESTIONS: Question[] = [
  // --- love -----------------------------------------------------------------
  {
    slug: "does-he-still-have-feelings",
    title: "Does he still have feelings for me?",
    heading: "Does he still have feelings for me?",
    area: "love",
    spread: "relationship",
    intro:
      "This is the most-asked question in tarot and the one most sites answer " +
      "dishonestly. A card cannot report what is happening inside another " +
      "person's head. Anyone telling you otherwise is selling the certainty, " +
      "not the reading.",
    reframe:
      "What a spread can describe is the space between you — what is being held " +
      "back on each side, what the silence is doing, and whether the situation " +
      "is still moving or has settled. That is usually the information you are " +
      "after anyway: not the feeling, but what to do about not knowing.",
    honest:
      "No reading knows his mind. If the answer matters enough that you are here, " +
      "it probably matters enough to ask him.",
    lens:
      "Read the middle position first. It is the one describing the gap, and the " +
      "gap is the subject.",
  },
  {
    slug: "will-we-get-back-together",
    title: "Will we get back together?",
    heading: "Is there a way back?",
    area: "love",
    spread: "situation",
    intro:
      "Two different questions live inside this one: whether reconciliation is " +
      "possible, and whether it is what you want. They are easy to confuse when " +
      "you miss someone.",
    reframe:
      "The spread reads the situation you are in now — what is still live between " +
      "you, what closed, and what the leverage actually is. It answers the second " +
      "question far better than the first.",
    honest:
      "Nothing here predicts a reunion. A reading that promised one would be " +
      "telling you what you came to hear, which is the opposite of useful.",
    lens:
      "If the outcome position is a minor arcana, the situation is still in your " +
      "hands. A major there says the forces are larger than the decision.",
    human: true,
  },
  {
    slug: "should-i-reach-out-first",
    title: "Should I text him first?",
    heading: "Should I reach out first?",
    area: "love",
    spread: "three-card",
    intro:
      "The question is rarely whether to send the message. It is what sending it " +
      "would cost you if nothing came back.",
    reframe:
      "Past, present and future here read as: what formed the silence, where you " +
      "stand in it now, and where the current course leads if neither of you moves.",
    honest:
      "The cards have no opinion on whether he will reply. They can show you what " +
      "you are protecting by not sending it.",
    lens:
      "Watch the present card. Reaching out from the position it describes is a " +
      "different act than reaching out from somewhere else.",
  },
  {
    slug: "is-this-going-anywhere",
    title: "Is this relationship going anywhere?",
    heading: "Is this going anywhere?",
    area: "love",
    spread: "situation",
    intro:
      "Asked early, when there is enough to hope on and not enough to decide on. " +
      "The discomfort is the uncertainty, not the relationship.",
    reframe:
      "Situation, action, outcome — which is to say: what this actually is right " +
      "now, what you could do about it, and where the present course arrives if " +
      "you do nothing. The middle card is the useful one.",
    honest:
      "A reading cannot see six months out. It can tell you whether you are " +
      "waiting for information or waiting for permission.",
    lens:
      "If the action card is passive, that is worth noticing. It often means the " +
      "next move genuinely is not yours.",
  },
  {
    slug: "am-i-being-strung-along",
    title: "Am I being strung along?",
    heading: "Am I being strung along?",
    area: "love",
    spread: "relationship",
    intro:
      "You are asking because some part of you has already answered. People " +
      "rarely arrive at this question by accident.",
    reframe:
      "The spread reads both sides and the space between. What it is good at here " +
      "is separating what the other person is doing from what you are supplying " +
      "on their behalf — the gap those two leave is where the answer sits.",
    honest:
      "This is not a lie detector. It cannot tell you their intent, and intent " +
      "matters less than the pattern you can already describe.",
    lens:
      "Reversals in the other person's positions are worth reading slowly. They " +
      "usually describe something withheld rather than something absent.",
  },
  {
    slug: "should-i-end-it",
    title: "Should I end this relationship?",
    heading: "Should I end it?",
    area: "love",
    spread: "celtic-cross",
    intro:
      "Ten cards, because this one has layers: what is on the surface, what is " +
      "under it, what you are afraid of, and what you actually want. A three-card " +
      "answer to this question would be glib.",
    reframe:
      "The Celtic Cross separates the situation from your reading of it, and both " +
      "from what the people around you are contributing. Those three are usually " +
      "tangled by the time someone asks this.",
    honest:
      "Nobody should end a relationship because of a card. If the spread says " +
      "something you already knew, that is the entire value of it.",
    lens:
      "Read Hopes & Fears against Outcome. When those two disagree, the disagreement " +
      "is the reading.",
    human: true,
  },

  // --- career ---------------------------------------------------------------
  {
    slug: "should-i-quit-my-job",
    title: "Should I quit my job?",
    heading: "Should I quit my job?",
    area: "career",
    spread: "situation",
    intro:
      "Almost never a question about the job. It is about what staying is costing " +
      "and what leaving would prove.",
    reframe:
      "Situation, action, outcome. The action card is the one to sit with — it " +
      "usually describes something available to you that is not resigning.",
    honest:
      "No reading knows your finances, your notice period or your market. Treat " +
      "this as a way of naming the thing you have not named, not as advice.",
    lens:
      "If the situation card is a major arcana, the pressure is structural and " +
      "changing employer may reproduce it.",
  },
  {
    slug: "will-i-get-the-job",
    title: "Will I get the job?",
    heading: "Will I get this job?",
    area: "career",
    spread: "yes-no",
    intro:
      "One card, and the honest version of a yes-or-no: the lean, the reasoning, " +
      "and where the card refuses to commit.",
    reframe:
      "What a single card can carry is a direction. It says how much room the " +
      "situation has, which is the part a yes-or-no question usually leaves out.",
    honest:
      "This does not know the hiring panel. Read it before the interview rather " +
      "than after, when it can still change what you prepare.",
    lens:
      "Reversed, a yes softens to a maybe. That is not a hedge — it means the room " +
      "is there but something has to move first.",
  },
  {
    slug: "am-i-in-the-wrong-career",
    title: "Am I in the wrong career?",
    heading: "Am I in the wrong career?",
    area: "career",
    spread: "celtic-cross",
    intro:
      "A large question that people usually ask in a small moment — a bad quarter, " +
      "a colleague's promotion. Ten cards, so the moment and the pattern can be " +
      "told apart.",
    reframe:
      "The spread's value here is the Root and the Past: what built this, and what " +
      "is already passing out of it. A career doubt that is three months old reads " +
      "very differently from one that is nine years old.",
    honest:
      "Nothing here can assess your skills or your market. It can show you whether " +
      "the dissatisfaction is about the work or about something the work is " +
      "standing in for.",
    lens:
      "Count the majors. A spread heavy with them says the question is about " +
      "direction; a spread of minors says it is about conditions, which are easier " +
      "to change.",
    human: true,
  },
  {
    slug: "should-i-ask-for-a-raise",
    title: "Should I ask for a raise?",
    heading: "Should I ask for more money?",
    area: "career",
    spread: "three-card",
    intro:
      "The hesitation is almost never about whether you deserve it. It is about " +
      "what asking would reveal about how you are seen.",
    reframe:
      "Past, present, future: what set the current number, where the relationship " +
      "with your employer actually stands, and where it goes if you say nothing.",
    honest:
      "The cards do not know your company's budget. Do the market research " +
      "separately — this is for the part of the decision research does not touch.",
    lens:
      "The future card here describes the cost of silence, not the outcome of " +
      "asking. Those are different pictures.",
  },

  // --- money ----------------------------------------------------------------
  {
    slug: "why-am-i-always-broke",
    title: "Why am I always broke?",
    heading: "Why does money never stay?",
    area: "money",
    spread: "celtic-cross",
    intro:
      "A pattern question, not an arithmetic one. If it were arithmetic you would " +
      "have solved it with a spreadsheet.",
    reframe:
      "The spread reads what money is doing for you beyond paying for things — " +
      "standing in for safety, for proof, or for a decision you are not making. " +
      "The Root position is the one that matters here.",
    honest:
      "This is not financial advice and cannot be. If you are in real trouble, a " +
      "debt advice service will help you more than any reading. In Germany, " +
      "Schuldnerberatung is free.",
    lens:
      "Pentacles reversed across a spread rarely mean poverty. They usually " +
      "describe value leaking somewhere you are not looking.",
  },
  {
    slug: "should-i-take-the-risk",
    title: "Should I take this financial risk?",
    heading: "Should I take the risk?",
    area: "money",
    spread: "situation",
    intro:
      "Whatever the amount, the question is the same: can you survive the version " +
      "where it does not work.",
    reframe:
      "Situation, action, outcome, read against a decision you can still reverse. " +
      "The reading is about your relationship to the risk, not about the return.",
    honest:
      "No card knows a market, a business plan or an interest rate. Nothing here " +
      "forecasts a return, and any site that offers to is one you should leave.",
    lens:
      "If the outcome card is reversed, read it as timing rather than as refusal.",
  },

  // --- self -----------------------------------------------------------------
  {
    slug: "what-am-i-not-seeing",
    title: "What am I not seeing?",
    heading: "What am I not seeing?",
    area: "self",
    spread: "celtic-cross",
    intro:
      "The best question to bring to a deck, and the least asked. It has no answer " +
      "you can check, which is precisely why the reading has room to say something.",
    reframe:
      "The Celtic Cross has two positions built for this: Environment, which is the " +
      "part you did not put there, and Hopes & Fears, which is the part you did.",
    honest:
      "A reading cannot see your blind spot from outside. What it can do is put " +
      "language on something you have been circling.",
    lens:
      "The card that irritates you is the one to read twice.",
  },
  {
    slug: "why-do-i-keep-repeating-this",
    title: "Why do I keep repeating the same pattern?",
    heading: "Why does this keep happening?",
    area: "self",
    spread: "celtic-cross",
    intro:
      "Asked after the third time, usually. The recognition is already there; what " +
      "is missing is a shape for it.",
    reframe:
      "The Root and the Past do most of the work. A pattern has a beginning, and " +
      "naming the beginning is often the whole intervention.",
    honest:
      "This is not therapy and does not replace it. If the pattern is doing real " +
      "damage, a person trained for it will help more than a deck.",
    lens:
      "If the same suit dominates, that names the register the pattern lives in — " +
      "feeling, thought, work or drive.",
    human: true,
  },
  {
    slug: "should-i-move-cities",
    title: "Should I move to another city?",
    heading: "Should I move?",
    area: "self",
    spread: "situation",
    intro:
      "Moving solves conditions and does not solve patterns. Most of the difficulty " +
      "in this decision is telling which one you are trying to escape.",
    reframe:
      "Situation, action, outcome — with the situation card doing the heavy lifting. " +
      "It describes what you are actually in, which is what determines whether " +
      "distance would change it.",
    honest:
      "Nothing here knows about visas, rent or your family. It reads the part of " +
      "the decision that is not logistics.",
    lens:
      "A spread with no major arcana suggests this is a practical decision with " +
      "practical levers. That is good news.",
  },

  // --- people ---------------------------------------------------------------
  {
    slug: "should-i-forgive-them",
    title: "Should I forgive them?",
    heading: "Should I forgive them?",
    area: "people",
    spread: "relationship",
    intro:
      "Forgiveness and reconciliation are two decisions, and this question " +
      "usually has them fused. You can do either without the other.",
    reframe:
      "The spread reads both people and the space between, which is exactly the " +
      "separation you need: what they did, what you are carrying, and what is " +
      "actually still connected.",
    honest:
      "No reading can tell you whether someone deserves forgiveness. Nobody can. " +
      "It can show you what holding it is costing.",
    lens:
      "Read your own positions before theirs. The question is more about you than " +
      "the phrasing suggests.",
    human: true,
  },
  {
    slug: "why-did-they-pull-away",
    title: "Why did they suddenly go quiet?",
    heading: "Why did they pull away?",
    area: "people",
    spread: "relationship",
    intro:
      "The silence is doing something to you that the person may not have intended " +
      "and may not know about.",
    reframe:
      "What the spread reads well is the shape of the distance — whether something " +
      "closed, or whether it is simply somebody else's season and has nothing to " +
      "do with you.",
    honest:
      "It cannot report their reasons. The most useful outcome here is usually " +
      "the realisation that you have been assigning yourself a cause.",
    lens:
      "If their positions are quiet cards rather than harsh ones, consider that " +
      "the withdrawal may not be about you at all.",
  },
  {
    slug: "how-do-i-set-a-boundary",
    title: "How do I set a boundary with family?",
    heading: "How do I hold a line with family?",
    area: "people",
    spread: "three-card",
    intro:
      "The line is usually easy to name and hard to hold, because the cost of " +
      "holding it falls on the relationship you are trying to keep.",
    reframe:
      "Past, present, future: how the arrangement formed, what it is now, and " +
      "where it goes if nothing changes. The last one is the argument for acting.",
    honest:
      "The cards will not script the conversation. They can tell you what you have " +
      "been trading for peace.",
    lens:
      "Read the future card as the cost of the status quo, not as a threat.",
  },
]

export const QUESTIONS_BY_SLUG = new Map(QUESTIONS.map((q) => [q.slug, q]))

export function questionsInArea(area: Question["area"]) {
  return QUESTIONS.filter((q) => q.area === area)
}

/** Two others from the same area, then one from elsewhere -- so a visitor who
 *  came in on one question has somewhere to go that is not the home page. */
export function relatedQuestions(question: Question, limit = 3): Question[] {
  const same = QUESTIONS.filter((q) => q.area === question.area && q.slug !== question.slug)
  const other = QUESTIONS.filter((q) => q.area !== question.area)
  return [...same, ...other].slice(0, limit)
}
