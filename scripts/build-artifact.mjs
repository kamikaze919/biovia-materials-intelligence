import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const distDir = "C:\\Users\\ssl22\\Downloads\\Claude Code\\dist";
const assetsDir = join(distDir, "assets");

const files = readdirSync(assetsDir);
const cssFile = files.find((f) => f.endsWith(".css"));
const jsFile = files.find((f) => f.endsWith(".js"));
const pngFiles = files.filter((f) => f.endsWith(".png"));
const ttfFiles = files.filter((f) => f.endsWith(".ttf"));

let css = readFileSync(join(assetsDir, cssFile), "utf8");
let js = readFileSync(join(assetsDir, jsFile), "utf8");

for (const ttf of ttfFiles) {
  const b64 = readFileSync(join(assetsDir, ttf)).toString("base64");
  const dataUri = `data:font/ttf;base64,${b64}`;
  css = css.split(`./${ttf}`).join(dataUri);
}

for (const png of pngFiles) {
  const b64 = readFileSync(join(assetsDir, png)).toString("base64");
  const dataUri = `data:image/png;base64,${b64}`;
  js = js.split(png).join(dataUri);
}

const out = `<title>BIOVIA Materials Intelligence</title>
<div id="root"></div>
<style>
${css}
</style>
<script type="module">
${js}
</script>
`;

writeFileSync("C:\\Users\\ssl22\\Downloads\\Claude Code\\scripts\\artifact-output.html", out, "utf8");
console.log("wrote artifact-output.html, size:", (out.length / 1024 / 1024).toFixed(2), "MB");
console.log("css refs remaining .ttf:", (css.match(/\.ttf/g) || []).length);
console.log("js refs remaining .png:", (js.match(/\.png/g) || []).length);
