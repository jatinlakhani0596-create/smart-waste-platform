import fs from "fs/promises";
import path from "path";
const DATA_DIR = path.resolve(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
export async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
    catch (e) {
        // ignore
    }
}
export async function loadState(seed) {
    await ensureDataDir();
    try {
        const content = await fs.readFile(STORE_PATH, "utf-8");
        const parsed = JSON.parse(content);
        return { ...seed, ...parsed };
    }
    catch (e) {
        // write seed to store
        await saveState(seed);
        return seed;
    }
}
export async function saveState(state) {
    await ensureDataDir();
    await fs.writeFile(STORE_PATH, JSON.stringify(state, null, 2), "utf-8");
}
