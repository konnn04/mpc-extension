import fs from "node:fs";
import path from "node:path";

const nextVersion = process.argv[2];

if (!nextVersion) {
  console.error("❌ Missing version argument");
  process.exit(1);
}

const filePath = path.resolve(process.cwd(), "wxt.config.ts");

let content = fs.readFileSync(filePath, "utf8");
const newContent = content.replace(/version:\s*["'][^"']+["']/, `version: "${nextVersion}"`);

if (content === newContent) {
  console.error("❌ Could not find manifest.version in wxt.config.ts");
  process.exit(1);
}

fs.writeFileSync(filePath, newContent, "utf8");

console.log(`✅ Updated wxt.config.ts manifest.version -> ${nextVersion}`);
