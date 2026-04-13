import { readdir, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const coversDir = path.join(projectRoot, "assets", "images", "books");
const sourceDir = path.join(coversDir, "source");
const sourceExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const variants = [
  { suffix: "128", width: 128, withoutEnlargement: true },
  { suffix: "256", width: 256, withoutEnlargement: false },
];

async function getSourceEntries() {
  const dirents = await readdir(sourceDir, { withFileTypes: true });

  return dirents
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name)
    .filter((name) => sourceExtensions.has(path.extname(name).toLowerCase()))
    .sort((left, right) => left.localeCompare(right));
}

function assertUniqueStems(fileNames) {
  const seenStems = new Set();

  for (const fileName of fileNames) {
    const stem = path.parse(fileName).name;

    if (seenStems.has(stem)) {
      throw new Error(`Duplicate source cover stem: ${stem}`);
    }

    seenStems.add(stem);
  }
}

async function clearGeneratedOutputs() {
  const dirents = await readdir(coversDir, { withFileTypes: true });
  const generatedFiles = dirents
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name)
    .filter((name) => /-(128|256)\.webp$/u.test(name));

  await Promise.all(
    generatedFiles.map((fileName) => rm(path.join(coversDir, fileName))),
  );
}

async function buildVariant(sourceName, variant) {
  const stem = path.parse(sourceName).name;
  const inputPath = path.join(sourceDir, sourceName);
  const outputPath = path.join(coversDir, `${stem}-${variant.suffix}.webp`);

  await sharp(inputPath)
    .rotate()
    .resize({
      width: variant.width,
      fit: "inside",
      withoutEnlargement: variant.withoutEnlargement,
    })
    .webp({ quality: 78 })
    .toFile(outputPath);
}

async function main() {
  await mkdir(sourceDir, { recursive: true });

  const sourceEntries = await getSourceEntries();

  if (sourceEntries.length === 0) {
    console.warn(`No source covers found in ${sourceDir}`);
    return;
  }

  assertUniqueStems(sourceEntries);
  await clearGeneratedOutputs();

  for (const sourceName of sourceEntries) {
    for (const variant of variants) {
      await buildVariant(sourceName, variant);
    }
  }

  console.log(`Built ${sourceEntries.length * variants.length} book cover variants.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
