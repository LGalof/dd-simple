import { readFile, writeFile } from "node:fs/promises";

const [reportPath, sourcePrefix] = process.argv.slice(2);

if (!reportPath || !sourcePrefix) {
  throw new Error(
    "Usage: node scripts/prefix-lcov-paths.mjs <report-path> <source-prefix>",
  );
}

const normalizedPrefix = sourcePrefix.replaceAll("\\", "/").replace(/\/$/, "");
const report = await readFile(reportPath, "utf8");

const normalizedReport = report.replace(/^SF:(.+)$/gm, (_line, rawPath) => {
  const sourcePath = rawPath.trim().replaceAll("\\", "/");
  const isAbsolute = sourcePath.startsWith("/") || /^[A-Za-z]:\//.test(sourcePath);

  if (isAbsolute || sourcePath.startsWith(`${normalizedPrefix}/`)) {
    return `SF:${sourcePath}`;
  }

  return `SF:${normalizedPrefix}/${sourcePath}`;
});

await writeFile(reportPath, normalizedReport, "utf8");
