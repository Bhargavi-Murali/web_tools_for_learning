const fs = require("node:fs");

let failed = false;

for (const file of process.argv.slice(2)) {
  const html = fs.readFileSync(file, "utf8");
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1]);

  scripts.forEach((source, index) => {
    try {
      new Function(source);
    } catch (error) {
      failed = true;
      console.error(`${file} inline script ${index + 1}: ${error.message}`);
    }
  });

  if (!failed) console.log(`${file}: syntax ok`);
}

if (failed) process.exitCode = 1;
