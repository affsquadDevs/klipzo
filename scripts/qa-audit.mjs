/**
 * Static QA audit over dist/ (§7): secrets, internal links, canonicals, JSON-LD,
 * required files, and editor-bundle isolation on content pages.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";
let fail = 0;
const ok = (m) => console.log(`  ✓ ${m}`);
const bad = (m) => {
  console.log(`  ✗ ${m}`);
  fail++;
};

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const files = walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith(".html"));

console.log(`\n[1] Secrets / real IDs not committed`);
{
  const srcFiles = walk("src").concat(["public/ads.txt"]);
  const patterns = [/ca-pub-\d{10,}/, /\bG-[A-Z0-9]{8,}\b/, /\bGTM-[A-Z0-9]{5,}\b/];
  // The intentionally-configured live ids (GTM + AdSense). Any OTHER real-looking id
  // is still flagged, so a stray/leaked id can't slip in unnoticed.
  const allowed = new Set(["GTM-5225JJ9M", "ca-pub-2980943706375055"]);
  let found = false;
  for (const f of srcFiles) {
    if (!existsSync(f)) continue;
    const t = readFileSync(f, "utf8");
    for (const re of patterns) {
      const m = t.match(re);
      // Allow the obvious placeholder tokens and the configured live ids.
      if (m && !/X{5,}|TESTONLY|__/.test(m[0]) && !allowed.has(m[0])) {
        bad(`unexpected real-looking id "${m[0]}" in ${f}`);
        found = true;
      }
    }
  }
  if (!found) ok("no unexpected ad/analytics IDs (only the configured GTM + AdSense ids)");
}

console.log(`\n[2] Required files present`);
for (const f of ["robots.txt", "ads.txt", "llms.txt", "sitemap.xml", "favicon.svg"]) {
  existsSync(join(DIST, f)) ? ok(f) : bad(`missing ${f}`);
}

console.log(`\n[3] Every page: single <h1>, canonical, <title>`);
for (const f of htmlFiles) {
  const html = readFileSync(f, "utf8");
  const rel = "/" + relative(DIST, f).replace(/index\.html$/, "").replace(/\.html$/, "");
  // The editor is a noindex client-only app, not a ranking page — no H1 required.
  const isApp = rel.startsWith("/editor");
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  const canonical = /<link\s+rel="canonical"/.test(html);
  const title = /<title>/.test(html);
  if (!isApp && h1 !== 1) bad(`${rel} has ${h1} <h1> (want 1)`);
  if (!canonical) bad(`${rel} missing canonical`);
  if (!title) bad(`${rel} missing <title>`);
}
ok(`checked ${htmlFiles.length} pages for h1/canonical/title`);

console.log(`\n[4] JSON-LD parses on every content page`);
{
  let count = 0;
  for (const f of htmlFiles) {
    const html = readFileSync(f, "utf8");
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    for (const b of blocks) {
      try {
        JSON.parse(b[1].replace(/\\u003c/g, "<"));
        count++;
      } catch (e) {
        bad(`invalid JSON-LD in ${f}: ${e.message}`);
      }
    }
  }
  ok(`${count} JSON-LD blocks parsed`);
}

console.log(`\n[5] Internal links resolve`);
{
  const pageExists = (p) => {
    p = p.split("#")[0].split("?")[0];
    if (p === "/" || p === "") return existsSync(join(DIST, "index.html"));
    const clean = p.replace(/\/$/, "");
    return (
      existsSync(join(DIST, clean + ".html")) ||
      existsSync(join(DIST, clean, "index.html")) ||
      existsSync(join(DIST, clean)) // static asset
    );
  };
  const broken = new Set();
  for (const f of htmlFiles) {
    const html = readFileSync(f, "utf8");
    for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
      const href = m[1];
      if (href.startsWith("//")) continue;
      if (!pageExists(href)) broken.add(href);
    }
  }
  if (broken.size === 0) ok("no broken internal links");
  else for (const b of broken) bad(`broken link: ${b}`);
}

console.log(`\n[6] Editor bundle NOT on content pages`);
{
  const content = ["index.html", "crop-image/index.html", "guides/index.html", "privacy-policy/index.html"];
  for (const c of content) {
    const p = join(DIST, c);
    if (!existsSync(p)) continue;
    const html = readFileSync(p, "utf8");
    if (/EditorApp|mediabunny|react-konva|PhotoEditor|VideoEditor/.test(html)) bad(`${c} references editor code`);
    else ok(`${c} clean of editor bundle`);
  }
}

console.log(`\n${fail === 0 ? "✅ QA PASSED" : `❌ QA FAILED (${fail} issue${fail === 1 ? "" : "s"})`}\n`);
process.exit(fail === 0 ? 0 : 1);
