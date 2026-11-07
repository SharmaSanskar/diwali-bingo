// Human-readable text for feed entries, toasts and notifications.

// Some squares are already quotes (“Change the song!”); don't double-wrap them.
const q = (s: string) => (/^[“"]/.test(s) ? s : `“${s}”`);

export function markText(name: string, self: boolean, item?: string): string {
  const who = self ? 'You' : name;
  return item ? `${who} crossed off ${q(item)} 🪔` : `${who} crossed off a square 🪔`;
}

export function lineText(name: string, self: boolean, label: string): string {
  return `${self ? 'You' : name} completed ${label}! 🎆`;
}

export function oneAwayText(
  name: string,
  self: boolean,
  o: { lineLabel: string; missingItemText?: string; fullBoard: boolean },
): string {
  const who = self ? 'You' : name;
  const is = self ? 'are' : 'is';
  const needs = self ? 'need' : 'needs';
  if (o.fullBoard) {
    return o.missingItemText
      ? `${who} ${needs} just ${q(o.missingItemText)} for the FULL BOARD! 🔥`
      : `${who} ${is} one square from the FULL BOARD! 🔥`;
  }
  return o.missingItemText
    ? `${who} ${needs} ${q(o.missingItemText)} for ${o.lineLabel}! 🔥`
    : `${who} ${is} one square from a line! 🔥`;
}

export function fullBoardText(name: string, self: boolean): string {
  return `${self ? 'You' : name} completed the WHOLE BOARD! 🏆🎆`;
}

export function joinText(name: string): string {
  return `${name} joined the party ✨`;
}
