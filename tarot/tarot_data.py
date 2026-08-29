"""Card corpus, spread definitions and reading vocabulary.

Everything the site knows about tarot lives here. The SEO content generator,
the reading engine and the SVG card art all read from this one source so a
correction to a card's meaning propagates everywhere at once.
"""

from __future__ import annotations

# --------------------------------------------------------------------------
# Contexts the site writes interpretations for. Order matters: it drives the
# tab order on card pages and the sitemap ordering.
# --------------------------------------------------------------------------

CONTEXTS = [
    ("general", "General"),
    ("love", "Love & Relationships"),
    ("career", "Career & Work"),
    ("money", "Money & Resources"),
    ("health", "Health & Energy"),
    ("yes-no", "Yes or No"),
]

CONTEXT_LABELS = dict(CONTEXTS)

SUITS = {
    "wands": {
        "name": "Wands",
        "element": "Fire",
        "ink": "red",
        "domain": "drive, creativity and the will to act",
        "season": "Spring",
    },
    "cups": {
        "name": "Cups",
        "element": "Water",
        "ink": "blue",
        "domain": "feeling, attachment and the inner life",
        "season": "Summer",
    },
    "swords": {
        "name": "Swords",
        "element": "Air",
        "ink": "slate",
        "domain": "thought, truth and the cost of clarity",
        "season": "Autumn",
    },
    "pentacles": {
        "name": "Pentacles",
        "element": "Earth",
        "ink": "green",
        "domain": "work, body and material security",
        "season": "Winter",
    },
}

RANKS = [
    (1, "Ace", "I"),
    (2, "Two", "II"),
    (3, "Three", "III"),
    (4, "Four", "IV"),
    (5, "Five", "V"),
    (6, "Six", "VI"),
    (7, "Seven", "VII"),
    (8, "Eight", "VIII"),
    (9, "Nine", "IX"),
    (10, "Ten", "X"),
    (11, "Page", "P"),
    (12, "Knight", "N"),
    (13, "Queen", "Q"),
    (14, "King", "K"),
]


def _card(slug, name, number, roman, emblem, ink, element, astro,
          up_keys, rev_keys, up, rev, ctx, yesno):
    return {
        "slug": slug,
        "name": name,
        "arcana": "major",
        "suit": None,
        "number": number,
        "roman": roman,
        "emblem": emblem,
        "ink": ink,
        "element": element,
        "astrology": astro,
        "up_keys": up_keys,
        "rev_keys": rev_keys,
        "up": up,
        "rev": rev,
        "ctx": ctx,
        "yesno": yesno,
    }


MAJORS = [
    _card(
        "the-fool", "The Fool", 0, "0", "fool", "yellow", "Air", "Uranus",
        ["beginnings", "faith", "innocence", "the leap"],
        ["recklessness", "hesitation", "naivety", "bad timing"],
        "The Fool is the moment before experience — the step taken without a map. It carries "
        "no expertise and no scar tissue, and that is precisely its power. When this card opens "
        "a reading it says the situation is genuinely new, and that treating it as a repeat of "
        "something older will cost you.",
        "Reversed, the leap is mistimed. Either you are hurling yourself forward to avoid sitting "
        "with a decision, or you are frozen at the edge calling it prudence. The card asks which "
        "one it is — the remedy for each is the opposite of the other.",
        {
            "love": ("A relationship with no precedent in your history. Meet it on its own terms.",
                     "Impulse dressed as romance, or fear dressed as patience."),
            "career": ("An unproven path that suits you better than the proven one.",
                       "Leaping without runway, or stalling until the opening closes."),
            "money": ("A small speculative move you can afford to lose.",
                      "Spending as avoidance. Check what feeling the purchase is answering."),
            "health": ("Fresh energy. Begin the practice you keep postponing.",
                       "Ignoring a signal because acknowledging it would slow you down."),
        },
        "yes",
    ),
    _card(
        "the-magician", "The Magician", 1, "I", "magician", "red", "Air", "Mercury",
        ["capability", "focus", "resourcefulness", "manifestation"],
        ["scattering", "manipulation", "untapped skill", "illusion"],
        "The Magician says every tool you need is already on the table. This is not a card of "
        "luck but of conversion — intention into action, idea into object. It appears when the "
        "bottleneck is not resources but the willingness to commit them to one aim.",
        "Reversed, power leaks. Skill is present but pointed in six directions, or pointed at "
        "someone rather than at a goal. Look for the gap between what is being said and what is "
        "actually being built.",
        {
            "love": ("Say the thing directly. Charm without honesty curdles here.",
                     "Performance over intimacy. Someone is managing an impression."),
            "career": ("You are more qualified than you are behaving. Act on it.",
                       "Talent spread across too many projects to compound in any."),
            "money": ("A concrete plan converts income into an asset.",
                      "A scheme that sounds better than it computes. Run the numbers twice."),
            "health": ("Discipline pays fast right now. Small protocol, held daily.",
                       "Starting over weekly. Consistency beats optimisation."),
        },
        "yes",
    ),
    _card(
        "the-high-priestess", "The High Priestess", 2, "II", "priestess", "blue", "Water", "Moon",
        ["intuition", "the unspoken", "patience", "inner knowing"],
        ["disconnection", "secrets kept too long", "ignored instinct", "noise"],
        "The High Priestess sits between the pillars and does not explain. She marks the part of "
        "a situation that is known but not yet sayable. When she appears, the useful move is "
        "usually to gather rather than to declare — the answer is forming and does not want an "
        "audience yet.",
        "Reversed, the channel is jammed. Either you are overriding an instinct you have already "
        "registered, or you are withholding something whose secrecy now costs more than its "
        "disclosure would.",
        {
            "love": ("Something unspoken is doing the real work. Listen before you argue.",
                     "Withholding has become the relationship's structure."),
            "career": ("Gather information quietly. Do not announce the move yet.",
                       "Office noise is drowning out your read on the situation."),
            "money": ("Hold. The picture is incomplete and the deadline is softer than it looks.",
                      "You knew. Act on what you knew."),
            "health": ("Rest, track, notice patterns. The body is reporting.",
                       "Symptoms filed under 'later' for too long."),
        },
        "maybe",
    ),
    _card(
        "the-empress", "The Empress", 3, "III", "empress", "green", "Earth", "Venus",
        ["abundance", "nurture", "creation", "the senses"],
        ["depletion", "smothering", "creative block", "neglect"],
        "The Empress is fertility in the broadest sense — of soil, of work, of care. She rewards "
        "tending over forcing. Where she appears, something is capable of growing if it is fed "
        "consistently and not dug up to check on it.",
        "Reversed, the well is low. You are giving from reserve, or giving so completely that "
        "the thing you tend cannot develop its own roots. Either way the correction begins with "
        "your own resources, not with more effort.",
        {
            "love": ("Warmth, generosity, ease. Care expressed physically, not just stated.",
                     "Care that has curdled into control, or a partner running on empty."),
            "career": ("Creative work flourishes. Protect the conditions that let it.",
                       "Burnout wearing the costume of dedication."),
            "money": ("Steady growth from something you have patiently maintained.",
                      "Comfort spending that quietly outpaces income."),
            "health": ("Feed yourself properly. The body responds to being tended.",
                       "Depletion. Rest is the treatment, not the reward for finishing."),
        },
        "yes",
    ),
    _card(
        "the-emperor", "The Emperor", 4, "IV", "emperor", "red", "Fire", "Aries",
        ["structure", "authority", "boundaries", "order"],
        ["rigidity", "domination", "chaos", "absent leadership"],
        "The Emperor builds the frame that makes freedom usable. Rules, boundaries, systems, a "
        "decision that holds. He appears when a situation has enough energy and not enough "
        "architecture — and when someone has to be the one who decides.",
        "Reversed, structure has become the problem. Control applied where trust was needed, "
        "or an authority vacuum nobody will step into. Ask whether the rules are still serving "
        "the thing they were built to protect.",
        {
            "love": ("Commitment given shape: clear terms, kept agreements.",
                     "Control mistaken for care. Rigidity where flexibility was owed."),
            "career": ("Take the decision. Ambiguity is now more expensive than being wrong.",
                       "A boss problem, or your own refusal to adapt a system that has aged out."),
            "money": ("A budget, a structure, a boring plan that works.",
                       "Rigid finances that cannot absorb a shock."),
            "health": ("Routine and structure serve you. Same time, same thing, daily.",
                       "Pushing through as a policy. The body does not respect org charts."),
        },
        "yes",
    ),
    _card(
        "the-hierophant", "The Hierophant", 5, "V", "hierophant", "slate", "Earth", "Taurus",
        ["tradition", "teaching", "institutions", "shared meaning"],
        ["dogma", "unorthodoxy", "hollow ritual", "questioning"],
        "The Hierophant is the accumulated answer — what the tradition, the institution, the "
        "mentor already worked out. His appearance suggests the problem in front of you is not "
        "novel, and that the established route is genuinely the efficient one.",
        "Reversed, the form has outlived the meaning. Either the institution no longer deserves "
        "your deference, or you are rejecting structure reflexively and paying to relearn what "
        "was freely available.",
        {
            "love": ("Shared values and public commitment. The conventional path fits here.",
                     "A relationship held together by expectation rather than desire."),
            "career": ("Mentorship, credentials, doing it the established way.",
                       "A culture that rewards compliance over contribution."),
            "money": ("Conservative, orthodox handling. Boring is correct.",
                       "Advice that serves the adviser. Check the incentives."),
            "health": ("Established medicine. See the professional, follow the protocol.",
                       "Blanket protocols applied to a body that is not average."),
        },
        "maybe",
    ),
    _card(
        "the-lovers", "The Lovers", 6, "VI", "lovers", "yellow", "Air", "Gemini",
        ["union", "values", "choice", "alignment"],
        ["misalignment", "avoidance", "temptation", "division"],
        "The Lovers is less about romance than about alignment — the moment a choice reveals what "
        "you actually value. Real union is its reward, but the mechanism is a decision that "
        "cannot be made half-way.",
        "Reversed, values and behaviour have come apart. A choice is being avoided, or was made "
        "against your own grain and is now producing friction that looks like bad luck.",
        {
            "love": ("Genuine meeting. Two people choosing each other with open eyes.",
                     "A mismatch in values that affection cannot bridge indefinitely."),
            "career": ("A role that fits what you actually care about.",
                       "Doing work that requires you to be someone you are not."),
            "money": ("A financial choice that reflects your priorities, not your anxiety.",
                       "Money decisions made to avoid a conversation."),
            "health": ("Mind and body pulling the same direction.",
                       "Habits at war with stated intentions."),
        },
        "yes",
    ),
    _card(
        "the-chariot", "The Chariot", 7, "VII", "chariot", "blue", "Water", "Cancer",
        ["momentum", "willpower", "control", "victory"],
        ["stalling", "scattered force", "aggression", "losing the reins"],
        "The Chariot is force held on a line. Two opposing energies harnessed to one direction — "
        "which is why it reads as victory. It appears when the outcome depends less on strength "
        "than on refusing to be pulled off course.",
        "Reversed, the horses win. Effort continues but direction is lost, or drive has curdled "
        "into aggression that costs more ground than it takes.",
        {
            "love": ("Pursuing what you want, clearly and without apology.",
                     "Pushing where you should be listening."),
            "career": ("Momentum. Keep the line and do not renegotiate mid-run.",
                       "Busy and directionless. Effort without a destination."),
            "money": ("Disciplined progress toward a defined number.",
                       "Financial ambition outrunning financial control."),
            "health": ("Training pays. The body is responding to consistency.",
                       "Overtraining, or willpower substituting for recovery."),
        },
        "yes",
    ),
    _card(
        "strength", "Strength", 8, "VIII", "strength", "yellow", "Fire", "Leo",
        ["courage", "patience", "gentle power", "self-mastery"],
        ["self-doubt", "force", "depletion", "impatience"],
        "Strength is the hand on the lion's jaw — influence without violence. It is the slower "
        "power, and the more durable one. When it appears, the situation will yield to steadiness "
        "and refuse brute force outright.",
        "Reversed, the inner animal has the upper hand — as raw reactivity, or as the self-doubt "
        "that makes you flinch from something you could in fact handle.",
        {
            "love": ("Patience and warmth do what confrontation cannot.",
                     "Reacting from the raw place. Pause before you answer."),
            "career": ("Quiet competence earns more ground than assertion.",
                       "Imposter feelings distorting a real record of capability."),
            "money": ("Steady nerve through a dip. Do not sell in fear.",
                       "Panic decisions. Wait forty-eight hours."),
            "health": ("Gentle consistency beats intensity.",
                       "Running on nerve. Reserves are lower than you are admitting."),
        },
        "yes",
    ),
    _card(
        "the-hermit", "The Hermit", 9, "IX", "hermit", "slate", "Earth", "Virgo",
        ["solitude", "search", "inner light", "withdrawal"],
        ["isolation", "avoidance", "refused help", "loneliness"],
        "The Hermit steps out of the crowd on purpose, carrying his own light. This is the card "
        "of deliberate withdrawal for the sake of clarity — not escape, but the recognition that "
        "the answer will not arrive amid noise.",
        "Reversed, solitude has stopped being useful. Withdrawal has hardened into avoidance, or "
        "you have been alone with a problem long past the point where another person would have "
        "solved it in an hour.",
        {
            "love": ("Time alone clarifies what you actually want from partnership.",
                     "Withdrawing instead of saying the difficult thing."),
            "career": ("Deep, undistracted work. Protect the quiet.",
                       "Isolated from the information and allies you need."),
            "money": ("Review everything privately before you commit.",
                       "Refusing advice out of pride."),
            "health": ("Rest and quiet are the intervention.",
                       "Suffering privately. This one needs another person."),
        },
        "maybe",
    ),
    _card(
        "wheel-of-fortune", "Wheel of Fortune", 10, "X", "wheel", "yellow", "Fire", "Jupiter",
        ["turning point", "cycles", "luck", "fate"],
        ["resistance", "downturn", "bad timing", "repetition"],
        "The Wheel marks the turn — the part of a situation that is not yours to control. It "
        "argues for reading the cycle correctly rather than fighting it: what is rising should be "
        "ridden, what is falling should be released early.",
        "Reversed, the wheel catches. A cycle repeats because its lesson has not been taken, or "
        "the turn is downward and the useful skill is limiting damage rather than forcing luck.",
        {
            "love": ("A shift arrives from outside. Meet it rather than manage it.",
                     "The same pattern, a new person. Look at the constant."),
            "career": ("An unexpected opening. Say yes before you feel ready.",
                       "Timing is against you. Position, do not push."),
            "money": ("Fortune turns favourable. Do not confuse luck with skill.",
                       "A downturn to be weathered, not out-traded."),
            "health": ("A natural upswing. Build on it.",
                       "Cyclical relapse. Track the trigger rather than the symptom."),
        },
        "yes",
    ),
    _card(
        "justice", "Justice", 11, "XI", "justice", "slate", "Air", "Libra",
        ["fairness", "consequence", "truth", "accountability"],
        ["imbalance", "evasion", "bias", "unfairness"],
        "Justice weighs what actually happened, not what was intended. It is the card of "
        "consequence arriving on schedule — legal, relational or self-imposed. Where it appears, "
        "the honest accounting is also the strategically correct one.",
        "Reversed, the scales are rigged or the reckoning is being dodged. Someone is avoiding a "
        "consequence, or a genuine unfairness is being asked to pass as balance.",
        {
            "love": ("Even footing. What each gives and gets is visible and fair.",
                     "An imbalance both people can see and neither will name."),
            "career": ("A fair outcome, a contract, a decision that holds up.",
                       "Credit misallocated. Document things."),
            "money": ("Settle it properly — tax, debt, the split. Do it cleanly.",
                       "An agreement weighted against you. Read it again."),
            "health": ("Balance restored through honest habits.",
                       "The cost of the last two years is coming due."),
        },
        "maybe",
    ),
    _card(
        "the-hanged-man", "The Hanged Man", 12, "XII", "hanged", "blue", "Water", "Neptune",
        ["suspension", "surrender", "new angle", "pause"],
        ["stalling", "martyrdom", "pointless delay", "resistance"],
        "The Hanged Man is voluntary suspension — the pause that changes the view. Nothing moves, "
        "and that is the point. It appears when forward effort has stopped producing information "
        "and only a change of position will.",
        "Reversed, the pause has gone stale. Waiting has become identity, or sacrifice is being "
        "performed for an audience rather than made for a reason.",
        {
            "love": ("Let it sit. Clarity arrives without being forced.",
                     "Endless waiting for someone to become who you need."),
            "career": ("A delay you cannot move. Use it to reconsider the aim.",
                       "Stuck and calling it strategy."),
            "money": ("Do not transact yet. Position is worse than patience.",
                       "Frozen by indecision while the cost accrues."),
            "health": ("Genuine rest, not productive rest.",
                       "Enduring discomfort as though it were virtue."),
        },
        "no",
    ),
    _card(
        "death", "Death", 13, "XIII", "death", "slate", "Water", "Scorpio",
        ["ending", "transformation", "clearing", "transition"],
        ["clinging", "stalled change", "fear of ending", "slow decay"],
        "Death is the least literal card in the deck and the most decisive. Something concludes "
        "so that the next thing has room. It is rarely gentle and almost never optional — but it "
        "removes what was already finished, which is a mercy.",
        "Reversed, the ending is being resisted. The thing is over and is being kept on life "
        "support, which costs more than the ending would have.",
        {
            "love": ("A chapter closes. What replaces it needs the space.",
                     "Holding a relationship past its actual end."),
            "career": ("Leave. The role has given you what it had.",
                       "Staying out of fear while the position quietly erodes."),
            "money": ("Cut the losing position. Redeploy.",
                       "Averaging down on something already gone."),
            "health": ("A habit ends and the body recovers quickly.",
                       "Postponing a change your body has already voted on."),
        },
        "maybe",
    ),
    _card(
        "temperance", "Temperance", 14, "XIV", "temperance", "blue", "Fire", "Sagittarius",
        ["balance", "blending", "moderation", "patience"],
        ["excess", "imbalance", "impatience", "clashing parts"],
        "Temperance mixes. Two things that do not obviously belong together are combined slowly "
        "until they do. It is the card of the middle path taken skilfully rather than timidly — "
        "and it always takes longer than you want.",
        "Reversed, the proportions are off. Too much of one thing, or an attempt to rush a "
        "process that only works at its own pace.",
        {
            "love": ("Two lives blending well. Give it the time it needs.",
                     "One person adapting far more than the other."),
            "career": ("Combining skills or roles into something workable.",
                       "Work and life out of proportion, and it is showing."),
            "money": ("Moderate, mixed, steady. No single big move.",
                       "Feast and famine cycles. Smooth the middle."),
            "health": ("Moderation is doing real work. Continue.",
                       "Excess in one direction, or crash-correcting in the other."),
        },
        "yes",
    ),
    _card(
        "the-devil", "The Devil", 15, "XV", "devil", "red", "Earth", "Capricorn",
        ["attachment", "compulsion", "shadow", "the bargain"],
        ["release", "seeing the chain", "breaking free", "reclaiming"],
        "The Devil is the arrangement you keep choosing while calling it a trap. The chains in "
        "the image are loose — that detail is the whole card. It names dependency, appetite and "
        "the comfortable deal that costs more than it returns.",
        "Reversed, the chain is examined. This is the better half of the card: the compulsion "
        "loses its authority, the bargain gets renegotiated, and what looked like fate turns out "
        "to have been a habit.",
        {
            "love": ("Intense attachment. Ask honestly whether it is chosen or compelled.",
                     "Walking out of a dynamic that had you convinced you could not."),
            "career": ("Golden handcuffs. The money is real and so is the cost.",
                       "Naming the thing that kept you, and leaving anyway."),
            "money": ("Debt, or spending that manages a feeling.",
                       "Facing the number. It is smaller than the dread."),
            "health": ("A habit with a grip on you. Treat the grip, not the habit.",
                       "Genuine release. The first weeks are the hard ones."),
        },
        "no",
    ),
    _card(
        "the-tower", "The Tower", 16, "XVI", "tower", "red", "Fire", "Mars",
        ["upheaval", "revelation", "collapse", "sudden truth"],
        ["averted disaster", "delayed collapse", "fear of change", "slow unravelling"],
        "The Tower is the structure that was built wrong coming down in one motion. It is "
        "frightening and it is clean. What it destroys was already unsound — the shock is not the "
        "collapse but the speed at which the truth arrives.",
        "Reversed, the collapse is deferred or survived. You may be delaying an inevitable "
        "correction, or you have just come through one and are still counting the damage.",
        {
            "love": ("A revelation changes the terms. It cannot be un-known.",
                     "Preventing a breakdown that may need to happen."),
            "career": ("Sudden, disruptive change. It clears ground you could not have cleared.",
                       "Instability held at bay, at increasing cost."),
            "money": ("An unexpected hit. Stabilise before you strategise.",
                       "A near miss. Build the buffer now."),
            "health": ("An acute event demanding immediate attention.",
                       "Warning signs accumulating. Act before it forces you to."),
        },
        "no",
    ),
    _card(
        "the-star", "The Star", 17, "XVII", "star", "blue", "Air", "Aquarius",
        ["hope", "renewal", "clarity", "quiet faith"],
        ["discouragement", "lost faith", "self-doubt", "dimmed vision"],
        "The Star follows the Tower for a reason. After the collapse, the calm — water poured "
        "gently, sky clear, nothing urgent. It is the card of healing that has already quietly "
        "begun, and of hope that is realistic rather than performed.",
        "Reversed, the light is hard to see. Not despair exactly, but a loss of the belief that "
        "effort connects to outcome. It usually means recovery is real but slower than you want.",
        {
            "love": ("Healing, openness, a gentler chapter.",
                     "Guarded after being hurt. Reasonable, but costing you."),
            "career": ("Renewed direction. The work starts meaning something again.",
                       "Disillusioned. The vision needs rebuilding before the plan does."),
            "money": ("Slow, genuine recovery. Trust the trend, not the day.",
                       "Discouraged by slow progress that is nonetheless progress."),
            "health": ("Real healing underway. Keep the conditions steady.",
                       "Recovery is happening more slowly than your patience."),
        },
        "yes",
    ),
    _card(
        "the-moon", "The Moon", 18, "XVIII", "moon", "blue", "Water", "Pisces",
        ["uncertainty", "illusion", "dreams", "the unclear path"],
        ["clarity returning", "confusion lifting", "released fear", "truth surfacing"],
        "The Moon is the landscape by night — real, but unreliable to the eye. It marks the part "
        "of a situation distorted by fear, projection or missing information. The path exists; "
        "the light is simply bad.",
        "Reversed, the fog thins. Something you feared turns out to be smaller or different than "
        "imagined, or a deception ends and the shape of things resolves.",
        {
            "love": ("Something is not being seen clearly. Do not decide tonight.",
                     "Clarity returning. A fear or suspicion resolves."),
            "career": ("Incomplete information. Ask the direct question.",
                       "A misunderstanding clears, or a hidden agenda surfaces."),
            "money": ("Numbers you have not actually checked. Check them.",
                       "The real position emerges. It is workable."),
            "health": ("Unclear symptoms. Get a second, better look.",
                       "A diagnosis or explanation finally makes sense."),
        },
        "maybe",
    ),
    _card(
        "the-sun", "The Sun", 19, "XIX", "sun", "yellow", "Fire", "Sun",
        ["clarity", "vitality", "success", "plain joy"],
        ["dimmed", "delayed", "forced cheer", "temporary clouds"],
        "The Sun is the least ambiguous card in the deck. Things are visible, warm and going "
        "well, and the correct response is to enjoy that rather than to look for the catch. Where "
        "it appears, the situation is simpler than you have been treating it.",
        "Reversed, the sun is still up but obscured. Success delayed, joy performed rather than "
        "felt, or a good thing you cannot yet let yourself have.",
        {
            "love": ("Warmth, ease, being genuinely seen. Enjoy it.",
                     "Good on paper, flat in feeling. Ask what is missing."),
            "career": ("Recognition and clarity. The work is landing.",
                       "Success that arrives without satisfaction."),
            "money": ("Things are fine. Better than you have been assuming.",
                       "A delayed payoff. It is coming."),
            "health": ("Vitality returns. Get outside.",
                       "Low energy in an otherwise good period. Check sleep and light."),
        },
        "yes",
    ),
    _card(
        "judgement", "Judgement", 20, "XX", "judgement", "yellow", "Fire", "Pluto",
        ["reckoning", "awakening", "calling", "rebirth"],
        ["self-doubt", "ignored call", "harsh self-judgement", "delay"],
        "Judgement is the summons — the moment a long accumulation resolves into a decision that "
        "cannot be unmade. It carries the sense of being called by something larger than "
        "preference, and of a past that finally makes sense in retrospect.",
        "Reversed, the call goes unanswered. Either you are refusing something you already know "
        "is yours, or you have turned the reckoning inward as pure self-criticism, which "
        "resolves nothing.",
        {
            "love": ("A decisive turn. Forgiveness, or a clear-eyed ending.",
                     "Replaying an old verdict on yourself. It is out of date."),
            "career": ("A calling, a decisive move, a reinvention that fits.",
                       "Hearing it and not answering."),
            "money": ("A full accounting, then a clean restart.",
                       "Shame is a poor accountant. Get the real numbers."),
            "health": ("A turning point. The change holds this time.",
                       "Punishing yourself for a lapse instead of resuming."),
        },
        "yes",
    ),
    _card(
        "the-world", "The World", 21, "XXI", "world", "green", "Earth", "Saturn",
        ["completion", "wholeness", "arrival", "integration"],
        ["near-completion", "loose ends", "delayed closure", "unfinished"],
        "The World closes the circle. Something integrates — the parts finally belong to each "
        "other, and a cycle that took real time concludes properly. It is the deck's only "
        "unambiguous ending, and it is a good one.",
        "Reversed, the finish line moves. Ninety percent done, with the last ten percent carrying "
        "all the difficulty. Usually a loose end you have known about for a while.",
        {
            "love": ("A relationship that feels complete in itself.",
                     "Almost there. One conversation still owed."),
            "career": ("A project completes and changes your standing.",
                       "Finishing is being avoided. Name the last task."),
            "money": ("A goal reached. Set the next one deliberately.",
                       "So close. Do not restructure now — just close it."),
            "health": ("Full recovery, integration, a body that feels like yours.",
                       "The last stretch of recovery is the slow one."),
        },
        "yes",
    ),
]

# --------------------------------------------------------------------------
# Minor arcana. Each entry carries its own keywords and meanings — the suit
# and rank templates below only supply connective tissue for context lines
# that the card itself does not override.
# --------------------------------------------------------------------------

RANK_THEME = {
    1: "a seed — pure potential, not yet spent",
    2: "a pairing — balance, choice or tension between two",
    3: "first growth — the idea proven in company",
    4: "consolidation — holding what has been built",
    5: "friction — loss, conflict or the cost of the middle",
    6: "recovery — the turn back toward harmony",
    7: "endurance — the unglamorous middle stretch",
    8: "momentum — skill turning into speed",
    9: "near-completion — the last and heaviest stretch",
    10: "completion — the full weight of the suit, for better and worse",
    11: "the student — curiosity, messages, beginner's openness",
    12: "the pursuer — momentum, single-mindedness, the charge",
    13: "inward mastery — holding the suit's power with depth",
    14: "outward mastery — wielding the suit's power in the world",
}

MINOR_SPECS = {
    # ---------------------------------------------------------------- wands
    ("wands", 1): (["ignition", "raw drive", "an offer", "creative spark"],
                   ["false start", "delay", "lost nerve"],
                   "A genuine spark. Something wants to begin and has real fuel behind it.",
                   "The spark is there but is not catching — timing, nerve or conditions.", "yes"),
    ("wands", 2): (["planning", "first steps", "wider horizon", "decision"],
                   ["fear of leaving", "poor planning", "playing small"],
                   "You have built something and are looking past it. The world map is out.",
                   "The safe option is being chosen for the wrong reason.", "maybe"),
    ("wands", 3): (["expansion", "foresight", "ships out", "waiting well"],
                   ["delays", "narrow view", "premature effort"],
                   "The work is done and moving. Now it is a matter of scope and patience.",
                   "Expansion stalls, or was launched before it was ready.", "yes"),
    ("wands", 4): (["celebration", "homecoming", "milestone", "stable ground"],
                   ["transition", "unstable footing", "postponed joy"],
                   "A threshold reached and worth marking. Stability with warmth in it.",
                   "Home or foundation in flux. The celebration waits.", "yes"),
    ("wands", 5): (["friction", "competition", "clashing", "scrappy energy"],
                   ["avoided conflict", "resolution", "inner conflict"],
                   "Everyone is pushing at once. Noisy, but rarely serious.",
                   "Conflict suppressed rather than settled, or finally cooling.", "no"),
    ("wands", 6): (["recognition", "victory", "visible success", "confidence"],
                   ["deflated", "unrecognised", "hollow win"],
                   "Public acknowledgement of something you actually did.",
                   "The credit does not arrive, or arrives and means nothing.", "yes"),
    ("wands", 7): (["defending", "holding ground", "conviction", "pressure"],
                   ["overwhelmed", "giving way", "exhausted defence"],
                   "You hold the higher ground. Keep holding it — the position is sound.",
                   "The defence is costing more than the ground is worth.", "maybe"),
    ("wands", 8): (["speed", "messages", "rapid movement", "alignment"],
                   ["delay", "scattered", "miscommunication"],
                   "Everything moves at once and in the same direction. Ride it.",
                   "Momentum breaks up. Things arrive late or out of order.", "yes"),
    ("wands", 9): (["resilience", "last stand", "guarded", "nearly through"],
                   ["depletion", "paranoia", "refusing help"],
                   "Battered but standing. The final stretch, and you have what it takes.",
                   "Defensiveness outliving the threat. Reserves genuinely low.", "maybe"),
    ("wands", 10): (["burden", "overload", "carrying too much", "near the door"],
                    ["delegation", "release", "collapse"],
                    "The load is real and nearly delivered. It is also more than one person's.",
                    "Something gets put down — by choice, or because you drop it.", "no"),
    ("wands", 11): (["enthusiasm", "news", "exploration", "free spirit"],
                    ["restlessness", "false start", "immaturity"],
                    "Fresh energy and news worth acting on. Untrained but alive.",
                    "Enthusiasm without follow-through.", "yes"),
    ("wands", 12): (["charge", "adventure", "haste", "bold action"],
                    ["recklessness", "burnout", "no direction"],
                    "Full commitment at speed. Thrilling and slightly ungovernable.",
                    "Speed without steering. Something gets broken.", "maybe"),
    ("wands", 13): (["warmth", "confidence", "magnetism", "self-possession"],
                    ["insecurity", "demanding", "burnt out"],
                    "Assured, warm, hard to intimidate. Draws people without asking.",
                    "Confidence running on external supply.", "yes"),
    ("wands", 14): (["leadership", "vision", "boldness", "command"],
                    ["arrogance", "tyranny", "impulsive rule"],
                    "Vision plus the authority to execute it. Natural leadership.",
                    "Leadership that has stopped listening.", "yes"),
    # ----------------------------------------------------------------- cups
    ("cups", 1): (["new feeling", "openness", "offer of love", "overflow"],
                  ["blocked emotion", "withheld", "emptiness"],
                  "The heart opens. A new feeling, offered or received, with nothing guarded.",
                  "Feeling present but not permitted out.", "yes"),
    ("cups", 2): (["mutual attraction", "partnership", "meeting", "equal exchange"],
                  ["imbalance", "rupture", "misread signals"],
                  "Two people meeting as equals. Genuine mutual recognition.",
                  "The exchange has become one-directional.", "yes"),
    ("cups", 3): (["friendship", "celebration", "community", "shared joy"],
                  ["isolation", "gossip", "crowded out"],
                  "Good company. Joy that requires other people to exist.",
                  "The group has turned, or you have drifted out of it.", "yes"),
    ("cups", 4): (["apathy", "withdrawal", "unnoticed offer", "discontent"],
                  ["renewed interest", "acceptance", "waking up"],
                  "Something is being offered and you cannot bring yourself to care.",
                  "Interest returns. The offer is finally seen.", "no"),
    ("cups", 5): (["grief", "loss", "focus on what's gone", "regret"],
                  ["acceptance", "turning around", "moving on"],
                  "Real loss, and the tendency to look only at the spilled cups.",
                  "You turn and notice what is still standing.", "no"),
    ("cups", 6): (["nostalgia", "memory", "kindness", "the past returning"],
                  ["stuck in the past", "idealising", "letting go"],
                  "Sweetness from the past — a person, a place, an old kindness.",
                  "Memory being preferred to the present.", "maybe"),
    ("cups", 7): (["options", "fantasy", "unclear choice", "imagination"],
                  ["clarity", "decision", "disillusion"],
                  "Too many possibilities, most of them imagined. Choose one and test it.",
                  "The fog clears and one option turns out to be real.", "maybe"),
    ("cups", 8): (["walking away", "seeking more", "deliberate exit", "disillusion"],
                  ["returning", "drifting", "fear of leaving"],
                  "Leaving something adequate because it is not enough. A sober departure.",
                  "Circling back, or unable to leave despite knowing.", "no"),
    ("cups", 9): (["contentment", "wish granted", "satisfaction", "comfort"],
                  ["smugness", "unfulfilled", "shallow pleasure"],
                  "The wish card. Satisfaction that is actually satisfying.",
                  "Getting it and finding it did not fill the space.", "yes"),
    ("cups", 10): (["belonging", "emotional completion", "family", "harmony"],
                   ["fractured", "performed happiness", "distance"],
                   "The full cup. Belonging, in whatever form is yours.",
                   "The picture is intact and the feeling is not.", "yes"),
    ("cups", 11): (["tenderness", "a message", "creative feeling", "sensitivity"],
                   ["moodiness", "immaturity", "hurt feelings"],
                   "A gentle message or a soft new feeling. Unguarded.",
                   "Feeling everything and processing none of it.", "yes"),
    ("cups", 12): (["romantic offer", "following the heart", "invitation", "idealism"],
                   ["moodiness", "unrealistic", "empty gesture"],
                   "An offer made with feeling. Charming and sincere.",
                   "Romance as performance, or an offer that does not survive contact.", "maybe"),
    ("cups", 13): (["empathy", "emotional depth", "intuition", "holding space"],
                   ["overwhelm", "enmeshment", "martyrdom"],
                   "Deep feeling held steadily. Care without losing yourself in it.",
                   "Absorbing everyone's weather as though it were your own.", "yes"),
    ("cups", 14): (["emotional mastery", "calm", "diplomacy", "steadiness"],
                   ["suppression", "manipulation", "coldness"],
                   "Feeling fully present and fully governed. Rare and steadying.",
                   "Calm that is actually distance.", "yes"),
    # --------------------------------------------------------------- swords
    ("swords", 1): (["clarity", "breakthrough", "truth", "the clean cut"],
                    ["confusion", "misused truth", "clouded"],
                    "A clean thought that cuts through. The moment something is finally clear.",
                    "Clarity that will not come, or a truth wielded as a weapon.", "yes"),
    ("swords", 2): (["stalemate", "avoidance", "blocked choice", "blindfold"],
                    ["decision", "information arrives", "overwhelm"],
                    "A choice refused by not looking. The blindfold is self-applied.",
                    "The blindfold comes off. The decision becomes possible.", "no"),
    ("swords", 3): (["heartbreak", "painful truth", "grief", "the clean wound"],
                    ["healing", "forgiveness", "lingering pain"],
                    "Pain from something true. It hurts precisely because it is not a lie.",
                    "The wound begins to close, or refuses to.", "no"),
    ("swords", 4): (["rest", "recovery", "retreat", "stillness"],
                    ["restlessness", "burnout", "forced return"],
                    "Deliberate rest. Not defeat — maintenance.",
                    "Rest refused, or exhaustion that has become the condition.", "maybe"),
    ("swords", 5): (["hollow victory", "conflict", "winning badly", "cost"],
                    ["reconciliation", "walking away", "lingering resentment"],
                    "You can win this and lose more than you gain.",
                    "The conflict ends — through repair or through leaving.", "no"),
    ("swords", 6): (["transition", "moving on", "leaving trouble", "passage"],
                    ["stuck", "carrying baggage", "resisted move"],
                    "Leaving rough water for calmer. Sad, necessary, correct.",
                    "The move keeps being postponed, or is made without unpacking.", "maybe"),
    ("swords", 7): (["strategy", "concealment", "getting away with it", "cunning"],
                    ["exposure", "confession", "returning what was taken"],
                    "Acting alone and not entirely openly. Effective, and it has a cost.",
                    "It comes to light — or you bring it to light first.", "no"),
    ("swords", 8): (["restriction", "self-limitation", "trapped thinking", "bound"],
                    ["release", "seeing the exit", "new perspective"],
                    "Trapped mostly by the belief in the trap. The bindings are loose.",
                    "The way out becomes visible and it was always there.", "no"),
    ("swords", 9): (["anxiety", "sleepless worry", "dread", "night thoughts"],
                    ["relief", "perspective", "help arriving"],
                    "The three-a.m. card. The fear is larger at night than it is in daylight.",
                    "The dread lifts. It was mostly anticipation.", "no"),
    ("swords", 10): (["ending", "rock bottom", "the worst of it", "release"],
                     ["recovery", "survival", "slow healing"],
                     "It is as bad as it gets, and that means it is over.",
                     "The recovery begins. Slow, but genuinely upward.", "no"),
    ("swords", 11): (["curiosity", "vigilance", "new ideas", "questions"],
                     ["gossip", "scattered thinking", "defensiveness"],
                     "Sharp curiosity. Asking the questions others avoid.",
                     "Thinking that has turned suspicious or scattered.", "maybe"),
    ("swords", 12): (["directness", "haste", "argument", "charging in"],
                     ["aggression", "rashness", "burnout"],
                     "Straight at it, fast, without diplomacy. Effective and abrasive.",
                     "Speed that leaves damage. Slow down.", "maybe"),
    ("swords", 13): (["perceptiveness", "honesty", "independence", "clear boundaries"],
                     ["coldness", "bitterness", "harsh judgement"],
                     "Clear-eyed and unsentimental. Honest in a way that helps.",
                     "Honesty hardened into edge.", "yes"),
    ("swords", 14): (["authority", "intellect", "judgement", "principle"],
                     ["rigidity", "harshness", "abuse of position"],
                     "Reason exercised with authority. Fair, exacting, unsentimental.",
                     "Principle without mercy.", "yes"),
    # ------------------------------------------------------------- pentacles
    ("pentacles", 1): (["opportunity", "seed money", "tangible start", "offer"],
                       ["missed chance", "poor timing", "unstable start"],
                       "A concrete, material opening. Small now, real later.",
                       "The opening closes, or arrives on bad ground.", "yes"),
    ("pentacles", 2): (["juggling", "adaptability", "balance", "flexibility"],
                       ["overwhelm", "dropped ball", "disorganisation"],
                       "Keeping several things in the air, competently.",
                       "One too many. Something is about to fall.", "maybe"),
    ("pentacles", 3): (["craft", "collaboration", "skill recognised", "building"],
                       ["poor teamwork", "mediocrity", "unrecognised skill"],
                       "Skilled work done with others who can see it is skilled.",
                       "The collaboration is not working, or the craft is being wasted.", "yes"),
    ("pentacles", 4): (["holding on", "security", "saving", "control"],
                       ["release", "generosity", "loosening"],
                       "Keeping tight hold. Prudent, and it can become a cage.",
                       "The grip loosens — willingly or otherwise.", "maybe"),
    ("pentacles", 5): (["hardship", "exclusion", "scarcity", "the closed door"],
                       ["recovery", "help found", "coming inside"],
                       "Material or social hardship, made worse by feeling shut out.",
                       "Help appears. The door was not locked.", "no"),
    ("pentacles", 6): (["generosity", "give and take", "support", "fair exchange"],
                       ["strings attached", "imbalance", "debt"],
                       "Resources moving where they are needed. Fair on both sides.",
                       "Generosity with terms, or dependence forming.", "yes"),
    ("pentacles", 7): (["patience", "assessment", "slow growth", "the long look"],
                       ["impatience", "wasted effort", "poor return"],
                       "Standing back to assess what has grown. Nothing to do but wait well.",
                       "The return is not worth the input. Reconsider.", "maybe"),
    ("pentacles", 8): (["diligence", "practice", "craft", "repetition"],
                       ["drudgery", "perfectionism", "cutting corners"],
                       "Repetition turning into mastery. Unglamorous and compounding.",
                       "Repetition without progress, or standards that block shipping.", "yes"),
    ("pentacles", 9): (["self-sufficiency", "earned comfort", "independence", "refinement"],
                       ["dependence", "hollow luxury", "isolation"],
                       "Comfort you built yourself, enjoyed without apology.",
                       "Security that depends on someone else, or on appearances.", "yes"),
    ("pentacles", 10): (["legacy", "lasting wealth", "family", "the long structure"],
                        ["instability", "family friction", "short-termism"],
                        "Wealth that outlasts you — material, familial, structural.",
                        "The foundation has a crack in it. Usually a relational one.", "yes"),
    ("pentacles", 11): (["study", "new venture", "practical curiosity", "an offer"],
                        ["distraction", "procrastination", "unrealistic plan"],
                        "A practical new beginning approached studiously.",
                        "Plans that stay plans.", "yes"),
    ("pentacles", 12): (["steadiness", "reliability", "method", "slow progress"],
                        ["stagnation", "stubbornness", "boredom"],
                        "The slowest knight and the one that arrives. Utterly dependable.",
                        "Steadiness that has become inertia.", "maybe"),
    ("pentacles", 13): (["practical care", "resourcefulness", "groundedness", "provision"],
                        ["overwork", "smothering", "self-neglect"],
                        "Care expressed as competence. Things get handled.",
                        "Providing for everyone and provisioning nothing for yourself.", "yes"),
    ("pentacles", 14): (["prosperity", "stewardship", "reliability", "built wealth"],
                        ["greed", "rigidity", "materialism"],
                        "Abundance held responsibly. Built slowly, managed well.",
                        "Wealth as identity, or control dressed as stewardship.", "yes"),
}


def _minor_contexts(suit_key, rank, up_keys, rev_keys, up, rev):
    """Compose per-context lines from suit domain and rank position."""
    suit = SUITS[suit_key]
    lead_up = up_keys[0]
    lead_rev = rev_keys[0]
    domain = suit["domain"]
    theme = RANK_THEME[rank]
    return {
        "love": (
            f"In relationships this reads as {lead_up} expressed through {domain} — "
            f"{theme}.",
            f"Reversed, {lead_rev} is the theme: the same energy turned inward or withheld.",
        ),
        "career": (
            f"At work, {lead_up} shapes the situation. {suit['name']} govern {domain}, so the "
            f"pressure point is practical rather than abstract.",
            f"Reversed, expect {lead_rev} — the effort is present but not converting.",
        ),
        "money": (
            f"Financially this points to {lead_up} in matters of {domain}.",
            f"Reversed, {lead_rev} around resources. Review before you commit.",
        ),
        "health": (
            f"For body and energy, {suit['element']} suggests {lead_up} — "
            f"{theme}.",
            f"Reversed, {lead_rev}. Treat the cause rather than the symptom.",
        ),
    }


def _build_minors():
    cards = []
    for suit_key, suit in SUITS.items():
        for rank, rank_name, roman in RANKS:
            spec = MINOR_SPECS[(suit_key, rank)]
            up_keys, rev_keys, up, rev, yesno = spec
            if rank == 1:
                name = f"Ace of {suit['name']}"
            elif rank <= 10:
                name = f"{rank_name} of {suit['name']}"
            else:
                name = f"{rank_name} of {suit['name']}"
            slug = name.lower().replace(" ", "-")
            cards.append({
                "slug": slug,
                "name": name,
                "arcana": "minor",
                "suit": suit_key,
                "number": rank,
                "roman": roman,
                "emblem": suit_key,
                "ink": suit["ink"],
                "element": suit["element"],
                "astrology": suit["season"],
                "up_keys": up_keys,
                "rev_keys": rev_keys,
                "up": up,
                "rev": rev,
                "ctx": _minor_contexts(suit_key, rank, up_keys, rev_keys, up, rev),
                "yesno": yesno,
            })
    return cards


CARDS = MAJORS + _build_minors()
CARDS_BY_SLUG = {c["slug"]: c for c in CARDS}
MAJOR_SLUGS = [c["slug"] for c in MAJORS]

assert len(CARDS) == 78, f"deck must be 78 cards, got {len(CARDS)}"


# --------------------------------------------------------------------------
# Spreads
# --------------------------------------------------------------------------

SPREADS = {
    "daily": {
        "name": "Daily Draw",
        "slug": "daily",
        "count": 1,
        "tier": "free",
        "blurb": "One card for today. The fastest useful reading in the deck.",
        "positions": [
            ("Today", "The energy shaping the day and what it asks of you."),
        ],
    },
    "three-card": {
        "name": "Past · Present · Future",
        "slug": "three-card",
        "count": 3,
        "tier": "free",
        "blurb": "The classic three-card line. Enough structure to see a trajectory.",
        "positions": [
            ("Past", "What formed this situation and still exerts a pull."),
            ("Present", "Where things actually stand right now."),
            ("Future", "Where this trajectory leads if nothing changes."),
        ],
    },
    "yes-no": {
        "name": "Yes or No",
        "slug": "yes-no",
        "count": 1,
        "tier": "free",
        "blurb": "A single card read for direction, with the reasoning shown.",
        "positions": [
            ("The Answer", "The direction the card points, and why."),
        ],
    },
    "situation": {
        "name": "Situation · Action · Outcome",
        "slug": "situation",
        "count": 3,
        "tier": "free",
        "blurb": "For when you need a decision rather than a description.",
        "positions": [
            ("Situation", "What is actually happening, beneath the story about it."),
            ("Action", "The move that changes something."),
            ("Outcome", "What that action tends toward."),
        ],
    },
    "relationship": {
        "name": "Relationship Spread",
        "slug": "relationship",
        "count": 5,
        "tier": "member",
        "blurb": "Five cards on the space between two people.",
        "positions": [
            ("You", "What you bring, including what you do not say."),
            ("Them", "What they bring, as far as the cards can see it."),
            ("The Bond", "What actually connects you."),
            ("The Friction", "What keeps catching."),
            ("Direction", "Where this is heading on current terms."),
        ],
    },
    "celtic-cross": {
        "name": "Celtic Cross",
        "slug": "celtic-cross",
        "count": 10,
        "tier": "member",
        "blurb": "Ten cards. The deep reading — context, obstacle, history and outcome.",
        "positions": [
            ("The Heart", "The core of the matter."),
            ("The Crossing", "What obstructs or complicates it."),
            ("The Root", "The foundation beneath, often unexamined."),
            ("The Past", "What is passing out of influence."),
            ("The Crown", "What you are conscious of wanting."),
            ("The Near Future", "What arrives next."),
            ("Yourself", "How you are actually showing up."),
            ("Environment", "The people and conditions around this."),
            ("Hopes & Fears", "The thing you both want and dread."),
            ("Outcome", "Where this resolves on the present course."),
        ],
    },
}

FREE_SPREADS = [s for s in SPREADS.values() if s["tier"] == "free"]
MEMBER_SPREADS = [s for s in SPREADS.values() if s["tier"] == "member"]
