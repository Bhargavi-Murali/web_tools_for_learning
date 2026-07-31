const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const output = path.join(root, "css", "mystyle.css");

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === ".git" || entry.name === "vendor") return [];
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function pageId(file) {
  return path.relative(root, file).replace(/\.html$/i, "").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}

function mergeDuplicateClasses(html) {
  return html.replace(/<([a-z][\w:-]*)(\s[^<>]*?)?>/gi, (tag) => {
    const classes = [...tag.matchAll(/\sclass=["']([^"']*)["']/gi)];
    if (classes.length < 2) return tag;
    const merged = [...new Set(classes.flatMap((item) => item[1].split(/\s+/)).filter(Boolean))].join(" ");
    let found = false;
    return tag.replace(/\sclass=["'][^"']*["']/gi, () => {
      if (found) return "";
      found = true;
      return ` class="${merged}"`;
    });
  });
}

if (process.argv.includes("--repair-classes")) {
  const files = walk(root).filter((file) => file.toLowerCase().endsWith(".html"));
  for (const file of files) fs.writeFileSync(file, mergeDuplicateClasses(fs.readFileSync(file, "utf8")), "utf8");
  console.log(`Repaired duplicate class attributes in ${files.length} pages.`);
  process.exit(0);
}

if (process.argv.includes("--repair-scoped-roots")) {
  const css = fs.readFileSync(output, "utf8");
  let seenDocumentRoot = false;
  const repaired = css.replace(/:root\b/g, (selector) => {
    if (!seenDocumentRoot) {
      seenDocumentRoot = true;
      return selector;
    }
    return ":scope";
  });
  fs.writeFileSync(output, repaired, "utf8");
  console.log("Converted page-level :root selectors to :scope.");
  process.exit(0);
}

const sections = [];
const htmlFiles = walk(root).filter((file) => file.toLowerCase().endsWith(".html"));

for (const file of htmlFiles) {
  let html = fs.readFileSync(file, "utf8");
  const id = pageId(file);
  const cssParts = [];

  html = html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => {
    cssParts.push(css.trim().replace(/:root\b/g, ":scope"));
    return "";
  });

  html = html.replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi, (tag) => {
    const match = tag.match(/href=["']([^"']+)["']/i);
    if (!match || /^(?:https?:)?\/\//i.test(match[1])) return tag;
    const cleanHref = match[1].split(/[?#]/)[0];
    const cssFile = path.resolve(path.dirname(file), cleanHref);
    if (cssFile === output) return "";
    if (fs.existsSync(cssFile)) cssParts.push(fs.readFileSync(cssFile, "utf8").trim().replace(/:root\b/g, ":scope"));
    return "";
  });

  let inlineIndex = 0;
  html = html.replace(/\sstyle=["']([^"']+)["']/gi, (_, declarations) => {
    const className = `central-inline-${++inlineIndex}`;
    cssParts.push(`.${className} { ${declarations.trim()} }`);
    return ` class="${className}"`;
  });

  html = html.replace(/<body\b([^>]*)>/i, (tag, attributes) => {
    if (/\bdata-page=/i.test(attributes)) {
      return tag.replace(/\bdata-page=["'][^"']*["']/i, `data-page="${id}"`);
    }
    return `<body${attributes} data-page="${id}">`;
  });

  const relativeCss = path.relative(path.dirname(file), output).replaceAll(path.sep, "/");
  const link = `  <link rel="stylesheet" href="${relativeCss}">\n`;
  html = html.replace(/<\/head>/i, `${link}</head>`);
  fs.writeFileSync(file, mergeDuplicateClasses(html), "utf8");

  if (cssParts.length) {
    sections.push(`/* Page: ${path.relative(root, file).replaceAll(path.sep, "/")} */\n@scope (body[data-page="${id}"]) {\n${cssParts.join("\n\n")}\n}`);
  }
}

const foundation = `/*
  Central stylesheet for Interactive Learning Lab.
  Each page's original design is preserved in its scoped section below.
*/
`;

const themeOverrides = "";

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${foundation}\n${sections.join("\n\n")}\n${themeOverrides}`, "utf8");
console.log(`Centralized ${htmlFiles.length} pages into ${path.relative(root, output)}.`);
