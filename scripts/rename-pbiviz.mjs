// After `pbiviz package`, copy the GUID-named output to a friendly name:
//   dist/htmlStudio<guid>.X.Y.Z.0.pbiviz  ->  dist/html-studio-X.Y.Z.pbiviz
// The GUID-named file is what pbiviz emits and can't be changed (the GUID
// must be globally unique); this is just a nicer name for releases.
import { readFileSync, readdirSync, copyFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fullVersion = JSON.parse(readFileSync(join(root, "pbiviz.json"), "utf8")).visual.version;
const version = fullVersion.replace(/\.0$/, "");
const dist = join(root, "dist");
// Match this build's GUID-named file specifically - stale builds for other
// versions may still be sitting in dist/.
const src =
    readdirSync(dist).find((f) => f.endsWith(`.${fullVersion}.pbiviz`) && !f.startsWith("html-studio-")) ||
    readdirSync(dist).find((f) => f.endsWith(".pbiviz") && !f.startsWith("html-studio-"));
if (!src) {
    console.error("rename-pbiviz: no .pbiviz found in dist/");
    process.exit(0);
}
const dest = `html-studio-${version}.pbiviz`;
copyFileSync(join(dist, src), join(dist, dest));
console.log(`rename-pbiviz: dist/${dest}`);
