import { promises as fs } from "fs";
import path from "node:path";

const RELOAD_TIME = (Number(process.env.RELOAD_TIME_HOURS) || 6) * 60 * 60 * 1000;
const CACHE_PATH = path.resolve("cached.html");
let lastFetched = 0;
let timerStarted = false;
let inFlight: Promise<string> | null = null;

async function fileExists(filePath: string): Promise<boolean> {
	try {
		await fs.access(filePath);
		return true;
	} catch {
		return false;
	}
}

async function saveFS(url: string): Promise<string> {
	const response = await fetch(url, { headers: { "User-Agent": "API Cacher" } });
	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
	}
	const html = await response.text();
	await fs.writeFile(CACHE_PATH, html, "utf8");
	lastFetched = Date.now();
	return html;
}

async function getCache(url: string): Promise<string> {
	const now = Date.now();
	if (!lastFetched && (await fileExists(CACHE_PATH))) {
		const stats = await fs.stat(CACHE_PATH);
		lastFetched = Math.floor(stats.mtimeMs);
	}
	if (inFlight) {
		return inFlight;
	}
	const cacheIsFresh = now - lastFetched < RELOAD_TIME;
	if (cacheIsFresh && (await fileExists(CACHE_PATH))) {
		return fs.readFile(CACHE_PATH, "utf8");
	}
	inFlight = saveFS(url)
		.catch(async (err) => {
			if (await fileExists(CACHE_PATH)) {
				return fs.readFile(CACHE_PATH, "utf8");
			}
			throw err;
		})
		.finally(() => {
			inFlight = null;
		});

	return inFlight;
}

function startTimer(url: string): void {
	if (timerStarted) return;
	timerStarted = true;
	setInterval(() => {
		console.log("Updating cache")
		void getCache(url).catch((err) => {
			console.error("Cache refresh failed", err);
		});
	}, RELOAD_TIME);
}

export async function cacher(url: string): Promise<string> {
	startTimer(url);
	return getCache(url);
}