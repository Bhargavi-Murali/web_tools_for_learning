const fs = require("node:fs");
const path = require("node:path");

const problems = [];
for (const file of process.argv.slice(2)) {
  const html = fs.readFileSync(file, "utf8");
  const links = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)/gi)];
  if (links.length !== 1) problems.push(`${file}: found ${links.length} stylesheet links`);
  for (const match of links) {
    const target = path.resolve(path.dirname(file), match[1].split(/[?#]/)[0]);
    if (!fs.existsSync(target)) problems.push(`${file}: missing ${match[1]}`);
  }
  if (!/data-page=["'][^"']+/.test(html)) problems.push(`${file}: missing data-page scope`);
  if (/<style\b|\sstyle=/i.test(html)) problems.push(`${file}: embedded CSS remains`);
}

const css = fs.readFileSync(path.resolve("css/mystyle.css"), "utf8")
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, "");
let depth = 0;
for (const character of css) {
  if (character === "{") depth += 1;
  if (character === "}") depth -= 1;
  if (depth < 0) problems.push("css/mystyle.css: unexpected closing brace");
}
if (depth) problems.push(`css/mystyle.css: brace depth ended at ${depth}`);

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("Central stylesheet links, page scopes, and CSS structure: ok");
