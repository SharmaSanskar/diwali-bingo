// All editable content lives here. Change items, titles, avatars and colors freely.

import type { BoardConfig } from '../lib/share';

export const appTitle = 'Chilcott Diwali Party';
export const tagline = 'One shared card. Every cross-off, live. Light up the board together.';

/** The poster board, square for square (left to right, top to bottom, center excluded). */
export const partyItems = [
  'Someone spills a drink',
  '2000s Bollywood hook step',
  'Someone blames the MBTA',
  '“I’ll leave by 11”',
  'Uber surge announced',
  'Photo retaken 3+ times',
  '“Change the song!”',
  'Camping at the snack table',
  'Teen Patti, nobody knows rules',
  'Call from home or parents',
  'Ex or crush mentioned',
  'Are the sweets sugar free?',
  'Aux hijacked',
  'Same story twice',
  'Didn’t RSVP',
  '“Chikni Chameli” requested',
  '“Keep it down, neighbors”',
  'Misses the dress code memo',
  'Throws up before the night ends',
  'Wrong lyrics, full confidence',
  '“Just one more” gulab jamun',
  '“Eyes were closed” selfie',
  'Extra drink run to Chauncy',
  '“Do we have anymore snacks?”',
];

export const partyFreeText = '“I’m not drinking much”';

/** The quick-start board: exact poster layout, free center, no shuffle. */
export const defaultBoard: BoardConfig = {
  title: 'Chilcott Diwali Party',
  items: partyItems,
  freeCenter: true,
  keepOrder: true,
  hideItemText: false,
  freeText: partyFreeText,
};

/** House rules from the poster. Shown under the board. */
export const houseRules = [
  'Spot a square? Call it out and take a sip.',
  'First full line gets to assign one dare.',
  'Blackout wins the last piece of mithai and 1 chips packet.',
  'Center is FREE!',
];

export const lineReward = 'First full line in the room assigns one dare!';
export const blackoutReward = 'Blackout wins the last piece of mithai and 1 chips packet 🍬';

export interface Template {
  id: string;
  title: string;
  items: string[];
  keepOrder?: boolean;
  freeText?: string;
}

export const templates: Template[] = [
  {
    id: 'chilcott',
    title: 'Chilcott Diwali Party',
    items: partyItems,
    keepOrder: true,
    freeText: partyFreeText,
  },
  {
    id: 'default',
    title: 'Festive Bingo',
    items: [
      'Someone sings off-key',
      'Phone runs out of battery',
      'Group photo takes 10 tries',
      "Someone says 'one more round'",
      'Sweets box is empty',
      'Someone burns their finger on a diya',
      'A cracker refuses to light',
      'Rangoli gets smudged',
      'Someone arrives fashionably late',
      'Matching outfits by accident',
      'Somebody eats the last laddoo',
      'Power cut for a few seconds',
      "Someone asks 'is it vegetarian?'",
      'An auntie gives life advice',
      'Too many selfies with sparklers',
      'Someone forgets the lighter',
      'Dog hides under the bed',
      'Kids run around with sparklers',
      'Chai gets reheated twice',
      'A video call with relatives abroad',
      'Someone dances without music',
      'Bollywood song on repeat',
      'Rangoli powder on someone’s clothes',
      'Somebody takes a nap',
      'Neighbours’ fireworks beat ours',
      'Someone tells the same story again',
      'Gift wrapping is torn open in seconds',
      'Someone wins at cards and gloats',
      'A diya keeps blowing out',
      'Smoke alarm goes off',
      'Someone says ‘Happy Diwali!’ 10 times',
      'Lights go up crooked',
    ],
  },
  {
    id: 'family',
    title: 'Family Gathering Bingo',
    items: [
      "Someone asks 'when are you getting married?'",
      'An uncle talks about stock markets',
      'Cousin shows off a new phone',
      "Someone says 'you've grown so much!'",
      'Grandparent shares a childhood story',
      'Debate over the best sweet shop',
      'Someone compares salaries',
      'Kids fight over the remote',
      'Food is ready two hours late',
      'Too much ghee in everything',
      'Someone falls asleep on the sofa',
      'A relative forgets your name',
      'Photo of the full family attempted',
      "Someone says 'eat more, you look thin'",
      'Puja runs longer than planned',
      'Shoes pile up at the door',
      'Somebody spills chai',
      'An argument about cricket',
      'Someone brings the wrong sweets',
      'Leftovers are packed for everyone',
      'Auntie WhatsApp forward is read aloud',
      'Someone cries during an old song',
      'The baby steals the spotlight',
      "Someone asks 'what are your plans?'",
      'Two people wear the same colour',
      'Someone gets a gift they already own',
      'Too many people in the kitchen',
      'Someone says it was better in their day',
      'Antakshari breaks out',
      'Someone is stuck on a work call',
      'A pressure cooker whistle scares someone',
      'Grandma gives everyone money',
    ],
  },
  {
    id: 'party',
    title: 'Party Bingo',
    items: [
      'DJ plays the same song twice',
      'Someone spills a drink',
      'Card game gets competitive',
      'Someone loses at teen patti',
      'Dance floor opens with a group dance',
      'Someone shows up in sneakers with a kurta',
      'Playlist argument',
      'Someone leaves early, then stays',
      'Group photo takes 10 tries',
      'Snack table is wiped out',
      "Someone says 'one more round'",
      'Sparkler slow-motion video',
      'Someone loses their phone',
      'Uber surge pricing complaints',
      'Two people wear identical outfits',
      'Someone tells a terrible joke',
      'Someone gives a speech nobody asked for',
      'Neighbours come to complain',
      'Someone dances the bhangra step all night',
      'Phone runs out of battery',
      'Somebody falls asleep at the party',
      'Ice runs out',
      'Someone requests an old Bollywood hit',
      'Shoes come off for dancing',
      'Someone films everything for Instagram',
      'A firecracker goes sideways',
      'Mithai gets eaten in one bite',
      'Someone says ‘I don’t dance’ then dances',
      'Someone forgets the host’s name',
      'The party moves to the kitchen',
      'A song makes everyone scream the lyrics',
      'Someone wears sunglasses at night',
    ],
  },
];

export const avatarEmojis = [
  '🪔', '🎆', '🪷', '🌸', '🐘', '🦚', '🍬', '🎇',
  '🌟', '🥭', '🐯', '🎉', '💫', '🌼', '🍯', '🦋',
];

// Bright enough to read on magenta and on the yellow squares.
export const playerColors = [
  '#ffe81a', '#ff9f1c', '#3b82f6', '#22c55e', '#00d4c8',
  '#a855f7', '#ffffff', '#ff6b35', '#14b8a6', '#6366f1',
];

export const reactionEmojis = ['🪔', '🎆', '😂', '🔥', '👏'] as const;
