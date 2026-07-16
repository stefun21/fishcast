import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";

const output = resolve(process.argv[2] || "tmp/anpa-text.txt");
const workdir = resolve(process.argv[3] || "tmp/anpa");
mkdirSync(workdir, { recursive: true });

const headers = { "user-agent": "FishCast-Romania/3.0 (+public-data-catalog)", accept: "text/html,application/pdf" };

async function get(url) {
  const response = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response;
}

function absolute(href) {
  try { return new URL(href, "https://www.anpa.ro/").toString(); } catch { return null; }
}

try {
  const html = await (await get("https://www.anpa.ro/?cat=3")).text();
  const links = [...html.matchAll(/href=["']([^"']+\.pdf(?:\?[^"']*)?)["']/gi)]
    .map((match) => absolute(match[1]))
    .filter(Boolean);
  const selected = [...new Set(links)].filter((url) => /habitat|piscicol|contractat|necontractat|romsilva|pescuit/i.test(url)).slice(0, 16);
  const texts = [];

  for (let index = 0; index < selected.length; index += 1) {
    try {
      const url = selected[index];
      const pdf = Buffer.from(await (await get(url)).arrayBuffer());
      const pdfPath = resolve(workdir, `${index}-${basename(new URL(url).pathname) || "anpa.pdf"}`);
      const txtPath = `${pdfPath}.txt`;
      writeFileSync(pdfPath, pdf);
      execFileSync("pdftotext", ["-layout", pdfPath, txtPath], { stdio: "ignore" });
      if (existsSync(txtPath)) texts.push(readFileSync(txtPath, "utf8"));
    } catch (error) {
      console.warn(`ANPA PDF ignorat: ${error instanceof Error ? error.message : error}`);
    }
  }

  writeFileSync(output, texts.join("\n\n"), "utf8");
  console.log(`ANPA: ${selected.length} documente găsite, ${texts.length} extrase.`);
} catch (error) {
  console.warn(`ANPA indisponibil: ${error instanceof Error ? error.message : error}`);
  writeFileSync(output, "", "utf8");
}
