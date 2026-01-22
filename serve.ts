import express from "express";
import { config } from "dotenv";
import { load } from "cheerio";

config();

const PORT = Number(process.env.PORT ?? 3000);

async function getCache() {
  const resp = await fetch("http://roster.transithistory.org/");
  return await resp.text();
}

function getUpdatedDate(html: string): string {
  const $ = load(html);
  const paragraphs = $("p").toArray().map((el) => $(el).text().replace(/\s+/g, " ").trim());
  const versionText = paragraphs.find((t) => t.match(/\d{1,2}\/\d{1,2}\/\d{2}\s+Version/i));
  const match = versionText?.match(/(\d{1,2}\/\d{1,2}\/\d{2})\s+Version/i);
  return match ? match[1] : "unknown";
}

function getBL(html: string) {
  const $ = load(html);
  const paragraphs = $("p").toArray().map((el) => $(el).text().replace(/\s+/g, " ").trim());
  const actives = paragraphs.find((t) => t.includes("Blue Line Active Fleet"));
  const activeMatch = actives?.match(/Blue Line Active Fleet\s*\((\d+)\s*#5\s*cars\)/i);
  return {
    source: "http://roster.transithistory.org/",
    updated: getUpdatedDate(html),
    active: activeMatch
      ? {
          total: Number(activeMatch[1]),
          series: {
            "#5": Number(activeMatch[1]),
          },
        }
      : null,
    outOfService: null,
  };
}

function getOL(html: string) {
  const $ = load(html);
  const paragraphs = $("p").toArray().map((el) => $(el).text().replace(/\s+/g, " ").trim());
  const actives = paragraphs.find((t) => t.includes("Active Orange Line Fleet"));
  const oos = paragraphs.find((t) => t.includes("Out of Service Orange Line cars"));
  const activeMatch = actives?.match(/Active Orange Line Fleet:\s*(\d+)\s*cars\s*\((\d+)\s*#14\s*cars\)/i);
  const outMatch = oos?.match(/Out of Service Orange Line cars\s*(\d+)\s*cars\s*\((\d+)\s*#\s*14\s*cars\)/i);
  return {
    source: "http://roster.transithistory.org/",
    updated: getUpdatedDate(html),
    active: activeMatch
      ? {
          total: Number(activeMatch[1]),
          series: {
            "#14": Number(activeMatch[2]),
          },
        }
      : null,
    outOfService: outMatch
      ? {
          total: Number(outMatch[1]),
          series: {
            "#14": Number(outMatch[2]),
          },
        }
      : null,
  };
}

function getRL(html: string) {
  const $ = load(html);
  const paragraphs = $("p").toArray().map((el) => $(el).text().replace(/\s+/g, " ").trim());
  const actives = paragraphs.find((t) => t.startsWith("Red Line Active Fleet"));
  const oos = paragraphs.find((t) => t.startsWith("Out of Service Red Line cars"));
  const activeMatch = actives?.match(/Red Line Active Fleet:\s*(\d+)\s*cars\s*\((\d+)\s*#1.*?,\s*(\d+)\s*#2.*?,\s*(\d+)\s*#3.*?,\s*and\s*(\d+)\s*#4/i);
  const outMatch = oos?.match(/Out of Service Red Line cars:\s*(\d+)\s*cars\s*\((\d+)\s*#2/i);
  return {
    source: "http://roster.transithistory.org/",
    updated: getUpdatedDate(html),
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

function getGL(html: string) {
  const $ = load(html);
  const paragraphs = $("p").toArray().map((el) => $(el).text().replace(/\s+/g, " ").trim());
  const actives = paragraphs.find((t) => t.includes("Green Line Active Fleet"));
  const oos = paragraphs.find((t) => t.includes("Green Line Out of Service Cars"));
  const mattapan = paragraphs.find((t) => t.includes("Mattapan-Ashmont Fleet"));
  
  const activeMatch = actives?.match(/Green Line Active Fleet\s*\((\d+)\s*cars\)/i);
  const type7Match = paragraphs.find((t) => t.includes("Type 7s:"))?.match(/Type 7s:\s*(\d+)\s*active cars/i);
  const type8Match = paragraphs.find((t) => t.includes("Type 8s:"))?.match(/Type 8s:\s*(\d+)\s*active cars/i);
  const type9Match = paragraphs.find((t) => t.includes("Type 9s:"))?.match(/Type 9s:\s*(\d+)\s*active cars/i);
  const outMatch = oos?.match(/Green Line Out of Service Cars:\s*(\d+)\s*cars\s*\((\d+)\s*Type 7s,\s*(\d+)\s*Type 8s\)/i);
  const mattapanMatch = mattapan?.match(/Mattapan-Ashmont Fleet:\s*(\d+)\s*cars\s*\((\d+)\s*PCC cars,\s*(\d+)\s*in service,\s*(\d+)\s*out of service\)/i);
  
  return {
    source: "http://roster.transithistory.org/",
    updated: getUpdatedDate(html),
    active: activeMatch
      ? {
          total: Number(activeMatch[1]),
          types: {
            "Type 7": type7Match ? Number(type7Match[1]) : null,
            "Type 8": type8Match ? Number(type8Match[1]) : null,
            "Type 9": type9Match ? Number(type9Match[1]) : null,
          },
        }
      : null,
    outOfService: outMatch
      ? {
          total: Number(outMatch[1]),
          types: {
            "Type 7": Number(outMatch[2]),
            "Type 8": Number(outMatch[3]),
          },
        }
      : null,
    mattapan: mattapanMatch
      ? {
          total: Number(mattapanMatch[1]),
          pccCars: Number(mattapanMatch[2]),
          inService: Number(mattapanMatch[3]),
          outOfService: Number(mattapanMatch[4]),
        }
      : null,
  };
}

function getCR(html: string) {
  const $ = load(html);
  const h2s = $("h2").toArray().map((el) => $(el).text().replace(/\s+/g, " ").trim());
  const coaches = h2s.find((t) => t.includes("Coaches"));
  const coachMatch = coaches?.match(/Coaches\s*\((\d+)\s*coaches.*?\+\s*(\d+)\s*on order\)/i);
  
  return {
    source: "http://roster.transithistory.org/",
    updated: getUpdatedDate(html),
    coaches: coachMatch
      ? {
          active: Number(coachMatch[1]),
          onOrder: Number(coachMatch[2]),
        }
      : null,
  };
}

const app = express();

app.get("/", (_req, res) => {
  res.json({ 
    status: "ok", 
    source: "http://roster.transithistory.org/",
    endpoints: {
      blueLine: "/api/bl",
      orangeLine: "/api/ol",
      redLine: "/api/rl",
      greenLine: "/api/gl",
      commuterRail: "/api/cr",
      all: "/api/all"
    }
  });
});

app.get("/api/bl", async (_req, res) => {
  try {
    const html = await getCache();
    const data = getBL(html);
    res.json(data);
  } catch (err) {
    console.error("Failed to load cached.html", err);
    res.status(500).json({ error: "Failed to read cache" });
  }
});

app.get("/api/ol", async (_req, res) => {
  try {
    const html = await getCache();
    const data = getOL(html);
    res.json(data);
  } catch (err) {
    console.error("Failed to load cached.html", err);
    res.status(500).json({ error: "Failed to read cache" });
  }
});

app.get("/api/rl", async (_req, res) => {
  try {
    const html = await getCache();
    const data = getRL(html);
    res.json(data);
  } catch (err) {
    console.error("Failed to load cached.html", err);
    res.status(500).json({ error: "Failed to read cache" });
  }
});

app.get("/api/gl", async (_req, res) => {
  try {
    const html = await getCache();
    const data = getGL(html);
    res.json(data);
  } catch (err) {
    console.error("Failed to load cached.html", err);
    res.status(500).json({ error: "Failed to read cache" });
  }
});

app.get("/api/cr", async (_req, res) => {
  try {
    const html = await getCache();
    const data = getCR(html);
    res.json(data);
  } catch (err) {
    console.error("Failed to load cached.html", err);
    res.status(500).json({ error: "Failed to read cache" });
  }
});

app.get("/api/all", async (_req, res) => {
  try {
    const html = await getCache();
    const data = {
      blueLine: getBL(html),
      orangeLine: getOL(html),
      redLine: getRL(html),
      greenLine: getGL(html),
      commuterRail: getCR(html),
    };
    res.json(data);
  } catch (err) {
    console.error("Failed to load cached.html", err);
    res.status(500).json({ error: "Failed to read cache" });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
