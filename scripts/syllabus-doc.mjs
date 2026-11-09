// Writes docs/SYLLABUS.md: the 52-week syllabus as the game ships it, generated from src/data/curriculum.js.
// Run: npx vite-node scripts/syllabus-doc.mjs
import { writeFileSync } from 'node:fs';
import { MODULES, WEEKS, TEMPLATE_NAME, GATES } from '../src/data/curriculum.js';

const drill = (d) => {
  const bits = [TEMPLATE_NAME[d.t] || d.t];
  const extra = [];
  if (d.n) extra.push(`${d.n} items`);
  if (d.s) extra.push(`${d.s}s study`);
  for (const k of ['src', 'peg', 'group', 'lang', 'dir', 'kind', 'sc', 'skill']) if (d[k] != null) extra.push(`${k}: ${d[k]}`);
  for (const k of ['reverse', 'interference', 'timed', 'numbered', 'surname', 'skim', 'choose', 'gender', 'alike', 'sounds']) if (d[k]) extra.push(k);
  return `${bits.join('')} (${extra.join(', ')})`;
};
let out = '# Mnemos syllabus (generated)\n\nGenerated from `src/data/curriculum.js` by `scripts/syllabus-doc.mjs`. Do not edit by hand.\n\n';
for (const m of MODULES) {
  out += `## ${m.id}. Month ${m.month}: ${m.title} (${m.district})\n\n`;
  out += `- **Objective:** ${m.objective}\n- **Techniques:** ${m.technique}\n- **Gate:** ${m.assessment} Mastery: ${m.mastery}\n- **Retention:** ${m.retention}\n- **Transfer:** ${m.transfer}\n- **Story:** ${m.narrative}\n\n`;
  out += '| Week | Title | Objective | Drills | Weekly check |\n| --- | --- | --- | --- | --- |\n';
  for (const w of WEEKS.filter((x) => x.w >= m.weeks[0] && x.w <= m.weeks[1])) {
    out += `| ${w.w} | ${w.title} | ${w.obj} | ${(w.drills || []).map(drill).join('; ')} | ${w.check ? drill(w.check) : ''} |\n`;
  }
  out += '\n';
}
if (GATES) out += '## Gates\n\n```\n' + JSON.stringify(GATES, null, 1) + '\n```\n';
writeFileSync('docs/SYLLABUS.md', out);
console.log('wrote docs/SYLLABUS.md', out.length);
