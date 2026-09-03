// GENERATED FILE -- DO NOT EDIT.
// Regenerate with:  python web/gen_data.py
//
// The source of truth is tarot/tarot_data.py and tarot/correspondences.py.
// Editing this file directly means the next regeneration silently reverts you.

import type { Card, Suit, Rank, Context, Spread, Correspondence } from "./types"

export const CONTEXTS: Context[] = [
  {
    "slug": "general",
    "label": "General"
  },
  {
    "slug": "love",
    "label": "Love & Relationships"
  },
  {
    "slug": "career",
    "label": "Career & Work"
  },
  {
    "slug": "money",
    "label": "Money & Resources"
  },
  {
    "slug": "health",
    "label": "Health & Energy"
  },
  {
    "slug": "yes-no",
    "label": "Yes or No"
  }
]

export const SUITS: Record<string, Suit> = {
  "wands": {
    "name": "Wands",
    "element": "Fire",
    "ink": "red",
    "domain": "drive, creativity and the will to act",
    "season": "Spring"
  },
  "cups": {
    "name": "Cups",
    "element": "Water",
    "ink": "blue",
    "domain": "feeling, attachment and the inner life",
    "season": "Summer"
  },
  "swords": {
    "name": "Swords",
    "element": "Air",
    "ink": "slate",
    "domain": "thought, truth and the cost of clarity",
    "season": "Autumn"
  },
  "pentacles": {
    "name": "Pentacles",
    "element": "Earth",
    "ink": "green",
    "domain": "work, body and material security",
    "season": "Winter"
  }
}

export const RANKS: Rank[] = [
  {
    "number": 1,
    "name": "Ace",
    "roman": "I"
  },
  {
    "number": 2,
    "name": "Two",
    "roman": "II"
  },
  {
    "number": 3,
    "name": "Three",
    "roman": "III"
  },
  {
    "number": 4,
    "name": "Four",
    "roman": "IV"
  },
  {
    "number": 5,
    "name": "Five",
    "roman": "V"
  },
  {
    "number": 6,
    "name": "Six",
    "roman": "VI"
  },
  {
    "number": 7,
    "name": "Seven",
    "roman": "VII"
  },
  {
    "number": 8,
    "name": "Eight",
    "roman": "VIII"
  },
  {
    "number": 9,
    "name": "Nine",
    "roman": "IX"
  },
  {
    "number": 10,
    "name": "Ten",
    "roman": "X"
  },
  {
    "number": 11,
    "name": "Page",
    "roman": "P"
  },
  {
    "number": 12,
    "name": "Knight",
    "roman": "N"
  },
  {
    "number": 13,
    "name": "Queen",
    "roman": "Q"
  },
  {
    "number": 14,
    "name": "King",
    "roman": "K"
  }
]

export const CARDS: Card[] = [
  {
    "slug": "the-fool",
    "name": "The Fool",
    "arcana": "major",
    "suit": null,
    "number": 0,
    "roman": "0",
    "emblem": "fool",
    "ink": "yellow",
    "element": "Air",
    "astrology": "Uranus",
    "up_keys": [
      "beginnings",
      "faith",
      "innocence",
      "the leap"
    ],
    "rev_keys": [
      "recklessness",
      "hesitation",
      "naivety",
      "bad timing"
    ],
    "up": "The Fool is the moment before experience — the step taken without a map. It carries no expertise and no scar tissue, and that is precisely its power. When this card opens a reading it says the situation is genuinely new, and that treating it as a repeat of something older will cost you.",
    "rev": "Reversed, the leap is mistimed. Either you are hurling yourself forward to avoid sitting with a decision, or you are frozen at the edge calling it prudence. The card asks which one it is — the remedy for each is the opposite of the other.",
    "ctx": {
      "love": {
        "up": "A relationship with no precedent in your history. Meet it on its own terms.",
        "rev": "Impulse dressed as romance, or fear dressed as patience."
      },
      "career": {
        "up": "An unproven path that suits you better than the proven one.",
        "rev": "Leaping without runway, or stalling until the opening closes."
      },
      "money": {
        "up": "A small speculative move you can afford to lose.",
        "rev": "Spending as avoidance. Check what feeling the purchase is answering."
      },
      "health": {
        "up": "Fresh energy. Begin the practice you keep postponing.",
        "rev": "Ignoring a signal because acknowledging it would slow you down."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "the-magician",
    "name": "The Magician",
    "arcana": "major",
    "suit": null,
    "number": 1,
    "roman": "I",
    "emblem": "magician",
    "ink": "red",
    "element": "Air",
    "astrology": "Mercury",
    "up_keys": [
      "capability",
      "focus",
      "resourcefulness",
      "manifestation"
    ],
    "rev_keys": [
      "scattering",
      "manipulation",
      "untapped skill",
      "illusion"
    ],
    "up": "The Magician says every tool you need is already on the table. This is not a card of luck but of conversion — intention into action, idea into object. It appears when the bottleneck is not resources but the willingness to commit them to one aim.",
    "rev": "Reversed, power leaks. Skill is present but pointed in six directions, or pointed at someone rather than at a goal. Look for the gap between what is being said and what is actually being built.",
    "ctx": {
      "love": {
        "up": "Say the thing directly. Charm without honesty curdles here.",
        "rev": "Performance over intimacy. Someone is managing an impression."
      },
      "career": {
        "up": "You are more qualified than you are behaving. Act on it.",
        "rev": "Talent spread across too many projects to compound in any."
      },
      "money": {
        "up": "A concrete plan converts income into an asset.",
        "rev": "A scheme that sounds better than it computes. Run the numbers twice."
      },
      "health": {
        "up": "Discipline pays fast right now. Small protocol, held daily.",
        "rev": "Starting over weekly. Consistency beats optimisation."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "the-high-priestess",
    "name": "The High Priestess",
    "arcana": "major",
    "suit": null,
    "number": 2,
    "roman": "II",
    "emblem": "priestess",
    "ink": "blue",
    "element": "Water",
    "astrology": "Moon",
    "up_keys": [
      "intuition",
      "the unspoken",
      "patience",
      "inner knowing"
    ],
    "rev_keys": [
      "disconnection",
      "secrets kept too long",
      "ignored instinct",
      "noise"
    ],
    "up": "The High Priestess sits between the pillars and does not explain. She marks the part of a situation that is known but not yet sayable. When she appears, the useful move is usually to gather rather than to declare — the answer is forming and does not want an audience yet.",
    "rev": "Reversed, the channel is jammed. Either you are overriding an instinct you have already registered, or you are withholding something whose secrecy now costs more than its disclosure would.",
    "ctx": {
      "love": {
        "up": "Something unspoken is doing the real work. Listen before you argue.",
        "rev": "Withholding has become the relationship's structure."
      },
      "career": {
        "up": "Gather information quietly. Do not announce the move yet.",
        "rev": "Office noise is drowning out your read on the situation."
      },
      "money": {
        "up": "Hold. The picture is incomplete and the deadline is softer than it looks.",
        "rev": "You knew. Act on what you knew."
      },
      "health": {
        "up": "Rest, track, notice patterns. The body is reporting.",
        "rev": "Symptoms filed under 'later' for too long."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "the-empress",
    "name": "The Empress",
    "arcana": "major",
    "suit": null,
    "number": 3,
    "roman": "III",
    "emblem": "empress",
    "ink": "green",
    "element": "Earth",
    "astrology": "Venus",
    "up_keys": [
      "abundance",
      "nurture",
      "creation",
      "the senses"
    ],
    "rev_keys": [
      "depletion",
      "smothering",
      "creative block",
      "neglect"
    ],
    "up": "The Empress is fertility in the broadest sense — of soil, of work, of care. She rewards tending over forcing. Where she appears, something is capable of growing if it is fed consistently and not dug up to check on it.",
    "rev": "Reversed, the well is low. You are giving from reserve, or giving so completely that the thing you tend cannot develop its own roots. Either way the correction begins with your own resources, not with more effort.",
    "ctx": {
      "love": {
        "up": "Warmth, generosity, ease. Care expressed physically, not just stated.",
        "rev": "Care that has curdled into control, or a partner running on empty."
      },
      "career": {
        "up": "Creative work flourishes. Protect the conditions that let it.",
        "rev": "Burnout wearing the costume of dedication."
      },
      "money": {
        "up": "Steady growth from something you have patiently maintained.",
        "rev": "Comfort spending that quietly outpaces income."
      },
      "health": {
        "up": "Feed yourself properly. The body responds to being tended.",
        "rev": "Depletion. Rest is the treatment, not the reward for finishing."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "the-emperor",
    "name": "The Emperor",
    "arcana": "major",
    "suit": null,
    "number": 4,
    "roman": "IV",
    "emblem": "emperor",
    "ink": "red",
    "element": "Fire",
    "astrology": "Aries",
    "up_keys": [
      "structure",
      "authority",
      "boundaries",
      "order"
    ],
    "rev_keys": [
      "rigidity",
      "domination",
      "chaos",
      "absent leadership"
    ],
    "up": "The Emperor builds the frame that makes freedom usable. Rules, boundaries, systems, a decision that holds. He appears when a situation has enough energy and not enough architecture — and when someone has to be the one who decides.",
    "rev": "Reversed, structure has become the problem. Control applied where trust was needed, or an authority vacuum nobody will step into. Ask whether the rules are still serving the thing they were built to protect.",
    "ctx": {
      "love": {
        "up": "Commitment given shape: clear terms, kept agreements.",
        "rev": "Control mistaken for care. Rigidity where flexibility was owed."
      },
      "career": {
        "up": "Take the decision. Ambiguity is now more expensive than being wrong.",
        "rev": "A boss problem, or your own refusal to adapt a system that has aged out."
      },
      "money": {
        "up": "A budget, a structure, a boring plan that works.",
        "rev": "Rigid finances that cannot absorb a shock."
      },
      "health": {
        "up": "Routine and structure serve you. Same time, same thing, daily.",
        "rev": "Pushing through as a policy. The body does not respect org charts."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "the-hierophant",
    "name": "The Hierophant",
    "arcana": "major",
    "suit": null,
    "number": 5,
    "roman": "V",
    "emblem": "hierophant",
    "ink": "slate",
    "element": "Earth",
    "astrology": "Taurus",
    "up_keys": [
      "tradition",
      "teaching",
      "institutions",
      "shared meaning"
    ],
    "rev_keys": [
      "dogma",
      "unorthodoxy",
      "hollow ritual",
      "questioning"
    ],
    "up": "The Hierophant is the accumulated answer — what the tradition, the institution, the mentor already worked out. His appearance suggests the problem in front of you is not novel, and that the established route is genuinely the efficient one.",
    "rev": "Reversed, the form has outlived the meaning. Either the institution no longer deserves your deference, or you are rejecting structure reflexively and paying to relearn what was freely available.",
    "ctx": {
      "love": {
        "up": "Shared values and public commitment. The conventional path fits here.",
        "rev": "A relationship held together by expectation rather than desire."
      },
      "career": {
        "up": "Mentorship, credentials, doing it the established way.",
        "rev": "A culture that rewards compliance over contribution."
      },
      "money": {
        "up": "Conservative, orthodox handling. Boring is correct.",
        "rev": "Advice that serves the adviser. Check the incentives."
      },
      "health": {
        "up": "Established medicine. See the professional, follow the protocol.",
        "rev": "Blanket protocols applied to a body that is not average."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "the-lovers",
    "name": "The Lovers",
    "arcana": "major",
    "suit": null,
    "number": 6,
    "roman": "VI",
    "emblem": "lovers",
    "ink": "yellow",
    "element": "Air",
    "astrology": "Gemini",
    "up_keys": [
      "union",
      "values",
      "choice",
      "alignment"
    ],
    "rev_keys": [
      "misalignment",
      "avoidance",
      "temptation",
      "division"
    ],
    "up": "The Lovers is less about romance than about alignment — the moment a choice reveals what you actually value. Real union is its reward, but the mechanism is a decision that cannot be made half-way.",
    "rev": "Reversed, values and behaviour have come apart. A choice is being avoided, or was made against your own grain and is now producing friction that looks like bad luck.",
    "ctx": {
      "love": {
        "up": "Genuine meeting. Two people choosing each other with open eyes.",
        "rev": "A mismatch in values that affection cannot bridge indefinitely."
      },
      "career": {
        "up": "A role that fits what you actually care about.",
        "rev": "Doing work that requires you to be someone you are not."
      },
      "money": {
        "up": "A financial choice that reflects your priorities, not your anxiety.",
        "rev": "Money decisions made to avoid a conversation."
      },
      "health": {
        "up": "Mind and body pulling the same direction.",
        "rev": "Habits at war with stated intentions."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "the-chariot",
    "name": "The Chariot",
    "arcana": "major",
    "suit": null,
    "number": 7,
    "roman": "VII",
    "emblem": "chariot",
    "ink": "blue",
    "element": "Water",
    "astrology": "Cancer",
    "up_keys": [
      "momentum",
      "willpower",
      "control",
      "victory"
    ],
    "rev_keys": [
      "stalling",
      "scattered force",
      "aggression",
      "losing the reins"
    ],
    "up": "The Chariot is force held on a line. Two opposing energies harnessed to one direction — which is why it reads as victory. It appears when the outcome depends less on strength than on refusing to be pulled off course.",
    "rev": "Reversed, the horses win. Effort continues but direction is lost, or drive has curdled into aggression that costs more ground than it takes.",
    "ctx": {
      "love": {
        "up": "Pursuing what you want, clearly and without apology.",
        "rev": "Pushing where you should be listening."
      },
      "career": {
        "up": "Momentum. Keep the line and do not renegotiate mid-run.",
        "rev": "Busy and directionless. Effort without a destination."
      },
      "money": {
        "up": "Disciplined progress toward a defined number.",
        "rev": "Financial ambition outrunning financial control."
      },
      "health": {
        "up": "Training pays. The body is responding to consistency.",
        "rev": "Overtraining, or willpower substituting for recovery."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "strength",
    "name": "Strength",
    "arcana": "major",
    "suit": null,
    "number": 8,
    "roman": "VIII",
    "emblem": "strength",
    "ink": "yellow",
    "element": "Fire",
    "astrology": "Leo",
    "up_keys": [
      "courage",
      "patience",
      "gentle power",
      "self-mastery"
    ],
    "rev_keys": [
      "self-doubt",
      "force",
      "depletion",
      "impatience"
    ],
    "up": "Strength is the hand on the lion's jaw — influence without violence. It is the slower power, and the more durable one. When it appears, the situation will yield to steadiness and refuse brute force outright.",
    "rev": "Reversed, the inner animal has the upper hand — as raw reactivity, or as the self-doubt that makes you flinch from something you could in fact handle.",
    "ctx": {
      "love": {
        "up": "Patience and warmth do what confrontation cannot.",
        "rev": "Reacting from the raw place. Pause before you answer."
      },
      "career": {
        "up": "Quiet competence earns more ground than assertion.",
        "rev": "Imposter feelings distorting a real record of capability."
      },
      "money": {
        "up": "Steady nerve through a dip. Do not sell in fear.",
        "rev": "Panic decisions. Wait forty-eight hours."
      },
      "health": {
        "up": "Gentle consistency beats intensity.",
        "rev": "Running on nerve. Reserves are lower than you are admitting."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "the-hermit",
    "name": "The Hermit",
    "arcana": "major",
    "suit": null,
    "number": 9,
    "roman": "IX",
    "emblem": "hermit",
    "ink": "slate",
    "element": "Earth",
    "astrology": "Virgo",
    "up_keys": [
      "solitude",
      "search",
      "inner light",
      "withdrawal"
    ],
    "rev_keys": [
      "isolation",
      "avoidance",
      "refused help",
      "loneliness"
    ],
    "up": "The Hermit steps out of the crowd on purpose, carrying his own light. This is the card of deliberate withdrawal for the sake of clarity — not escape, but the recognition that the answer will not arrive amid noise.",
    "rev": "Reversed, solitude has stopped being useful. Withdrawal has hardened into avoidance, or you have been alone with a problem long past the point where another person would have solved it in an hour.",
    "ctx": {
      "love": {
        "up": "Time alone clarifies what you actually want from partnership.",
        "rev": "Withdrawing instead of saying the difficult thing."
      },
      "career": {
        "up": "Deep, undistracted work. Protect the quiet.",
        "rev": "Isolated from the information and allies you need."
      },
      "money": {
        "up": "Review everything privately before you commit.",
        "rev": "Refusing advice out of pride."
      },
      "health": {
        "up": "Rest and quiet are the intervention.",
        "rev": "Suffering privately. This one needs another person."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "wheel-of-fortune",
    "name": "Wheel of Fortune",
    "arcana": "major",
    "suit": null,
    "number": 10,
    "roman": "X",
    "emblem": "wheel",
    "ink": "yellow",
    "element": "Fire",
    "astrology": "Jupiter",
    "up_keys": [
      "turning point",
      "cycles",
      "luck",
      "fate"
    ],
    "rev_keys": [
      "resistance",
      "downturn",
      "bad timing",
      "repetition"
    ],
    "up": "The Wheel marks the turn — the part of a situation that is not yours to control. It argues for reading the cycle correctly rather than fighting it: what is rising should be ridden, what is falling should be released early.",
    "rev": "Reversed, the wheel catches. A cycle repeats because its lesson has not been taken, or the turn is downward and the useful skill is limiting damage rather than forcing luck.",
    "ctx": {
      "love": {
        "up": "A shift arrives from outside. Meet it rather than manage it.",
        "rev": "The same pattern, a new person. Look at the constant."
      },
      "career": {
        "up": "An unexpected opening. Say yes before you feel ready.",
        "rev": "Timing is against you. Position, do not push."
      },
      "money": {
        "up": "Fortune turns favourable. Do not confuse luck with skill.",
        "rev": "A downturn to be weathered, not out-traded."
      },
      "health": {
        "up": "A natural upswing. Build on it.",
        "rev": "Cyclical relapse. Track the trigger rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "justice",
    "name": "Justice",
    "arcana": "major",
    "suit": null,
    "number": 11,
    "roman": "XI",
    "emblem": "justice",
    "ink": "slate",
    "element": "Air",
    "astrology": "Libra",
    "up_keys": [
      "fairness",
      "consequence",
      "truth",
      "accountability"
    ],
    "rev_keys": [
      "imbalance",
      "evasion",
      "bias",
      "unfairness"
    ],
    "up": "Justice weighs what actually happened, not what was intended. It is the card of consequence arriving on schedule — legal, relational or self-imposed. Where it appears, the honest accounting is also the strategically correct one.",
    "rev": "Reversed, the scales are rigged or the reckoning is being dodged. Someone is avoiding a consequence, or a genuine unfairness is being asked to pass as balance.",
    "ctx": {
      "love": {
        "up": "Even footing. What each gives and gets is visible and fair.",
        "rev": "An imbalance both people can see and neither will name."
      },
      "career": {
        "up": "A fair outcome, a contract, a decision that holds up.",
        "rev": "Credit misallocated. Document things."
      },
      "money": {
        "up": "Settle it properly — tax, debt, the split. Do it cleanly.",
        "rev": "An agreement weighted against you. Read it again."
      },
      "health": {
        "up": "Balance restored through honest habits.",
        "rev": "The cost of the last two years is coming due."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "the-hanged-man",
    "name": "The Hanged Man",
    "arcana": "major",
    "suit": null,
    "number": 12,
    "roman": "XII",
    "emblem": "hanged",
    "ink": "blue",
    "element": "Water",
    "astrology": "Neptune",
    "up_keys": [
      "suspension",
      "surrender",
      "new angle",
      "pause"
    ],
    "rev_keys": [
      "stalling",
      "martyrdom",
      "pointless delay",
      "resistance"
    ],
    "up": "The Hanged Man is voluntary suspension — the pause that changes the view. Nothing moves, and that is the point. It appears when forward effort has stopped producing information and only a change of position will.",
    "rev": "Reversed, the pause has gone stale. Waiting has become identity, or sacrifice is being performed for an audience rather than made for a reason.",
    "ctx": {
      "love": {
        "up": "Let it sit. Clarity arrives without being forced.",
        "rev": "Endless waiting for someone to become who you need."
      },
      "career": {
        "up": "A delay you cannot move. Use it to reconsider the aim.",
        "rev": "Stuck and calling it strategy."
      },
      "money": {
        "up": "Do not transact yet. Position is worse than patience.",
        "rev": "Frozen by indecision while the cost accrues."
      },
      "health": {
        "up": "Genuine rest, not productive rest.",
        "rev": "Enduring discomfort as though it were virtue."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "death",
    "name": "Death",
    "arcana": "major",
    "suit": null,
    "number": 13,
    "roman": "XIII",
    "emblem": "death",
    "ink": "slate",
    "element": "Water",
    "astrology": "Scorpio",
    "up_keys": [
      "ending",
      "transformation",
      "clearing",
      "transition"
    ],
    "rev_keys": [
      "clinging",
      "stalled change",
      "fear of ending",
      "slow decay"
    ],
    "up": "Death is the least literal card in the deck and the most decisive. Something concludes so that the next thing has room. It is rarely gentle and almost never optional — but it removes what was already finished, which is a mercy.",
    "rev": "Reversed, the ending is being resisted. The thing is over and is being kept on life support, which costs more than the ending would have.",
    "ctx": {
      "love": {
        "up": "A chapter closes. What replaces it needs the space.",
        "rev": "Holding a relationship past its actual end."
      },
      "career": {
        "up": "Leave. The role has given you what it had.",
        "rev": "Staying out of fear while the position quietly erodes."
      },
      "money": {
        "up": "Cut the losing position. Redeploy.",
        "rev": "Averaging down on something already gone."
      },
      "health": {
        "up": "A habit ends and the body recovers quickly.",
        "rev": "Postponing a change your body has already voted on."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "temperance",
    "name": "Temperance",
    "arcana": "major",
    "suit": null,
    "number": 14,
    "roman": "XIV",
    "emblem": "temperance",
    "ink": "blue",
    "element": "Fire",
    "astrology": "Sagittarius",
    "up_keys": [
      "balance",
      "blending",
      "moderation",
      "patience"
    ],
    "rev_keys": [
      "excess",
      "imbalance",
      "impatience",
      "clashing parts"
    ],
    "up": "Temperance mixes. Two things that do not obviously belong together are combined slowly until they do. It is the card of the middle path taken skilfully rather than timidly — and it always takes longer than you want.",
    "rev": "Reversed, the proportions are off. Too much of one thing, or an attempt to rush a process that only works at its own pace.",
    "ctx": {
      "love": {
        "up": "Two lives blending well. Give it the time it needs.",
        "rev": "One person adapting far more than the other."
      },
      "career": {
        "up": "Combining skills or roles into something workable.",
        "rev": "Work and life out of proportion, and it is showing."
      },
      "money": {
        "up": "Moderate, mixed, steady. No single big move.",
        "rev": "Feast and famine cycles. Smooth the middle."
      },
      "health": {
        "up": "Moderation is doing real work. Continue.",
        "rev": "Excess in one direction, or crash-correcting in the other."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "the-devil",
    "name": "The Devil",
    "arcana": "major",
    "suit": null,
    "number": 15,
    "roman": "XV",
    "emblem": "devil",
    "ink": "red",
    "element": "Earth",
    "astrology": "Capricorn",
    "up_keys": [
      "attachment",
      "compulsion",
      "shadow",
      "the bargain"
    ],
    "rev_keys": [
      "release",
      "seeing the chain",
      "breaking free",
      "reclaiming"
    ],
    "up": "The Devil is the arrangement you keep choosing while calling it a trap. The chains in the image are loose — that detail is the whole card. It names dependency, appetite and the comfortable deal that costs more than it returns.",
    "rev": "Reversed, the chain is examined. This is the better half of the card: the compulsion loses its authority, the bargain gets renegotiated, and what looked like fate turns out to have been a habit.",
    "ctx": {
      "love": {
        "up": "Intense attachment. Ask honestly whether it is chosen or compelled.",
        "rev": "Walking out of a dynamic that had you convinced you could not."
      },
      "career": {
        "up": "Golden handcuffs. The money is real and so is the cost.",
        "rev": "Naming the thing that kept you, and leaving anyway."
      },
      "money": {
        "up": "Debt, or spending that manages a feeling.",
        "rev": "Facing the number. It is smaller than the dread."
      },
      "health": {
        "up": "A habit with a grip on you. Treat the grip, not the habit.",
        "rev": "Genuine release. The first weeks are the hard ones."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "the-tower",
    "name": "The Tower",
    "arcana": "major",
    "suit": null,
    "number": 16,
    "roman": "XVI",
    "emblem": "tower",
    "ink": "red",
    "element": "Fire",
    "astrology": "Mars",
    "up_keys": [
      "upheaval",
      "revelation",
      "collapse",
      "sudden truth"
    ],
    "rev_keys": [
      "averted disaster",
      "delayed collapse",
      "fear of change",
      "slow unravelling"
    ],
    "up": "The Tower is the structure that was built wrong coming down in one motion. It is frightening and it is clean. What it destroys was already unsound — the shock is not the collapse but the speed at which the truth arrives.",
    "rev": "Reversed, the collapse is deferred or survived. You may be delaying an inevitable correction, or you have just come through one and are still counting the damage.",
    "ctx": {
      "love": {
        "up": "A revelation changes the terms. It cannot be un-known.",
        "rev": "Preventing a breakdown that may need to happen."
      },
      "career": {
        "up": "Sudden, disruptive change. It clears ground you could not have cleared.",
        "rev": "Instability held at bay, at increasing cost."
      },
      "money": {
        "up": "An unexpected hit. Stabilise before you strategise.",
        "rev": "A near miss. Build the buffer now."
      },
      "health": {
        "up": "An acute event demanding immediate attention.",
        "rev": "Warning signs accumulating. Act before it forces you to."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "the-star",
    "name": "The Star",
    "arcana": "major",
    "suit": null,
    "number": 17,
    "roman": "XVII",
    "emblem": "star",
    "ink": "blue",
    "element": "Air",
    "astrology": "Aquarius",
    "up_keys": [
      "hope",
      "renewal",
      "clarity",
      "quiet faith"
    ],
    "rev_keys": [
      "discouragement",
      "lost faith",
      "self-doubt",
      "dimmed vision"
    ],
    "up": "The Star follows the Tower for a reason. After the collapse, the calm — water poured gently, sky clear, nothing urgent. It is the card of healing that has already quietly begun, and of hope that is realistic rather than performed.",
    "rev": "Reversed, the light is hard to see. Not despair exactly, but a loss of the belief that effort connects to outcome. It usually means recovery is real but slower than you want.",
    "ctx": {
      "love": {
        "up": "Healing, openness, a gentler chapter.",
        "rev": "Guarded after being hurt. Reasonable, but costing you."
      },
      "career": {
        "up": "Renewed direction. The work starts meaning something again.",
        "rev": "Disillusioned. The vision needs rebuilding before the plan does."
      },
      "money": {
        "up": "Slow, genuine recovery. Trust the trend, not the day.",
        "rev": "Discouraged by slow progress that is nonetheless progress."
      },
      "health": {
        "up": "Real healing underway. Keep the conditions steady.",
        "rev": "Recovery is happening more slowly than your patience."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "the-moon",
    "name": "The Moon",
    "arcana": "major",
    "suit": null,
    "number": 18,
    "roman": "XVIII",
    "emblem": "moon",
    "ink": "blue",
    "element": "Water",
    "astrology": "Pisces",
    "up_keys": [
      "uncertainty",
      "illusion",
      "dreams",
      "the unclear path"
    ],
    "rev_keys": [
      "clarity returning",
      "confusion lifting",
      "released fear",
      "truth surfacing"
    ],
    "up": "The Moon is the landscape by night — real, but unreliable to the eye. It marks the part of a situation distorted by fear, projection or missing information. The path exists; the light is simply bad.",
    "rev": "Reversed, the fog thins. Something you feared turns out to be smaller or different than imagined, or a deception ends and the shape of things resolves.",
    "ctx": {
      "love": {
        "up": "Something is not being seen clearly. Do not decide tonight.",
        "rev": "Clarity returning. A fear or suspicion resolves."
      },
      "career": {
        "up": "Incomplete information. Ask the direct question.",
        "rev": "A misunderstanding clears, or a hidden agenda surfaces."
      },
      "money": {
        "up": "Numbers you have not actually checked. Check them.",
        "rev": "The real position emerges. It is workable."
      },
      "health": {
        "up": "Unclear symptoms. Get a second, better look.",
        "rev": "A diagnosis or explanation finally makes sense."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "the-sun",
    "name": "The Sun",
    "arcana": "major",
    "suit": null,
    "number": 19,
    "roman": "XIX",
    "emblem": "sun",
    "ink": "yellow",
    "element": "Fire",
    "astrology": "Sun",
    "up_keys": [
      "clarity",
      "vitality",
      "success",
      "plain joy"
    ],
    "rev_keys": [
      "dimmed",
      "delayed",
      "forced cheer",
      "temporary clouds"
    ],
    "up": "The Sun is the least ambiguous card in the deck. Things are visible, warm and going well, and the correct response is to enjoy that rather than to look for the catch. Where it appears, the situation is simpler than you have been treating it.",
    "rev": "Reversed, the sun is still up but obscured. Success delayed, joy performed rather than felt, or a good thing you cannot yet let yourself have.",
    "ctx": {
      "love": {
        "up": "Warmth, ease, being genuinely seen. Enjoy it.",
        "rev": "Good on paper, flat in feeling. Ask what is missing."
      },
      "career": {
        "up": "Recognition and clarity. The work is landing.",
        "rev": "Success that arrives without satisfaction."
      },
      "money": {
        "up": "Things are fine. Better than you have been assuming.",
        "rev": "A delayed payoff. It is coming."
      },
      "health": {
        "up": "Vitality returns. Get outside.",
        "rev": "Low energy in an otherwise good period. Check sleep and light."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "judgement",
    "name": "Judgement",
    "arcana": "major",
    "suit": null,
    "number": 20,
    "roman": "XX",
    "emblem": "judgement",
    "ink": "yellow",
    "element": "Fire",
    "astrology": "Pluto",
    "up_keys": [
      "reckoning",
      "awakening",
      "calling",
      "rebirth"
    ],
    "rev_keys": [
      "self-doubt",
      "ignored call",
      "harsh self-judgement",
      "delay"
    ],
    "up": "Judgement is the summons — the moment a long accumulation resolves into a decision that cannot be unmade. It carries the sense of being called by something larger than preference, and of a past that finally makes sense in retrospect.",
    "rev": "Reversed, the call goes unanswered. Either you are refusing something you already know is yours, or you have turned the reckoning inward as pure self-criticism, which resolves nothing.",
    "ctx": {
      "love": {
        "up": "A decisive turn. Forgiveness, or a clear-eyed ending.",
        "rev": "Replaying an old verdict on yourself. It is out of date."
      },
      "career": {
        "up": "A calling, a decisive move, a reinvention that fits.",
        "rev": "Hearing it and not answering."
      },
      "money": {
        "up": "A full accounting, then a clean restart.",
        "rev": "Shame is a poor accountant. Get the real numbers."
      },
      "health": {
        "up": "A turning point. The change holds this time.",
        "rev": "Punishing yourself for a lapse instead of resuming."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "the-world",
    "name": "The World",
    "arcana": "major",
    "suit": null,
    "number": 21,
    "roman": "XXI",
    "emblem": "world",
    "ink": "green",
    "element": "Earth",
    "astrology": "Saturn",
    "up_keys": [
      "completion",
      "wholeness",
      "arrival",
      "integration"
    ],
    "rev_keys": [
      "near-completion",
      "loose ends",
      "delayed closure",
      "unfinished"
    ],
    "up": "The World closes the circle. Something integrates — the parts finally belong to each other, and a cycle that took real time concludes properly. It is the deck's only unambiguous ending, and it is a good one.",
    "rev": "Reversed, the finish line moves. Ninety percent done, with the last ten percent carrying all the difficulty. Usually a loose end you have known about for a while.",
    "ctx": {
      "love": {
        "up": "A relationship that feels complete in itself.",
        "rev": "Almost there. One conversation still owed."
      },
      "career": {
        "up": "A project completes and changes your standing.",
        "rev": "Finishing is being avoided. Name the last task."
      },
      "money": {
        "up": "A goal reached. Set the next one deliberately.",
        "rev": "So close. Do not restructure now — just close it."
      },
      "health": {
        "up": "Full recovery, integration, a body that feels like yours.",
        "rev": "The last stretch of recovery is the slow one."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "ace-of-wands",
    "name": "Ace of Wands",
    "arcana": "minor",
    "suit": "wands",
    "number": 1,
    "roman": "I",
    "emblem": "wands",
    "ink": "red",
    "element": "Fire",
    "astrology": "Spring",
    "up_keys": [
      "ignition",
      "raw drive",
      "an offer",
      "creative spark"
    ],
    "rev_keys": [
      "false start",
      "delay",
      "lost nerve"
    ],
    "up": "A genuine spark. Something wants to begin and has real fuel behind it.",
    "rev": "The spark is there but is not catching — timing, nerve or conditions.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as ignition expressed through drive, creativity and the will to act — a seed — pure potential, not yet spent.",
        "rev": "Reversed, false start is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, ignition shapes the situation. Wands govern drive, creativity and the will to act, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect false start — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to ignition in matters of drive, creativity and the will to act.",
        "rev": "Reversed, false start around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Fire suggests ignition — a seed — pure potential, not yet spent.",
        "rev": "Reversed, false start. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "two-of-wands",
    "name": "Two of Wands",
    "arcana": "minor",
    "suit": "wands",
    "number": 2,
    "roman": "II",
    "emblem": "wands",
    "ink": "red",
    "element": "Fire",
    "astrology": "Spring",
    "up_keys": [
      "planning",
      "first steps",
      "wider horizon",
      "decision"
    ],
    "rev_keys": [
      "fear of leaving",
      "poor planning",
      "playing small"
    ],
    "up": "You have built something and are looking past it. The world map is out.",
    "rev": "The safe option is being chosen for the wrong reason.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as planning expressed through drive, creativity and the will to act — a pairing — balance, choice or tension between two.",
        "rev": "Reversed, fear of leaving is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, planning shapes the situation. Wands govern drive, creativity and the will to act, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect fear of leaving — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to planning in matters of drive, creativity and the will to act.",
        "rev": "Reversed, fear of leaving around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Fire suggests planning — a pairing — balance, choice or tension between two.",
        "rev": "Reversed, fear of leaving. Treat the cause rather than the symptom."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "three-of-wands",
    "name": "Three of Wands",
    "arcana": "minor",
    "suit": "wands",
    "number": 3,
    "roman": "III",
    "emblem": "wands",
    "ink": "red",
    "element": "Fire",
    "astrology": "Spring",
    "up_keys": [
      "expansion",
      "foresight",
      "ships out",
      "waiting well"
    ],
    "rev_keys": [
      "delays",
      "narrow view",
      "premature effort"
    ],
    "up": "The work is done and moving. Now it is a matter of scope and patience.",
    "rev": "Expansion stalls, or was launched before it was ready.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as expansion expressed through drive, creativity and the will to act — first growth — the idea proven in company.",
        "rev": "Reversed, delays is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, expansion shapes the situation. Wands govern drive, creativity and the will to act, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect delays — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to expansion in matters of drive, creativity and the will to act.",
        "rev": "Reversed, delays around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Fire suggests expansion — first growth — the idea proven in company.",
        "rev": "Reversed, delays. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "four-of-wands",
    "name": "Four of Wands",
    "arcana": "minor",
    "suit": "wands",
    "number": 4,
    "roman": "IV",
    "emblem": "wands",
    "ink": "red",
    "element": "Fire",
    "astrology": "Spring",
    "up_keys": [
      "celebration",
      "homecoming",
      "milestone",
      "stable ground"
    ],
    "rev_keys": [
      "transition",
      "unstable footing",
      "postponed joy"
    ],
    "up": "A threshold reached and worth marking. Stability with warmth in it.",
    "rev": "Home or foundation in flux. The celebration waits.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as celebration expressed through drive, creativity and the will to act — consolidation — holding what has been built.",
        "rev": "Reversed, transition is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, celebration shapes the situation. Wands govern drive, creativity and the will to act, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect transition — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to celebration in matters of drive, creativity and the will to act.",
        "rev": "Reversed, transition around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Fire suggests celebration — consolidation — holding what has been built.",
        "rev": "Reversed, transition. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "five-of-wands",
    "name": "Five of Wands",
    "arcana": "minor",
    "suit": "wands",
    "number": 5,
    "roman": "V",
    "emblem": "wands",
    "ink": "red",
    "element": "Fire",
    "astrology": "Spring",
    "up_keys": [
      "friction",
      "competition",
      "clashing",
      "scrappy energy"
    ],
    "rev_keys": [
      "avoided conflict",
      "resolution",
      "inner conflict"
    ],
    "up": "Everyone is pushing at once. Noisy, but rarely serious.",
    "rev": "Conflict suppressed rather than settled, or finally cooling.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as friction expressed through drive, creativity and the will to act — friction — loss, conflict or the cost of the middle.",
        "rev": "Reversed, avoided conflict is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, friction shapes the situation. Wands govern drive, creativity and the will to act, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect avoided conflict — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to friction in matters of drive, creativity and the will to act.",
        "rev": "Reversed, avoided conflict around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Fire suggests friction — friction — loss, conflict or the cost of the middle.",
        "rev": "Reversed, avoided conflict. Treat the cause rather than the symptom."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "six-of-wands",
    "name": "Six of Wands",
    "arcana": "minor",
    "suit": "wands",
    "number": 6,
    "roman": "VI",
    "emblem": "wands",
    "ink": "red",
    "element": "Fire",
    "astrology": "Spring",
    "up_keys": [
      "recognition",
      "victory",
      "visible success",
      "confidence"
    ],
    "rev_keys": [
      "deflated",
      "unrecognised",
      "hollow win"
    ],
    "up": "Public acknowledgement of something you actually did.",
    "rev": "The credit does not arrive, or arrives and means nothing.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as recognition expressed through drive, creativity and the will to act — recovery — the turn back toward harmony.",
        "rev": "Reversed, deflated is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, recognition shapes the situation. Wands govern drive, creativity and the will to act, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect deflated — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to recognition in matters of drive, creativity and the will to act.",
        "rev": "Reversed, deflated around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Fire suggests recognition — recovery — the turn back toward harmony.",
        "rev": "Reversed, deflated. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "seven-of-wands",
    "name": "Seven of Wands",
    "arcana": "minor",
    "suit": "wands",
    "number": 7,
    "roman": "VII",
    "emblem": "wands",
    "ink": "red",
    "element": "Fire",
    "astrology": "Spring",
    "up_keys": [
      "defending",
      "holding ground",
      "conviction",
      "pressure"
    ],
    "rev_keys": [
      "overwhelmed",
      "giving way",
      "exhausted defence"
    ],
    "up": "You hold the higher ground. Keep holding it — the position is sound.",
    "rev": "The defence is costing more than the ground is worth.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as defending expressed through drive, creativity and the will to act — endurance — the unglamorous middle stretch.",
        "rev": "Reversed, overwhelmed is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, defending shapes the situation. Wands govern drive, creativity and the will to act, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect overwhelmed — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to defending in matters of drive, creativity and the will to act.",
        "rev": "Reversed, overwhelmed around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Fire suggests defending — endurance — the unglamorous middle stretch.",
        "rev": "Reversed, overwhelmed. Treat the cause rather than the symptom."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "eight-of-wands",
    "name": "Eight of Wands",
    "arcana": "minor",
    "suit": "wands",
    "number": 8,
    "roman": "VIII",
    "emblem": "wands",
    "ink": "red",
    "element": "Fire",
    "astrology": "Spring",
    "up_keys": [
      "speed",
      "messages",
      "rapid movement",
      "alignment"
    ],
    "rev_keys": [
      "delay",
      "scattered",
      "miscommunication"
    ],
    "up": "Everything moves at once and in the same direction. Ride it.",
    "rev": "Momentum breaks up. Things arrive late or out of order.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as speed expressed through drive, creativity and the will to act — momentum — skill turning into speed.",
        "rev": "Reversed, delay is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, speed shapes the situation. Wands govern drive, creativity and the will to act, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect delay — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to speed in matters of drive, creativity and the will to act.",
        "rev": "Reversed, delay around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Fire suggests speed — momentum — skill turning into speed.",
        "rev": "Reversed, delay. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "nine-of-wands",
    "name": "Nine of Wands",
    "arcana": "minor",
    "suit": "wands",
    "number": 9,
    "roman": "IX",
    "emblem": "wands",
    "ink": "red",
    "element": "Fire",
    "astrology": "Spring",
    "up_keys": [
      "resilience",
      "last stand",
      "guarded",
      "nearly through"
    ],
    "rev_keys": [
      "depletion",
      "paranoia",
      "refusing help"
    ],
    "up": "Battered but standing. The final stretch, and you have what it takes.",
    "rev": "Defensiveness outliving the threat. Reserves genuinely low.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as resilience expressed through drive, creativity and the will to act — near-completion — the last and heaviest stretch.",
        "rev": "Reversed, depletion is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, resilience shapes the situation. Wands govern drive, creativity and the will to act, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect depletion — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to resilience in matters of drive, creativity and the will to act.",
        "rev": "Reversed, depletion around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Fire suggests resilience — near-completion — the last and heaviest stretch.",
        "rev": "Reversed, depletion. Treat the cause rather than the symptom."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "ten-of-wands",
    "name": "Ten of Wands",
    "arcana": "minor",
    "suit": "wands",
    "number": 10,
    "roman": "X",
    "emblem": "wands",
    "ink": "red",
    "element": "Fire",
    "astrology": "Spring",
    "up_keys": [
      "burden",
      "overload",
      "carrying too much",
      "near the door"
    ],
    "rev_keys": [
      "delegation",
      "release",
      "collapse"
    ],
    "up": "The load is real and nearly delivered. It is also more than one person's.",
    "rev": "Something gets put down — by choice, or because you drop it.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as burden expressed through drive, creativity and the will to act — completion — the full weight of the suit, for better and worse.",
        "rev": "Reversed, delegation is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, burden shapes the situation. Wands govern drive, creativity and the will to act, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect delegation — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to burden in matters of drive, creativity and the will to act.",
        "rev": "Reversed, delegation around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Fire suggests burden — completion — the full weight of the suit, for better and worse.",
        "rev": "Reversed, delegation. Treat the cause rather than the symptom."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "page-of-wands",
    "name": "Page of Wands",
    "arcana": "minor",
    "suit": "wands",
    "number": 11,
    "roman": "P",
    "emblem": "wands",
    "ink": "red",
    "element": "Fire",
    "astrology": "Spring",
    "up_keys": [
      "enthusiasm",
      "news",
      "exploration",
      "free spirit"
    ],
    "rev_keys": [
      "restlessness",
      "false start",
      "immaturity"
    ],
    "up": "Fresh energy and news worth acting on. Untrained but alive.",
    "rev": "Enthusiasm without follow-through.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as enthusiasm expressed through drive, creativity and the will to act — the student — curiosity, messages, beginner's openness.",
        "rev": "Reversed, restlessness is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, enthusiasm shapes the situation. Wands govern drive, creativity and the will to act, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect restlessness — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to enthusiasm in matters of drive, creativity and the will to act.",
        "rev": "Reversed, restlessness around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Fire suggests enthusiasm — the student — curiosity, messages, beginner's openness.",
        "rev": "Reversed, restlessness. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "knight-of-wands",
    "name": "Knight of Wands",
    "arcana": "minor",
    "suit": "wands",
    "number": 12,
    "roman": "N",
    "emblem": "wands",
    "ink": "red",
    "element": "Fire",
    "astrology": "Spring",
    "up_keys": [
      "charge",
      "adventure",
      "haste",
      "bold action"
    ],
    "rev_keys": [
      "recklessness",
      "burnout",
      "no direction"
    ],
    "up": "Full commitment at speed. Thrilling and slightly ungovernable.",
    "rev": "Speed without steering. Something gets broken.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as charge expressed through drive, creativity and the will to act — the pursuer — momentum, single-mindedness, the charge.",
        "rev": "Reversed, recklessness is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, charge shapes the situation. Wands govern drive, creativity and the will to act, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect recklessness — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to charge in matters of drive, creativity and the will to act.",
        "rev": "Reversed, recklessness around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Fire suggests charge — the pursuer — momentum, single-mindedness, the charge.",
        "rev": "Reversed, recklessness. Treat the cause rather than the symptom."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "queen-of-wands",
    "name": "Queen of Wands",
    "arcana": "minor",
    "suit": "wands",
    "number": 13,
    "roman": "Q",
    "emblem": "wands",
    "ink": "red",
    "element": "Fire",
    "astrology": "Spring",
    "up_keys": [
      "warmth",
      "confidence",
      "magnetism",
      "self-possession"
    ],
    "rev_keys": [
      "insecurity",
      "demanding",
      "burnt out"
    ],
    "up": "Assured, warm, hard to intimidate. Draws people without asking.",
    "rev": "Confidence running on external supply.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as warmth expressed through drive, creativity and the will to act — inward mastery — holding the suit's power with depth.",
        "rev": "Reversed, insecurity is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, warmth shapes the situation. Wands govern drive, creativity and the will to act, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect insecurity — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to warmth in matters of drive, creativity and the will to act.",
        "rev": "Reversed, insecurity around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Fire suggests warmth — inward mastery — holding the suit's power with depth.",
        "rev": "Reversed, insecurity. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "king-of-wands",
    "name": "King of Wands",
    "arcana": "minor",
    "suit": "wands",
    "number": 14,
    "roman": "K",
    "emblem": "wands",
    "ink": "red",
    "element": "Fire",
    "astrology": "Spring",
    "up_keys": [
      "leadership",
      "vision",
      "boldness",
      "command"
    ],
    "rev_keys": [
      "arrogance",
      "tyranny",
      "impulsive rule"
    ],
    "up": "Vision plus the authority to execute it. Natural leadership.",
    "rev": "Leadership that has stopped listening.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as leadership expressed through drive, creativity and the will to act — outward mastery — wielding the suit's power in the world.",
        "rev": "Reversed, arrogance is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, leadership shapes the situation. Wands govern drive, creativity and the will to act, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect arrogance — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to leadership in matters of drive, creativity and the will to act.",
        "rev": "Reversed, arrogance around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Fire suggests leadership — outward mastery — wielding the suit's power in the world.",
        "rev": "Reversed, arrogance. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "ace-of-cups",
    "name": "Ace of Cups",
    "arcana": "minor",
    "suit": "cups",
    "number": 1,
    "roman": "I",
    "emblem": "cups",
    "ink": "blue",
    "element": "Water",
    "astrology": "Summer",
    "up_keys": [
      "new feeling",
      "openness",
      "offer of love",
      "overflow"
    ],
    "rev_keys": [
      "blocked emotion",
      "withheld",
      "emptiness"
    ],
    "up": "The heart opens. A new feeling, offered or received, with nothing guarded.",
    "rev": "Feeling present but not permitted out.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as new feeling expressed through feeling, attachment and the inner life — a seed — pure potential, not yet spent.",
        "rev": "Reversed, blocked emotion is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, new feeling shapes the situation. Cups govern feeling, attachment and the inner life, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect blocked emotion — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to new feeling in matters of feeling, attachment and the inner life.",
        "rev": "Reversed, blocked emotion around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Water suggests new feeling — a seed — pure potential, not yet spent.",
        "rev": "Reversed, blocked emotion. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "two-of-cups",
    "name": "Two of Cups",
    "arcana": "minor",
    "suit": "cups",
    "number": 2,
    "roman": "II",
    "emblem": "cups",
    "ink": "blue",
    "element": "Water",
    "astrology": "Summer",
    "up_keys": [
      "mutual attraction",
      "partnership",
      "meeting",
      "equal exchange"
    ],
    "rev_keys": [
      "imbalance",
      "rupture",
      "misread signals"
    ],
    "up": "Two people meeting as equals. Genuine mutual recognition.",
    "rev": "The exchange has become one-directional.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as mutual attraction expressed through feeling, attachment and the inner life — a pairing — balance, choice or tension between two.",
        "rev": "Reversed, imbalance is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, mutual attraction shapes the situation. Cups govern feeling, attachment and the inner life, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect imbalance — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to mutual attraction in matters of feeling, attachment and the inner life.",
        "rev": "Reversed, imbalance around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Water suggests mutual attraction — a pairing — balance, choice or tension between two.",
        "rev": "Reversed, imbalance. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "three-of-cups",
    "name": "Three of Cups",
    "arcana": "minor",
    "suit": "cups",
    "number": 3,
    "roman": "III",
    "emblem": "cups",
    "ink": "blue",
    "element": "Water",
    "astrology": "Summer",
    "up_keys": [
      "friendship",
      "celebration",
      "community",
      "shared joy"
    ],
    "rev_keys": [
      "isolation",
      "gossip",
      "crowded out"
    ],
    "up": "Good company. Joy that requires other people to exist.",
    "rev": "The group has turned, or you have drifted out of it.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as friendship expressed through feeling, attachment and the inner life — first growth — the idea proven in company.",
        "rev": "Reversed, isolation is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, friendship shapes the situation. Cups govern feeling, attachment and the inner life, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect isolation — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to friendship in matters of feeling, attachment and the inner life.",
        "rev": "Reversed, isolation around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Water suggests friendship — first growth — the idea proven in company.",
        "rev": "Reversed, isolation. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "four-of-cups",
    "name": "Four of Cups",
    "arcana": "minor",
    "suit": "cups",
    "number": 4,
    "roman": "IV",
    "emblem": "cups",
    "ink": "blue",
    "element": "Water",
    "astrology": "Summer",
    "up_keys": [
      "apathy",
      "withdrawal",
      "unnoticed offer",
      "discontent"
    ],
    "rev_keys": [
      "renewed interest",
      "acceptance",
      "waking up"
    ],
    "up": "Something is being offered and you cannot bring yourself to care.",
    "rev": "Interest returns. The offer is finally seen.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as apathy expressed through feeling, attachment and the inner life — consolidation — holding what has been built.",
        "rev": "Reversed, renewed interest is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, apathy shapes the situation. Cups govern feeling, attachment and the inner life, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect renewed interest — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to apathy in matters of feeling, attachment and the inner life.",
        "rev": "Reversed, renewed interest around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Water suggests apathy — consolidation — holding what has been built.",
        "rev": "Reversed, renewed interest. Treat the cause rather than the symptom."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "five-of-cups",
    "name": "Five of Cups",
    "arcana": "minor",
    "suit": "cups",
    "number": 5,
    "roman": "V",
    "emblem": "cups",
    "ink": "blue",
    "element": "Water",
    "astrology": "Summer",
    "up_keys": [
      "grief",
      "loss",
      "focus on what's gone",
      "regret"
    ],
    "rev_keys": [
      "acceptance",
      "turning around",
      "moving on"
    ],
    "up": "Real loss, and the tendency to look only at the spilled cups.",
    "rev": "You turn and notice what is still standing.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as grief expressed through feeling, attachment and the inner life — friction — loss, conflict or the cost of the middle.",
        "rev": "Reversed, acceptance is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, grief shapes the situation. Cups govern feeling, attachment and the inner life, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect acceptance — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to grief in matters of feeling, attachment and the inner life.",
        "rev": "Reversed, acceptance around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Water suggests grief — friction — loss, conflict or the cost of the middle.",
        "rev": "Reversed, acceptance. Treat the cause rather than the symptom."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "six-of-cups",
    "name": "Six of Cups",
    "arcana": "minor",
    "suit": "cups",
    "number": 6,
    "roman": "VI",
    "emblem": "cups",
    "ink": "blue",
    "element": "Water",
    "astrology": "Summer",
    "up_keys": [
      "nostalgia",
      "memory",
      "kindness",
      "the past returning"
    ],
    "rev_keys": [
      "stuck in the past",
      "idealising",
      "letting go"
    ],
    "up": "Sweetness from the past — a person, a place, an old kindness.",
    "rev": "Memory being preferred to the present.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as nostalgia expressed through feeling, attachment and the inner life — recovery — the turn back toward harmony.",
        "rev": "Reversed, stuck in the past is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, nostalgia shapes the situation. Cups govern feeling, attachment and the inner life, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect stuck in the past — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to nostalgia in matters of feeling, attachment and the inner life.",
        "rev": "Reversed, stuck in the past around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Water suggests nostalgia — recovery — the turn back toward harmony.",
        "rev": "Reversed, stuck in the past. Treat the cause rather than the symptom."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "seven-of-cups",
    "name": "Seven of Cups",
    "arcana": "minor",
    "suit": "cups",
    "number": 7,
    "roman": "VII",
    "emblem": "cups",
    "ink": "blue",
    "element": "Water",
    "astrology": "Summer",
    "up_keys": [
      "options",
      "fantasy",
      "unclear choice",
      "imagination"
    ],
    "rev_keys": [
      "clarity",
      "decision",
      "disillusion"
    ],
    "up": "Too many possibilities, most of them imagined. Choose one and test it.",
    "rev": "The fog clears and one option turns out to be real.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as options expressed through feeling, attachment and the inner life — endurance — the unglamorous middle stretch.",
        "rev": "Reversed, clarity is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, options shapes the situation. Cups govern feeling, attachment and the inner life, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect clarity — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to options in matters of feeling, attachment and the inner life.",
        "rev": "Reversed, clarity around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Water suggests options — endurance — the unglamorous middle stretch.",
        "rev": "Reversed, clarity. Treat the cause rather than the symptom."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "eight-of-cups",
    "name": "Eight of Cups",
    "arcana": "minor",
    "suit": "cups",
    "number": 8,
    "roman": "VIII",
    "emblem": "cups",
    "ink": "blue",
    "element": "Water",
    "astrology": "Summer",
    "up_keys": [
      "walking away",
      "seeking more",
      "deliberate exit",
      "disillusion"
    ],
    "rev_keys": [
      "returning",
      "drifting",
      "fear of leaving"
    ],
    "up": "Leaving something adequate because it is not enough. A sober departure.",
    "rev": "Circling back, or unable to leave despite knowing.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as walking away expressed through feeling, attachment and the inner life — momentum — skill turning into speed.",
        "rev": "Reversed, returning is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, walking away shapes the situation. Cups govern feeling, attachment and the inner life, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect returning — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to walking away in matters of feeling, attachment and the inner life.",
        "rev": "Reversed, returning around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Water suggests walking away — momentum — skill turning into speed.",
        "rev": "Reversed, returning. Treat the cause rather than the symptom."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "nine-of-cups",
    "name": "Nine of Cups",
    "arcana": "minor",
    "suit": "cups",
    "number": 9,
    "roman": "IX",
    "emblem": "cups",
    "ink": "blue",
    "element": "Water",
    "astrology": "Summer",
    "up_keys": [
      "contentment",
      "wish granted",
      "satisfaction",
      "comfort"
    ],
    "rev_keys": [
      "smugness",
      "unfulfilled",
      "shallow pleasure"
    ],
    "up": "The wish card. Satisfaction that is actually satisfying.",
    "rev": "Getting it and finding it did not fill the space.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as contentment expressed through feeling, attachment and the inner life — near-completion — the last and heaviest stretch.",
        "rev": "Reversed, smugness is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, contentment shapes the situation. Cups govern feeling, attachment and the inner life, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect smugness — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to contentment in matters of feeling, attachment and the inner life.",
        "rev": "Reversed, smugness around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Water suggests contentment — near-completion — the last and heaviest stretch.",
        "rev": "Reversed, smugness. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "ten-of-cups",
    "name": "Ten of Cups",
    "arcana": "minor",
    "suit": "cups",
    "number": 10,
    "roman": "X",
    "emblem": "cups",
    "ink": "blue",
    "element": "Water",
    "astrology": "Summer",
    "up_keys": [
      "belonging",
      "emotional completion",
      "family",
      "harmony"
    ],
    "rev_keys": [
      "fractured",
      "performed happiness",
      "distance"
    ],
    "up": "The full cup. Belonging, in whatever form is yours.",
    "rev": "The picture is intact and the feeling is not.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as belonging expressed through feeling, attachment and the inner life — completion — the full weight of the suit, for better and worse.",
        "rev": "Reversed, fractured is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, belonging shapes the situation. Cups govern feeling, attachment and the inner life, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect fractured — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to belonging in matters of feeling, attachment and the inner life.",
        "rev": "Reversed, fractured around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Water suggests belonging — completion — the full weight of the suit, for better and worse.",
        "rev": "Reversed, fractured. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "page-of-cups",
    "name": "Page of Cups",
    "arcana": "minor",
    "suit": "cups",
    "number": 11,
    "roman": "P",
    "emblem": "cups",
    "ink": "blue",
    "element": "Water",
    "astrology": "Summer",
    "up_keys": [
      "tenderness",
      "a message",
      "creative feeling",
      "sensitivity"
    ],
    "rev_keys": [
      "moodiness",
      "immaturity",
      "hurt feelings"
    ],
    "up": "A gentle message or a soft new feeling. Unguarded.",
    "rev": "Feeling everything and processing none of it.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as tenderness expressed through feeling, attachment and the inner life — the student — curiosity, messages, beginner's openness.",
        "rev": "Reversed, moodiness is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, tenderness shapes the situation. Cups govern feeling, attachment and the inner life, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect moodiness — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to tenderness in matters of feeling, attachment and the inner life.",
        "rev": "Reversed, moodiness around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Water suggests tenderness — the student — curiosity, messages, beginner's openness.",
        "rev": "Reversed, moodiness. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "knight-of-cups",
    "name": "Knight of Cups",
    "arcana": "minor",
    "suit": "cups",
    "number": 12,
    "roman": "N",
    "emblem": "cups",
    "ink": "blue",
    "element": "Water",
    "astrology": "Summer",
    "up_keys": [
      "romantic offer",
      "following the heart",
      "invitation",
      "idealism"
    ],
    "rev_keys": [
      "moodiness",
      "unrealistic",
      "empty gesture"
    ],
    "up": "An offer made with feeling. Charming and sincere.",
    "rev": "Romance as performance, or an offer that does not survive contact.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as romantic offer expressed through feeling, attachment and the inner life — the pursuer — momentum, single-mindedness, the charge.",
        "rev": "Reversed, moodiness is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, romantic offer shapes the situation. Cups govern feeling, attachment and the inner life, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect moodiness — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to romantic offer in matters of feeling, attachment and the inner life.",
        "rev": "Reversed, moodiness around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Water suggests romantic offer — the pursuer — momentum, single-mindedness, the charge.",
        "rev": "Reversed, moodiness. Treat the cause rather than the symptom."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "queen-of-cups",
    "name": "Queen of Cups",
    "arcana": "minor",
    "suit": "cups",
    "number": 13,
    "roman": "Q",
    "emblem": "cups",
    "ink": "blue",
    "element": "Water",
    "astrology": "Summer",
    "up_keys": [
      "empathy",
      "emotional depth",
      "intuition",
      "holding space"
    ],
    "rev_keys": [
      "overwhelm",
      "enmeshment",
      "martyrdom"
    ],
    "up": "Deep feeling held steadily. Care without losing yourself in it.",
    "rev": "Absorbing everyone's weather as though it were your own.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as empathy expressed through feeling, attachment and the inner life — inward mastery — holding the suit's power with depth.",
        "rev": "Reversed, overwhelm is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, empathy shapes the situation. Cups govern feeling, attachment and the inner life, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect overwhelm — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to empathy in matters of feeling, attachment and the inner life.",
        "rev": "Reversed, overwhelm around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Water suggests empathy — inward mastery — holding the suit's power with depth.",
        "rev": "Reversed, overwhelm. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "king-of-cups",
    "name": "King of Cups",
    "arcana": "minor",
    "suit": "cups",
    "number": 14,
    "roman": "K",
    "emblem": "cups",
    "ink": "blue",
    "element": "Water",
    "astrology": "Summer",
    "up_keys": [
      "emotional mastery",
      "calm",
      "diplomacy",
      "steadiness"
    ],
    "rev_keys": [
      "suppression",
      "manipulation",
      "coldness"
    ],
    "up": "Feeling fully present and fully governed. Rare and steadying.",
    "rev": "Calm that is actually distance.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as emotional mastery expressed through feeling, attachment and the inner life — outward mastery — wielding the suit's power in the world.",
        "rev": "Reversed, suppression is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, emotional mastery shapes the situation. Cups govern feeling, attachment and the inner life, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect suppression — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to emotional mastery in matters of feeling, attachment and the inner life.",
        "rev": "Reversed, suppression around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Water suggests emotional mastery — outward mastery — wielding the suit's power in the world.",
        "rev": "Reversed, suppression. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "ace-of-swords",
    "name": "Ace of Swords",
    "arcana": "minor",
    "suit": "swords",
    "number": 1,
    "roman": "I",
    "emblem": "swords",
    "ink": "slate",
    "element": "Air",
    "astrology": "Autumn",
    "up_keys": [
      "clarity",
      "breakthrough",
      "truth",
      "the clean cut"
    ],
    "rev_keys": [
      "confusion",
      "misused truth",
      "clouded"
    ],
    "up": "A clean thought that cuts through. The moment something is finally clear.",
    "rev": "Clarity that will not come, or a truth wielded as a weapon.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as clarity expressed through thought, truth and the cost of clarity — a seed — pure potential, not yet spent.",
        "rev": "Reversed, confusion is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, clarity shapes the situation. Swords govern thought, truth and the cost of clarity, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect confusion — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to clarity in matters of thought, truth and the cost of clarity.",
        "rev": "Reversed, confusion around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Air suggests clarity — a seed — pure potential, not yet spent.",
        "rev": "Reversed, confusion. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "two-of-swords",
    "name": "Two of Swords",
    "arcana": "minor",
    "suit": "swords",
    "number": 2,
    "roman": "II",
    "emblem": "swords",
    "ink": "slate",
    "element": "Air",
    "astrology": "Autumn",
    "up_keys": [
      "stalemate",
      "avoidance",
      "blocked choice",
      "blindfold"
    ],
    "rev_keys": [
      "decision",
      "information arrives",
      "overwhelm"
    ],
    "up": "A choice refused by not looking. The blindfold is self-applied.",
    "rev": "The blindfold comes off. The decision becomes possible.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as stalemate expressed through thought, truth and the cost of clarity — a pairing — balance, choice or tension between two.",
        "rev": "Reversed, decision is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, stalemate shapes the situation. Swords govern thought, truth and the cost of clarity, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect decision — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to stalemate in matters of thought, truth and the cost of clarity.",
        "rev": "Reversed, decision around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Air suggests stalemate — a pairing — balance, choice or tension between two.",
        "rev": "Reversed, decision. Treat the cause rather than the symptom."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "three-of-swords",
    "name": "Three of Swords",
    "arcana": "minor",
    "suit": "swords",
    "number": 3,
    "roman": "III",
    "emblem": "swords",
    "ink": "slate",
    "element": "Air",
    "astrology": "Autumn",
    "up_keys": [
      "heartbreak",
      "painful truth",
      "grief",
      "the clean wound"
    ],
    "rev_keys": [
      "healing",
      "forgiveness",
      "lingering pain"
    ],
    "up": "Pain from something true. It hurts precisely because it is not a lie.",
    "rev": "The wound begins to close, or refuses to.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as heartbreak expressed through thought, truth and the cost of clarity — first growth — the idea proven in company.",
        "rev": "Reversed, healing is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, heartbreak shapes the situation. Swords govern thought, truth and the cost of clarity, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect healing — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to heartbreak in matters of thought, truth and the cost of clarity.",
        "rev": "Reversed, healing around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Air suggests heartbreak — first growth — the idea proven in company.",
        "rev": "Reversed, healing. Treat the cause rather than the symptom."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "four-of-swords",
    "name": "Four of Swords",
    "arcana": "minor",
    "suit": "swords",
    "number": 4,
    "roman": "IV",
    "emblem": "swords",
    "ink": "slate",
    "element": "Air",
    "astrology": "Autumn",
    "up_keys": [
      "rest",
      "recovery",
      "retreat",
      "stillness"
    ],
    "rev_keys": [
      "restlessness",
      "burnout",
      "forced return"
    ],
    "up": "Deliberate rest. Not defeat — maintenance.",
    "rev": "Rest refused, or exhaustion that has become the condition.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as rest expressed through thought, truth and the cost of clarity — consolidation — holding what has been built.",
        "rev": "Reversed, restlessness is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, rest shapes the situation. Swords govern thought, truth and the cost of clarity, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect restlessness — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to rest in matters of thought, truth and the cost of clarity.",
        "rev": "Reversed, restlessness around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Air suggests rest — consolidation — holding what has been built.",
        "rev": "Reversed, restlessness. Treat the cause rather than the symptom."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "five-of-swords",
    "name": "Five of Swords",
    "arcana": "minor",
    "suit": "swords",
    "number": 5,
    "roman": "V",
    "emblem": "swords",
    "ink": "slate",
    "element": "Air",
    "astrology": "Autumn",
    "up_keys": [
      "hollow victory",
      "conflict",
      "winning badly",
      "cost"
    ],
    "rev_keys": [
      "reconciliation",
      "walking away",
      "lingering resentment"
    ],
    "up": "You can win this and lose more than you gain.",
    "rev": "The conflict ends — through repair or through leaving.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as hollow victory expressed through thought, truth and the cost of clarity — friction — loss, conflict or the cost of the middle.",
        "rev": "Reversed, reconciliation is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, hollow victory shapes the situation. Swords govern thought, truth and the cost of clarity, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect reconciliation — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to hollow victory in matters of thought, truth and the cost of clarity.",
        "rev": "Reversed, reconciliation around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Air suggests hollow victory — friction — loss, conflict or the cost of the middle.",
        "rev": "Reversed, reconciliation. Treat the cause rather than the symptom."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "six-of-swords",
    "name": "Six of Swords",
    "arcana": "minor",
    "suit": "swords",
    "number": 6,
    "roman": "VI",
    "emblem": "swords",
    "ink": "slate",
    "element": "Air",
    "astrology": "Autumn",
    "up_keys": [
      "transition",
      "moving on",
      "leaving trouble",
      "passage"
    ],
    "rev_keys": [
      "stuck",
      "carrying baggage",
      "resisted move"
    ],
    "up": "Leaving rough water for calmer. Sad, necessary, correct.",
    "rev": "The move keeps being postponed, or is made without unpacking.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as transition expressed through thought, truth and the cost of clarity — recovery — the turn back toward harmony.",
        "rev": "Reversed, stuck is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, transition shapes the situation. Swords govern thought, truth and the cost of clarity, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect stuck — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to transition in matters of thought, truth and the cost of clarity.",
        "rev": "Reversed, stuck around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Air suggests transition — recovery — the turn back toward harmony.",
        "rev": "Reversed, stuck. Treat the cause rather than the symptom."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "seven-of-swords",
    "name": "Seven of Swords",
    "arcana": "minor",
    "suit": "swords",
    "number": 7,
    "roman": "VII",
    "emblem": "swords",
    "ink": "slate",
    "element": "Air",
    "astrology": "Autumn",
    "up_keys": [
      "strategy",
      "concealment",
      "getting away with it",
      "cunning"
    ],
    "rev_keys": [
      "exposure",
      "confession",
      "returning what was taken"
    ],
    "up": "Acting alone and not entirely openly. Effective, and it has a cost.",
    "rev": "It comes to light — or you bring it to light first.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as strategy expressed through thought, truth and the cost of clarity — endurance — the unglamorous middle stretch.",
        "rev": "Reversed, exposure is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, strategy shapes the situation. Swords govern thought, truth and the cost of clarity, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect exposure — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to strategy in matters of thought, truth and the cost of clarity.",
        "rev": "Reversed, exposure around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Air suggests strategy — endurance — the unglamorous middle stretch.",
        "rev": "Reversed, exposure. Treat the cause rather than the symptom."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "eight-of-swords",
    "name": "Eight of Swords",
    "arcana": "minor",
    "suit": "swords",
    "number": 8,
    "roman": "VIII",
    "emblem": "swords",
    "ink": "slate",
    "element": "Air",
    "astrology": "Autumn",
    "up_keys": [
      "restriction",
      "self-limitation",
      "trapped thinking",
      "bound"
    ],
    "rev_keys": [
      "release",
      "seeing the exit",
      "new perspective"
    ],
    "up": "Trapped mostly by the belief in the trap. The bindings are loose.",
    "rev": "The way out becomes visible and it was always there.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as restriction expressed through thought, truth and the cost of clarity — momentum — skill turning into speed.",
        "rev": "Reversed, release is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, restriction shapes the situation. Swords govern thought, truth and the cost of clarity, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect release — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to restriction in matters of thought, truth and the cost of clarity.",
        "rev": "Reversed, release around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Air suggests restriction — momentum — skill turning into speed.",
        "rev": "Reversed, release. Treat the cause rather than the symptom."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "nine-of-swords",
    "name": "Nine of Swords",
    "arcana": "minor",
    "suit": "swords",
    "number": 9,
    "roman": "IX",
    "emblem": "swords",
    "ink": "slate",
    "element": "Air",
    "astrology": "Autumn",
    "up_keys": [
      "anxiety",
      "sleepless worry",
      "dread",
      "night thoughts"
    ],
    "rev_keys": [
      "relief",
      "perspective",
      "help arriving"
    ],
    "up": "The three-a.m. card. The fear is larger at night than it is in daylight.",
    "rev": "The dread lifts. It was mostly anticipation.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as anxiety expressed through thought, truth and the cost of clarity — near-completion — the last and heaviest stretch.",
        "rev": "Reversed, relief is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, anxiety shapes the situation. Swords govern thought, truth and the cost of clarity, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect relief — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to anxiety in matters of thought, truth and the cost of clarity.",
        "rev": "Reversed, relief around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Air suggests anxiety — near-completion — the last and heaviest stretch.",
        "rev": "Reversed, relief. Treat the cause rather than the symptom."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "ten-of-swords",
    "name": "Ten of Swords",
    "arcana": "minor",
    "suit": "swords",
    "number": 10,
    "roman": "X",
    "emblem": "swords",
    "ink": "slate",
    "element": "Air",
    "astrology": "Autumn",
    "up_keys": [
      "ending",
      "rock bottom",
      "the worst of it",
      "release"
    ],
    "rev_keys": [
      "recovery",
      "survival",
      "slow healing"
    ],
    "up": "It is as bad as it gets, and that means it is over.",
    "rev": "The recovery begins. Slow, but genuinely upward.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as ending expressed through thought, truth and the cost of clarity — completion — the full weight of the suit, for better and worse.",
        "rev": "Reversed, recovery is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, ending shapes the situation. Swords govern thought, truth and the cost of clarity, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect recovery — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to ending in matters of thought, truth and the cost of clarity.",
        "rev": "Reversed, recovery around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Air suggests ending — completion — the full weight of the suit, for better and worse.",
        "rev": "Reversed, recovery. Treat the cause rather than the symptom."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "page-of-swords",
    "name": "Page of Swords",
    "arcana": "minor",
    "suit": "swords",
    "number": 11,
    "roman": "P",
    "emblem": "swords",
    "ink": "slate",
    "element": "Air",
    "astrology": "Autumn",
    "up_keys": [
      "curiosity",
      "vigilance",
      "new ideas",
      "questions"
    ],
    "rev_keys": [
      "gossip",
      "scattered thinking",
      "defensiveness"
    ],
    "up": "Sharp curiosity. Asking the questions others avoid.",
    "rev": "Thinking that has turned suspicious or scattered.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as curiosity expressed through thought, truth and the cost of clarity — the student — curiosity, messages, beginner's openness.",
        "rev": "Reversed, gossip is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, curiosity shapes the situation. Swords govern thought, truth and the cost of clarity, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect gossip — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to curiosity in matters of thought, truth and the cost of clarity.",
        "rev": "Reversed, gossip around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Air suggests curiosity — the student — curiosity, messages, beginner's openness.",
        "rev": "Reversed, gossip. Treat the cause rather than the symptom."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "knight-of-swords",
    "name": "Knight of Swords",
    "arcana": "minor",
    "suit": "swords",
    "number": 12,
    "roman": "N",
    "emblem": "swords",
    "ink": "slate",
    "element": "Air",
    "astrology": "Autumn",
    "up_keys": [
      "directness",
      "haste",
      "argument",
      "charging in"
    ],
    "rev_keys": [
      "aggression",
      "rashness",
      "burnout"
    ],
    "up": "Straight at it, fast, without diplomacy. Effective and abrasive.",
    "rev": "Speed that leaves damage. Slow down.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as directness expressed through thought, truth and the cost of clarity — the pursuer — momentum, single-mindedness, the charge.",
        "rev": "Reversed, aggression is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, directness shapes the situation. Swords govern thought, truth and the cost of clarity, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect aggression — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to directness in matters of thought, truth and the cost of clarity.",
        "rev": "Reversed, aggression around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Air suggests directness — the pursuer — momentum, single-mindedness, the charge.",
        "rev": "Reversed, aggression. Treat the cause rather than the symptom."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "queen-of-swords",
    "name": "Queen of Swords",
    "arcana": "minor",
    "suit": "swords",
    "number": 13,
    "roman": "Q",
    "emblem": "swords",
    "ink": "slate",
    "element": "Air",
    "astrology": "Autumn",
    "up_keys": [
      "perceptiveness",
      "honesty",
      "independence",
      "clear boundaries"
    ],
    "rev_keys": [
      "coldness",
      "bitterness",
      "harsh judgement"
    ],
    "up": "Clear-eyed and unsentimental. Honest in a way that helps.",
    "rev": "Honesty hardened into edge.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as perceptiveness expressed through thought, truth and the cost of clarity — inward mastery — holding the suit's power with depth.",
        "rev": "Reversed, coldness is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, perceptiveness shapes the situation. Swords govern thought, truth and the cost of clarity, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect coldness — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to perceptiveness in matters of thought, truth and the cost of clarity.",
        "rev": "Reversed, coldness around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Air suggests perceptiveness — inward mastery — holding the suit's power with depth.",
        "rev": "Reversed, coldness. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "king-of-swords",
    "name": "King of Swords",
    "arcana": "minor",
    "suit": "swords",
    "number": 14,
    "roman": "K",
    "emblem": "swords",
    "ink": "slate",
    "element": "Air",
    "astrology": "Autumn",
    "up_keys": [
      "authority",
      "intellect",
      "judgement",
      "principle"
    ],
    "rev_keys": [
      "rigidity",
      "harshness",
      "abuse of position"
    ],
    "up": "Reason exercised with authority. Fair, exacting, unsentimental.",
    "rev": "Principle without mercy.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as authority expressed through thought, truth and the cost of clarity — outward mastery — wielding the suit's power in the world.",
        "rev": "Reversed, rigidity is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, authority shapes the situation. Swords govern thought, truth and the cost of clarity, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect rigidity — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to authority in matters of thought, truth and the cost of clarity.",
        "rev": "Reversed, rigidity around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Air suggests authority — outward mastery — wielding the suit's power in the world.",
        "rev": "Reversed, rigidity. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "ace-of-pentacles",
    "name": "Ace of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "number": 1,
    "roman": "I",
    "emblem": "pentacles",
    "ink": "green",
    "element": "Earth",
    "astrology": "Winter",
    "up_keys": [
      "opportunity",
      "seed money",
      "tangible start",
      "offer"
    ],
    "rev_keys": [
      "missed chance",
      "poor timing",
      "unstable start"
    ],
    "up": "A concrete, material opening. Small now, real later.",
    "rev": "The opening closes, or arrives on bad ground.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as opportunity expressed through work, body and material security — a seed — pure potential, not yet spent.",
        "rev": "Reversed, missed chance is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, opportunity shapes the situation. Pentacles govern work, body and material security, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect missed chance — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to opportunity in matters of work, body and material security.",
        "rev": "Reversed, missed chance around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Earth suggests opportunity — a seed — pure potential, not yet spent.",
        "rev": "Reversed, missed chance. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "two-of-pentacles",
    "name": "Two of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "number": 2,
    "roman": "II",
    "emblem": "pentacles",
    "ink": "green",
    "element": "Earth",
    "astrology": "Winter",
    "up_keys": [
      "juggling",
      "adaptability",
      "balance",
      "flexibility"
    ],
    "rev_keys": [
      "overwhelm",
      "dropped ball",
      "disorganisation"
    ],
    "up": "Keeping several things in the air, competently.",
    "rev": "One too many. Something is about to fall.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as juggling expressed through work, body and material security — a pairing — balance, choice or tension between two.",
        "rev": "Reversed, overwhelm is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, juggling shapes the situation. Pentacles govern work, body and material security, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect overwhelm — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to juggling in matters of work, body and material security.",
        "rev": "Reversed, overwhelm around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Earth suggests juggling — a pairing — balance, choice or tension between two.",
        "rev": "Reversed, overwhelm. Treat the cause rather than the symptom."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "three-of-pentacles",
    "name": "Three of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "number": 3,
    "roman": "III",
    "emblem": "pentacles",
    "ink": "green",
    "element": "Earth",
    "astrology": "Winter",
    "up_keys": [
      "craft",
      "collaboration",
      "skill recognised",
      "building"
    ],
    "rev_keys": [
      "poor teamwork",
      "mediocrity",
      "unrecognised skill"
    ],
    "up": "Skilled work done with others who can see it is skilled.",
    "rev": "The collaboration is not working, or the craft is being wasted.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as craft expressed through work, body and material security — first growth — the idea proven in company.",
        "rev": "Reversed, poor teamwork is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, craft shapes the situation. Pentacles govern work, body and material security, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect poor teamwork — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to craft in matters of work, body and material security.",
        "rev": "Reversed, poor teamwork around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Earth suggests craft — first growth — the idea proven in company.",
        "rev": "Reversed, poor teamwork. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "four-of-pentacles",
    "name": "Four of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "number": 4,
    "roman": "IV",
    "emblem": "pentacles",
    "ink": "green",
    "element": "Earth",
    "astrology": "Winter",
    "up_keys": [
      "holding on",
      "security",
      "saving",
      "control"
    ],
    "rev_keys": [
      "release",
      "generosity",
      "loosening"
    ],
    "up": "Keeping tight hold. Prudent, and it can become a cage.",
    "rev": "The grip loosens — willingly or otherwise.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as holding on expressed through work, body and material security — consolidation — holding what has been built.",
        "rev": "Reversed, release is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, holding on shapes the situation. Pentacles govern work, body and material security, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect release — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to holding on in matters of work, body and material security.",
        "rev": "Reversed, release around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Earth suggests holding on — consolidation — holding what has been built.",
        "rev": "Reversed, release. Treat the cause rather than the symptom."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "five-of-pentacles",
    "name": "Five of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "number": 5,
    "roman": "V",
    "emblem": "pentacles",
    "ink": "green",
    "element": "Earth",
    "astrology": "Winter",
    "up_keys": [
      "hardship",
      "exclusion",
      "scarcity",
      "the closed door"
    ],
    "rev_keys": [
      "recovery",
      "help found",
      "coming inside"
    ],
    "up": "Material or social hardship, made worse by feeling shut out.",
    "rev": "Help appears. The door was not locked.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as hardship expressed through work, body and material security — friction — loss, conflict or the cost of the middle.",
        "rev": "Reversed, recovery is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, hardship shapes the situation. Pentacles govern work, body and material security, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect recovery — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to hardship in matters of work, body and material security.",
        "rev": "Reversed, recovery around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Earth suggests hardship — friction — loss, conflict or the cost of the middle.",
        "rev": "Reversed, recovery. Treat the cause rather than the symptom."
      }
    },
    "yesno": "no"
  },
  {
    "slug": "six-of-pentacles",
    "name": "Six of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "number": 6,
    "roman": "VI",
    "emblem": "pentacles",
    "ink": "green",
    "element": "Earth",
    "astrology": "Winter",
    "up_keys": [
      "generosity",
      "give and take",
      "support",
      "fair exchange"
    ],
    "rev_keys": [
      "strings attached",
      "imbalance",
      "debt"
    ],
    "up": "Resources moving where they are needed. Fair on both sides.",
    "rev": "Generosity with terms, or dependence forming.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as generosity expressed through work, body and material security — recovery — the turn back toward harmony.",
        "rev": "Reversed, strings attached is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, generosity shapes the situation. Pentacles govern work, body and material security, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect strings attached — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to generosity in matters of work, body and material security.",
        "rev": "Reversed, strings attached around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Earth suggests generosity — recovery — the turn back toward harmony.",
        "rev": "Reversed, strings attached. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "seven-of-pentacles",
    "name": "Seven of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "number": 7,
    "roman": "VII",
    "emblem": "pentacles",
    "ink": "green",
    "element": "Earth",
    "astrology": "Winter",
    "up_keys": [
      "patience",
      "assessment",
      "slow growth",
      "the long look"
    ],
    "rev_keys": [
      "impatience",
      "wasted effort",
      "poor return"
    ],
    "up": "Standing back to assess what has grown. Nothing to do but wait well.",
    "rev": "The return is not worth the input. Reconsider.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as patience expressed through work, body and material security — endurance — the unglamorous middle stretch.",
        "rev": "Reversed, impatience is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, patience shapes the situation. Pentacles govern work, body and material security, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect impatience — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to patience in matters of work, body and material security.",
        "rev": "Reversed, impatience around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Earth suggests patience — endurance — the unglamorous middle stretch.",
        "rev": "Reversed, impatience. Treat the cause rather than the symptom."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "eight-of-pentacles",
    "name": "Eight of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "number": 8,
    "roman": "VIII",
    "emblem": "pentacles",
    "ink": "green",
    "element": "Earth",
    "astrology": "Winter",
    "up_keys": [
      "diligence",
      "practice",
      "craft",
      "repetition"
    ],
    "rev_keys": [
      "drudgery",
      "perfectionism",
      "cutting corners"
    ],
    "up": "Repetition turning into mastery. Unglamorous and compounding.",
    "rev": "Repetition without progress, or standards that block shipping.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as diligence expressed through work, body and material security — momentum — skill turning into speed.",
        "rev": "Reversed, drudgery is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, diligence shapes the situation. Pentacles govern work, body and material security, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect drudgery — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to diligence in matters of work, body and material security.",
        "rev": "Reversed, drudgery around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Earth suggests diligence — momentum — skill turning into speed.",
        "rev": "Reversed, drudgery. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "nine-of-pentacles",
    "name": "Nine of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "number": 9,
    "roman": "IX",
    "emblem": "pentacles",
    "ink": "green",
    "element": "Earth",
    "astrology": "Winter",
    "up_keys": [
      "self-sufficiency",
      "earned comfort",
      "independence",
      "refinement"
    ],
    "rev_keys": [
      "dependence",
      "hollow luxury",
      "isolation"
    ],
    "up": "Comfort you built yourself, enjoyed without apology.",
    "rev": "Security that depends on someone else, or on appearances.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as self-sufficiency expressed through work, body and material security — near-completion — the last and heaviest stretch.",
        "rev": "Reversed, dependence is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, self-sufficiency shapes the situation. Pentacles govern work, body and material security, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect dependence — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to self-sufficiency in matters of work, body and material security.",
        "rev": "Reversed, dependence around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Earth suggests self-sufficiency — near-completion — the last and heaviest stretch.",
        "rev": "Reversed, dependence. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "ten-of-pentacles",
    "name": "Ten of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "number": 10,
    "roman": "X",
    "emblem": "pentacles",
    "ink": "green",
    "element": "Earth",
    "astrology": "Winter",
    "up_keys": [
      "legacy",
      "lasting wealth",
      "family",
      "the long structure"
    ],
    "rev_keys": [
      "instability",
      "family friction",
      "short-termism"
    ],
    "up": "Wealth that outlasts you — material, familial, structural.",
    "rev": "The foundation has a crack in it. Usually a relational one.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as legacy expressed through work, body and material security — completion — the full weight of the suit, for better and worse.",
        "rev": "Reversed, instability is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, legacy shapes the situation. Pentacles govern work, body and material security, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect instability — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to legacy in matters of work, body and material security.",
        "rev": "Reversed, instability around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Earth suggests legacy — completion — the full weight of the suit, for better and worse.",
        "rev": "Reversed, instability. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "page-of-pentacles",
    "name": "Page of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "number": 11,
    "roman": "P",
    "emblem": "pentacles",
    "ink": "green",
    "element": "Earth",
    "astrology": "Winter",
    "up_keys": [
      "study",
      "new venture",
      "practical curiosity",
      "an offer"
    ],
    "rev_keys": [
      "distraction",
      "procrastination",
      "unrealistic plan"
    ],
    "up": "A practical new beginning approached studiously.",
    "rev": "Plans that stay plans.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as study expressed through work, body and material security — the student — curiosity, messages, beginner's openness.",
        "rev": "Reversed, distraction is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, study shapes the situation. Pentacles govern work, body and material security, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect distraction — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to study in matters of work, body and material security.",
        "rev": "Reversed, distraction around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Earth suggests study — the student — curiosity, messages, beginner's openness.",
        "rev": "Reversed, distraction. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "knight-of-pentacles",
    "name": "Knight of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "number": 12,
    "roman": "N",
    "emblem": "pentacles",
    "ink": "green",
    "element": "Earth",
    "astrology": "Winter",
    "up_keys": [
      "steadiness",
      "reliability",
      "method",
      "slow progress"
    ],
    "rev_keys": [
      "stagnation",
      "stubbornness",
      "boredom"
    ],
    "up": "The slowest knight and the one that arrives. Utterly dependable.",
    "rev": "Steadiness that has become inertia.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as steadiness expressed through work, body and material security — the pursuer — momentum, single-mindedness, the charge.",
        "rev": "Reversed, stagnation is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, steadiness shapes the situation. Pentacles govern work, body and material security, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect stagnation — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to steadiness in matters of work, body and material security.",
        "rev": "Reversed, stagnation around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Earth suggests steadiness — the pursuer — momentum, single-mindedness, the charge.",
        "rev": "Reversed, stagnation. Treat the cause rather than the symptom."
      }
    },
    "yesno": "maybe"
  },
  {
    "slug": "queen-of-pentacles",
    "name": "Queen of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "number": 13,
    "roman": "Q",
    "emblem": "pentacles",
    "ink": "green",
    "element": "Earth",
    "astrology": "Winter",
    "up_keys": [
      "practical care",
      "resourcefulness",
      "groundedness",
      "provision"
    ],
    "rev_keys": [
      "overwork",
      "smothering",
      "self-neglect"
    ],
    "up": "Care expressed as competence. Things get handled.",
    "rev": "Providing for everyone and provisioning nothing for yourself.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as practical care expressed through work, body and material security — inward mastery — holding the suit's power with depth.",
        "rev": "Reversed, overwork is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, practical care shapes the situation. Pentacles govern work, body and material security, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect overwork — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to practical care in matters of work, body and material security.",
        "rev": "Reversed, overwork around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Earth suggests practical care — inward mastery — holding the suit's power with depth.",
        "rev": "Reversed, overwork. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  },
  {
    "slug": "king-of-pentacles",
    "name": "King of Pentacles",
    "arcana": "minor",
    "suit": "pentacles",
    "number": 14,
    "roman": "K",
    "emblem": "pentacles",
    "ink": "green",
    "element": "Earth",
    "astrology": "Winter",
    "up_keys": [
      "prosperity",
      "stewardship",
      "reliability",
      "built wealth"
    ],
    "rev_keys": [
      "greed",
      "rigidity",
      "materialism"
    ],
    "up": "Abundance held responsibly. Built slowly, managed well.",
    "rev": "Wealth as identity, or control dressed as stewardship.",
    "ctx": {
      "love": {
        "up": "In relationships this reads as prosperity expressed through work, body and material security — outward mastery — wielding the suit's power in the world.",
        "rev": "Reversed, greed is the theme: the same energy turned inward or withheld."
      },
      "career": {
        "up": "At work, prosperity shapes the situation. Pentacles govern work, body and material security, so the pressure point is practical rather than abstract.",
        "rev": "Reversed, expect greed — the effort is present but not converting."
      },
      "money": {
        "up": "Financially this points to prosperity in matters of work, body and material security.",
        "rev": "Reversed, greed around resources. Review before you commit."
      },
      "health": {
        "up": "For body and energy, Earth suggests prosperity — outward mastery — wielding the suit's power in the world.",
        "rev": "Reversed, greed. Treat the cause rather than the symptom."
      }
    },
    "yesno": "yes"
  }
]

export const SPREADS: Record<string, Spread> = {
  "daily": {
    "slug": "daily",
    "name": "Daily Draw",
    "count": 1,
    "tier": "free",
    "blurb": "One card for today. The fastest useful reading in the deck.",
    "positions": [
      {
        "name": "Today",
        "note": "The energy shaping the day and what it asks of you."
      }
    ]
  },
  "three-card": {
    "slug": "three-card",
    "name": "Past · Present · Future",
    "count": 3,
    "tier": "free",
    "blurb": "The classic three-card line. Enough structure to see a trajectory.",
    "positions": [
      {
        "name": "Past",
        "note": "What formed this situation and still exerts a pull."
      },
      {
        "name": "Present",
        "note": "Where things actually stand right now."
      },
      {
        "name": "Future",
        "note": "Where this trajectory leads if nothing changes."
      }
    ]
  },
  "yes-no": {
    "slug": "yes-no",
    "name": "Yes or No",
    "count": 1,
    "tier": "free",
    "blurb": "A single card read for direction, with the reasoning shown.",
    "positions": [
      {
        "name": "The Answer",
        "note": "The direction the card points, and why."
      }
    ]
  },
  "situation": {
    "slug": "situation",
    "name": "Situation · Action · Outcome",
    "count": 3,
    "tier": "free",
    "blurb": "For when you need a decision rather than a description.",
    "positions": [
      {
        "name": "Situation",
        "note": "What is actually happening, beneath the story about it."
      },
      {
        "name": "Action",
        "note": "The move that changes something."
      },
      {
        "name": "Outcome",
        "note": "What that action tends toward."
      }
    ]
  },
  "relationship": {
    "slug": "relationship",
    "name": "Relationship Spread",
    "count": 5,
    "tier": "member",
    "blurb": "Five cards on the space between two people.",
    "positions": [
      {
        "name": "You",
        "note": "What you bring, including what you do not say."
      },
      {
        "name": "Them",
        "note": "What they bring, as far as the cards can see it."
      },
      {
        "name": "The Bond",
        "note": "What actually connects you."
      },
      {
        "name": "The Friction",
        "note": "What keeps catching."
      },
      {
        "name": "Direction",
        "note": "Where this is heading on current terms."
      }
    ]
  },
  "celtic-cross": {
    "slug": "celtic-cross",
    "name": "Celtic Cross",
    "count": 10,
    "tier": "member",
    "blurb": "Ten cards. The deep reading — context, obstacle, history and outcome.",
    "positions": [
      {
        "name": "The Heart",
        "note": "The core of the matter."
      },
      {
        "name": "The Crossing",
        "note": "What obstructs or complicates it."
      },
      {
        "name": "The Root",
        "note": "The foundation beneath, often unexamined."
      },
      {
        "name": "The Past",
        "note": "What is passing out of influence."
      },
      {
        "name": "The Crown",
        "note": "What you are conscious of wanting."
      },
      {
        "name": "The Near Future",
        "note": "What arrives next."
      },
      {
        "name": "Yourself",
        "note": "How you are actually showing up."
      },
      {
        "name": "Environment",
        "note": "The people and conditions around this."
      },
      {
        "name": "Hopes & Fears",
        "note": "The thing you both want and dread."
      },
      {
        "name": "Outcome",
        "note": "Where this resolves on the present course."
      }
    ]
  }
}

export const CORRESPONDENCES: Record<string, Correspondence> = {
  "the-fool": {
    "colour": "Electric Blue",
    "hex": "#3C6FD1",
    "stone": "Labradorite",
    "metal": "Platinum",
    "source": "Uranus, its traditional attribution"
  },
  "the-magician": {
    "colour": "Citrine Yellow",
    "hex": "#D9A521",
    "stone": "Citrine",
    "metal": "Quicksilver",
    "source": "Mercury, its traditional attribution"
  },
  "the-high-priestess": {
    "colour": "Pearl White",
    "hex": "#DDD8C8",
    "stone": "Moonstone",
    "metal": "Silver",
    "source": "Moon, its traditional attribution"
  },
  "the-empress": {
    "colour": "Verdant Green",
    "hex": "#5F7F55",
    "stone": "Rose Quartz",
    "metal": "Copper",
    "source": "Venus, its traditional attribution"
  },
  "the-emperor": {
    "colour": "Scarlet",
    "hex": "#B4442F",
    "stone": "Carnelian",
    "metal": "Iron",
    "source": "Aries, its traditional attribution"
  },
  "the-hierophant": {
    "colour": "Moss Green",
    "hex": "#6E7F4F",
    "stone": "Emerald",
    "metal": "Copper",
    "source": "Taurus, its traditional attribution"
  },
  "the-lovers": {
    "colour": "Pale Straw",
    "hex": "#D8C97E",
    "stone": "Agate",
    "metal": "Quicksilver",
    "source": "Gemini, its traditional attribution"
  },
  "the-chariot": {
    "colour": "Silver Grey",
    "hex": "#A9B2B8",
    "stone": "Pearl",
    "metal": "Silver",
    "source": "Cancer, its traditional attribution"
  },
  "strength": {
    "colour": "Gold",
    "hex": "#D9A521",
    "stone": "Tiger's Eye",
    "metal": "Gold",
    "source": "Leo, its traditional attribution"
  },
  "the-hermit": {
    "colour": "Slate Navy",
    "hex": "#4A5568",
    "stone": "Peridot",
    "metal": "Quicksilver",
    "source": "Virgo, its traditional attribution"
  },
  "wheel-of-fortune": {
    "colour": "Royal Blue",
    "hex": "#3D6390",
    "stone": "Lapis Lazuli",
    "metal": "Tin",
    "source": "Jupiter, its traditional attribution"
  },
  "justice": {
    "colour": "Dusty Rose",
    "hex": "#C08A8A",
    "stone": "Jade",
    "metal": "Copper",
    "source": "Libra, its traditional attribution"
  },
  "the-hanged-man": {
    "colour": "Sea Green",
    "hex": "#5B8C86",
    "stone": "Aquamarine",
    "metal": "Platinum",
    "source": "Neptune, its traditional attribution"
  },
  "death": {
    "colour": "Deep Crimson",
    "hex": "#8A2B33",
    "stone": "Obsidian",
    "metal": "Iron",
    "source": "Scorpio, its traditional attribution"
  },
  "temperance": {
    "colour": "Burnt Orange",
    "hex": "#C4763A",
    "stone": "Turquoise",
    "metal": "Tin",
    "source": "Sagittarius, its traditional attribution"
  },
  "the-devil": {
    "colour": "Charcoal",
    "hex": "#40423F",
    "stone": "Onyx",
    "metal": "Lead",
    "source": "Capricorn, its traditional attribution"
  },
  "the-tower": {
    "colour": "Ember Red",
    "hex": "#A8352A",
    "stone": "Red Jasper",
    "metal": "Iron",
    "source": "Mars, its traditional attribution"
  },
  "the-star": {
    "colour": "Ice Blue",
    "hex": "#7FA3C4",
    "stone": "Amethyst",
    "metal": "Platinum",
    "source": "Aquarius, its traditional attribution"
  },
  "the-moon": {
    "colour": "Sea Foam",
    "hex": "#7FA396",
    "stone": "Amethyst",
    "metal": "Tin",
    "source": "Pisces, its traditional attribution"
  },
  "the-sun": {
    "colour": "Sun Gold",
    "hex": "#E0AD2A",
    "stone": "Sunstone",
    "metal": "Gold",
    "source": "Sun, its traditional attribution"
  },
  "judgement": {
    "colour": "Void Black",
    "hex": "#2A2724",
    "stone": "Black Tourmaline",
    "metal": "Lead",
    "source": "Pluto, its traditional attribution"
  },
  "the-world": {
    "colour": "Indigo",
    "hex": "#3B3F63",
    "stone": "Jet",
    "metal": "Lead",
    "source": "Saturn, its traditional attribution"
  },
  "ace-of-wands": {
    "colour": "Kindling Amber",
    "hex": "#E3A33C",
    "stone": "Carnelian",
    "metal": "Iron",
    "source": "Wands and the element Fire"
  },
  "two-of-wands": {
    "colour": "Copper Flame",
    "hex": "#C4763A",
    "stone": "Sunstone",
    "metal": "Iron",
    "source": "Wands and the element Fire"
  },
  "three-of-wands": {
    "colour": "Copper Flame",
    "hex": "#C4763A",
    "stone": "Sunstone",
    "metal": "Iron",
    "source": "Wands and the element Fire"
  },
  "four-of-wands": {
    "colour": "Scarlet",
    "hex": "#B4442F",
    "stone": "Red Jasper",
    "metal": "Iron",
    "source": "Wands and the element Fire"
  },
  "five-of-wands": {
    "colour": "Scarlet",
    "hex": "#B4442F",
    "stone": "Red Jasper",
    "metal": "Iron",
    "source": "Wands and the element Fire"
  },
  "six-of-wands": {
    "colour": "Ember Red",
    "hex": "#A8352A",
    "stone": "Garnet",
    "metal": "Iron",
    "source": "Wands and the element Fire"
  },
  "seven-of-wands": {
    "colour": "Ember Red",
    "hex": "#A8352A",
    "stone": "Garnet",
    "metal": "Iron",
    "source": "Wands and the element Fire"
  },
  "eight-of-wands": {
    "colour": "Rust",
    "hex": "#8F4A2E",
    "stone": "Tiger's Eye",
    "metal": "Iron",
    "source": "Wands and the element Fire"
  },
  "nine-of-wands": {
    "colour": "Rust",
    "hex": "#8F4A2E",
    "stone": "Tiger's Eye",
    "metal": "Iron",
    "source": "Wands and the element Fire"
  },
  "ten-of-wands": {
    "colour": "Burnt Umber",
    "hex": "#6E3B26",
    "stone": "Smoky Quartz",
    "metal": "Iron",
    "source": "Wands and the element Fire"
  },
  "page-of-wands": {
    "colour": "Bright Ochre",
    "hex": "#D18B2C",
    "stone": "Amber",
    "metal": "Iron",
    "source": "Wands and the element Fire"
  },
  "knight-of-wands": {
    "colour": "Bright Ochre",
    "hex": "#D18B2C",
    "stone": "Amber",
    "metal": "Iron",
    "source": "Wands and the element Fire"
  },
  "queen-of-wands": {
    "colour": "Deep Gold",
    "hex": "#B8842A",
    "stone": "Citrine",
    "metal": "Iron",
    "source": "Wands and the element Fire"
  },
  "king-of-wands": {
    "colour": "Deep Gold",
    "hex": "#B8842A",
    "stone": "Citrine",
    "metal": "Iron",
    "source": "Wands and the element Fire"
  },
  "ace-of-cups": {
    "colour": "Spring Water",
    "hex": "#8FB6C9",
    "stone": "Moonstone",
    "metal": "Silver",
    "source": "Cups and the element Water"
  },
  "two-of-cups": {
    "colour": "Cornflower",
    "hex": "#5F87B8",
    "stone": "Aquamarine",
    "metal": "Silver",
    "source": "Cups and the element Water"
  },
  "three-of-cups": {
    "colour": "Cornflower",
    "hex": "#5F87B8",
    "stone": "Aquamarine",
    "metal": "Silver",
    "source": "Cups and the element Water"
  },
  "four-of-cups": {
    "colour": "Slate Blue",
    "hex": "#4A6E92",
    "stone": "Sodalite",
    "metal": "Silver",
    "source": "Cups and the element Water"
  },
  "five-of-cups": {
    "colour": "Slate Blue",
    "hex": "#4A6E92",
    "stone": "Sodalite",
    "metal": "Silver",
    "source": "Cups and the element Water"
  },
  "six-of-cups": {
    "colour": "Royal Blue",
    "hex": "#3D6390",
    "stone": "Lapis Lazuli",
    "metal": "Silver",
    "source": "Cups and the element Water"
  },
  "seven-of-cups": {
    "colour": "Royal Blue",
    "hex": "#3D6390",
    "stone": "Lapis Lazuli",
    "metal": "Silver",
    "source": "Cups and the element Water"
  },
  "eight-of-cups": {
    "colour": "Deep Sea",
    "hex": "#2E4F70",
    "stone": "Blue Lace Agate",
    "metal": "Silver",
    "source": "Cups and the element Water"
  },
  "nine-of-cups": {
    "colour": "Deep Sea",
    "hex": "#2E4F70",
    "stone": "Blue Lace Agate",
    "metal": "Silver",
    "source": "Cups and the element Water"
  },
  "ten-of-cups": {
    "colour": "Midnight Blue",
    "hex": "#25405C",
    "stone": "Sapphire",
    "metal": "Silver",
    "source": "Cups and the element Water"
  },
  "page-of-cups": {
    "colour": "Pale Aqua",
    "hex": "#7FA9AE",
    "stone": "Chalcedony",
    "metal": "Silver",
    "source": "Cups and the element Water"
  },
  "knight-of-cups": {
    "colour": "Pale Aqua",
    "hex": "#7FA9AE",
    "stone": "Chalcedony",
    "metal": "Silver",
    "source": "Cups and the element Water"
  },
  "queen-of-cups": {
    "colour": "Teal",
    "hex": "#3E6E74",
    "stone": "Larimar",
    "metal": "Silver",
    "source": "Cups and the element Water"
  },
  "king-of-cups": {
    "colour": "Teal",
    "hex": "#3E6E74",
    "stone": "Larimar",
    "metal": "Silver",
    "source": "Cups and the element Water"
  },
  "ace-of-swords": {
    "colour": "Clear Silver",
    "hex": "#C2C7CB",
    "stone": "Clear Quartz",
    "metal": "Tin",
    "source": "Swords and the element Air"
  },
  "two-of-swords": {
    "colour": "Ash Grey",
    "hex": "#9AA0A6",
    "stone": "Howlite",
    "metal": "Tin",
    "source": "Swords and the element Air"
  },
  "three-of-swords": {
    "colour": "Ash Grey",
    "hex": "#9AA0A6",
    "stone": "Howlite",
    "metal": "Tin",
    "source": "Swords and the element Air"
  },
  "four-of-swords": {
    "colour": "Slate",
    "hex": "#6B7078",
    "stone": "Hematite",
    "metal": "Tin",
    "source": "Swords and the element Air"
  },
  "five-of-swords": {
    "colour": "Slate",
    "hex": "#6B7078",
    "stone": "Hematite",
    "metal": "Tin",
    "source": "Swords and the element Air"
  },
  "six-of-swords": {
    "colour": "Storm Grey",
    "hex": "#585E66",
    "stone": "Fluorite",
    "metal": "Tin",
    "source": "Swords and the element Air"
  },
  "seven-of-swords": {
    "colour": "Storm Grey",
    "hex": "#585E66",
    "stone": "Fluorite",
    "metal": "Tin",
    "source": "Swords and the element Air"
  },
  "eight-of-swords": {
    "colour": "Iron Grey",
    "hex": "#474C54",
    "stone": "Obsidian",
    "metal": "Tin",
    "source": "Swords and the element Air"
  },
  "nine-of-swords": {
    "colour": "Iron Grey",
    "hex": "#474C54",
    "stone": "Obsidian",
    "metal": "Tin",
    "source": "Swords and the element Air"
  },
  "ten-of-swords": {
    "colour": "Charcoal",
    "hex": "#3A3E44",
    "stone": "Black Tourmaline",
    "metal": "Tin",
    "source": "Swords and the element Air"
  },
  "page-of-swords": {
    "colour": "Pale Sky",
    "hex": "#A8BCCB",
    "stone": "Selenite",
    "metal": "Tin",
    "source": "Swords and the element Air"
  },
  "knight-of-swords": {
    "colour": "Pale Sky",
    "hex": "#A8BCCB",
    "stone": "Selenite",
    "metal": "Tin",
    "source": "Swords and the element Air"
  },
  "queen-of-swords": {
    "colour": "Steel Blue",
    "hex": "#5D7488",
    "stone": "Kyanite",
    "metal": "Tin",
    "source": "Swords and the element Air"
  },
  "king-of-swords": {
    "colour": "Steel Blue",
    "hex": "#5D7488",
    "stone": "Kyanite",
    "metal": "Tin",
    "source": "Swords and the element Air"
  },
  "ace-of-pentacles": {
    "colour": "New Leaf",
    "hex": "#8AA86F",
    "stone": "Green Aventurine",
    "metal": "Copper",
    "source": "Pentacles and the element Earth"
  },
  "two-of-pentacles": {
    "colour": "Sage",
    "hex": "#7E9470",
    "stone": "Jade",
    "metal": "Copper",
    "source": "Pentacles and the element Earth"
  },
  "three-of-pentacles": {
    "colour": "Sage",
    "hex": "#7E9470",
    "stone": "Jade",
    "metal": "Copper",
    "source": "Pentacles and the element Earth"
  },
  "four-of-pentacles": {
    "colour": "Moss Green",
    "hex": "#5F7F55",
    "stone": "Malachite",
    "metal": "Copper",
    "source": "Pentacles and the element Earth"
  },
  "five-of-pentacles": {
    "colour": "Moss Green",
    "hex": "#5F7F55",
    "stone": "Malachite",
    "metal": "Copper",
    "source": "Pentacles and the element Earth"
  },
  "six-of-pentacles": {
    "colour": "Forest",
    "hex": "#4C6B45",
    "stone": "Moss Agate",
    "metal": "Copper",
    "source": "Pentacles and the element Earth"
  },
  "seven-of-pentacles": {
    "colour": "Forest",
    "hex": "#4C6B45",
    "stone": "Moss Agate",
    "metal": "Copper",
    "source": "Pentacles and the element Earth"
  },
  "eight-of-pentacles": {
    "colour": "Olive",
    "hex": "#6B7040",
    "stone": "Peridot",
    "metal": "Copper",
    "source": "Pentacles and the element Earth"
  },
  "nine-of-pentacles": {
    "colour": "Olive",
    "hex": "#6B7040",
    "stone": "Peridot",
    "metal": "Copper",
    "source": "Pentacles and the element Earth"
  },
  "ten-of-pentacles": {
    "colour": "Deep Loam",
    "hex": "#4F4A34",
    "stone": "Tiger Iron",
    "metal": "Copper",
    "source": "Pentacles and the element Earth"
  },
  "page-of-pentacles": {
    "colour": "Wheat",
    "hex": "#B9A56E",
    "stone": "Yellow Jasper",
    "metal": "Copper",
    "source": "Pentacles and the element Earth"
  },
  "knight-of-pentacles": {
    "colour": "Wheat",
    "hex": "#B9A56E",
    "stone": "Yellow Jasper",
    "metal": "Copper",
    "source": "Pentacles and the element Earth"
  },
  "queen-of-pentacles": {
    "colour": "Bronze",
    "hex": "#8A6F3C",
    "stone": "Pyrite",
    "metal": "Copper",
    "source": "Pentacles and the element Earth"
  },
  "king-of-pentacles": {
    "colour": "Bronze",
    "hex": "#8A6F3C",
    "stone": "Pyrite",
    "metal": "Copper",
    "source": "Pentacles and the element Earth"
  }
}
