import express from "express";
import { config } from "dotenv";
import { promises as fs } from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import { cacher } from "./utils/cache";

config();

const PORT = Number(process.env.PORT ?? 3000);
const CACHE_PATH = path.resolve("cached.html");
const SOURCE_URL = "http://roster.transithistory.org/";

// Kick off the periodic fetch/cache cycle; first call returns a promise if you need the HTML.
void cacher(SOURCE_URL);

async function readCachedHtml(): Promise<string> {
  return fs.readFile(CACHE_PATH, "utf8");
}

function parseRedLineCounts(html: string) {
  const $ = load(html);
  const paragraphs = $("p").toArray().map((el) => $(el).text().replace(/\s+/g, " ").trim());

  const activeLine = paragraphs.find((t) => t.startsWith("Red Line Active Fleet"));
  const outOfServiceLine = paragraphs.find((t) => t.startsWith("Out of Service Red Line cars"));

  const activeMatch = activeLine?.match(/Red Line Active Fleet:\s*(\d+)\s*cars\s*\((\d+)\s*#1.*?,\s*(\d+)\s*#2.*?,\s*(\d+)\s*#3.*?,\s*and\s*(\d+)\s*#4/i);
  const outMatch = outOfServiceLine?.match(/Out of Service Red Line cars:\s*(\d+)\s*cars\s*\((\d+)\s*#2/i);

  return {
    source: SOURCE_URL,
    active: activeMatch
      ? {
          total: Number(activeMatch[1]),
          series: {
            "#1": Number(activeMatch[2]),
            "#2": Number(activeMatch[3]),
            "#3": Number(activeMatch[4]),
            "#4": Number(activeMatch[5]),
          },
        }
      : null,
    outOfService: outMatch
      ? {
          total: Number(outMatch[1]),
          series: {
            "#2": Number(outMatch[2]),
          },
        }
      : null,
  };
}

const app = express();

app.get("/", (_req, res) => {
  res.json({ status: "ok", cache: path.basename(CACHE_PATH), source: SOURCE_URL });
});

app.get("/red-line/counts", async (_req, res) => {
  try {
    const html = await readCachedHtml();
    const data = parseRedLineCounts(html);
    res.json(data);
  } catch (err) {
    console.error("Failed to load cached.html", err);
    res.status(500).json({ error: "Failed to read cache" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
