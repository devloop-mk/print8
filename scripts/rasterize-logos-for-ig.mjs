import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outDir = path.resolve(
  root,
  "..",
  "print8-instagram-posts",
  "logos"
);

const jobs = [
  {
    src: path.join(root, "public", "logo", "print 8 logo horizontal.svg"),
    dest: path.join(outDir, "logo-horizontal-dark.png"),
    width: 1200,
    density: 600,
  },
  {
    src: path.join(root, "public", "logo", "print 8 logo horizontal light.svg"),
    dest: path.join(outDir, "logo-horizontal-light.png"),
    width: 1200,
    density: 600,
  },
  {
    src: path.join(root, "public", "logo", "print 8 number only.svg"),
    dest: path.join(outDir, "logo-mark.png"),
    width: 512,
    density: 600,
  },
];

const results = [];

for (const job of jobs) {
  const pipeline = sharp(job.src, { density: job.density }).resize({
    width: job.width,
    withoutEnlargement: false,
  });
  await pipeline.png().toFile(job.dest);
  const meta = await sharp(job.dest).metadata();
  results.push({
    path: job.dest,
    width: meta.width,
    height: meta.height,
  });
  console.log(
    `${job.dest}\n  ${meta.width}x${meta.height}`
  );
}

console.log(JSON.stringify(results, null, 2));
