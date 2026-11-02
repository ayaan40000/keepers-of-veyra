// Send drafting jobs to the local Qwen (LM Studio). Usage: node scripts/draft-local.mjs jobs.json out.json
// jobs.json: { "system": "...", "temperature": 0.7, "jobs": [{ "id": "x", "prompt": "...", "images": ["optional/path.png"] }] }
// Load Qwen first, ONE model at a time (31 GB RAM): lms load <model> --context-length 32768 --gpu max -y ; afterwards lms unload --all.
// Output is a first draft only: review and edit by hand before it goes into src/data/.
import fs from 'node:fs';

const URL = 'http://127.0.0.1:1234/v1/chat/completions';
const MODEL = process.env.QWEN_ID || 'qwen3.8-27b-uncensored-hauhaucs-aggressive-mtp@iq3_xs'; // QWEN_ID = the --identifier you loaded it with
const [jobsFile, outFile] = process.argv.slice(2);
const { system = '', temperature = 0.7, max_tokens = 1400, jobs } = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
const out = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};

for (const job of jobs) {
  if (out[job.id]) continue;
  const t0 = Date.now();
  try {
    const r = await fetch(URL, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL, temperature, max_tokens, frequency_penalty: 0.8, presence_penalty: 0.5, reasoning_effort: 'none',
        messages: [{ role: 'system', content: system }, { role: 'user', content: job.images?.length
          ? [{ type: 'text', text: job.prompt }, ...job.images.map((f) => ({ type: 'image_url', image_url: { url: 'data:image/png;base64,' + fs.readFileSync(f).toString('base64') } }))]
          : job.prompt }],
      }),
    });
    const j = await r.json();
    out[job.id] = j.choices?.[0]?.message?.content?.trim() || `ERROR ${JSON.stringify(j).slice(0, 200)}`;
    console.log(job.id, `${((Date.now() - t0) / 1000).toFixed(0)}s`, out[job.id].length, 'chars');
  } catch (e) { console.log(job.id, 'failed', e.message); }
  fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
}
