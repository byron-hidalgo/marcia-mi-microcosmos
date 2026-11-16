// Chequeo antes de push: revisa que todas las imágenes y archivos referenciados existan.
// Uso:  npm run check
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sources = ["index.html", ...fs.readdirSync(path.join(ROOT, "js")).map((f) => "js/" + f)];
const refRe = /(?:src|href)\s*=\s*["']([^"'#?]+)["']|["']((?:images|js|css)\/[^"'?#]+)["']/g;

let errors = 0, checked = 0;
for (const src of sources) {
  const text = fs.readFileSync(path.join(ROOT, src), "utf8");
  for (const m of text.matchAll(refRe)) {
    const ref = m[1] || m[2];
    if (/^(https?:|data:|mailto:|\$\{)/.test(ref) || ref.includes("${")) continue;
    checked++;
    if (!fs.existsSync(path.join(ROOT, ref))) { console.log(`  ✗ ${src}: falta "${ref}"`); errors++; }
  }
}
console.log(errors ? `\n  ${errors} problema(s) de ${checked} referencias. Corrige antes de hacer push.\n`
                   : `\n  ✓ Todo bien: ${checked} referencias revisadas.\n`);
process.exit(errors ? 1 : 0);
