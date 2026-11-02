// Portrait moods that match what is being said (v0.6). Pure: text in, mood out.
const CUES = {
  worried: /\b(afraid|fear|scared|cold|dark|fog|tide|gone|lost|vanish\w*|blank|silent|cr(y|ied)|wept|hush\w*|missing|forgot\w*|worr\w*|sorry)\b/gi,
  smile: /\b(laugh\w*|smil\w*|grin\w*|warm|bright|glad|thank\w*|well done|welcome|proud|lovely|good)\b/gi,
  stern: /\b(frown\w*|stern|sharp\w*|warn\w*|must|never|angry|hard|enough|careful)\b/gi,
  sly: /\b(sly|wink\w*|secret\w*|velvet|smirk\w*|clever|dinner)\b/gi,
};

// moods: the moods this portrait can show. Returns the best-matching one, or 'neutral'.
export function moodFor(text, moods = ['neutral', 'smile', 'worried']) {
  let best = 'neutral', score = 0;
  for (const m of moods) {
    const n = (String(text || '').match(CUES[m] || /$^/g) || []).length;
    if (n > score) { best = m; score = n; }
  }
  return best;
}

// Who a story page is about: the first cast member named in it.
const NAMES = [['Wren', 'wren'], ['Sevrin', 'sevrin'], ['Hask', 'hask'], ['Isolde', 'isolde'], ['Tansy', 'tansy'], ['Calder', 'calder'], ['Ennick', 'ennick'], ['Mosk', 'mosk'], ['Fennick', 'fennick']];
export function speakerOf(text) {
  let at = Infinity, who = null;
  for (const [name, id] of NAMES) { const i = String(text || '').indexOf(name); if (i >= 0 && i < at) { at = i; who = id; } }
  return who;
}
