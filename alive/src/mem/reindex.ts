/**
 * somewwhere we have to store the last index time
 * then we find all files in the mem dir that have been created or updated after that
 * and we just re-embed them for now
 * this can be improved by per file basis timestamps going forward
 */

import fs from "node:fs/promises"
import { CONFIG } from "src/config.js"
import path from "node:path"
import { upsert_links, upsert_vec } from "./api.js"
import { mem_fs_get } from "./fs_api.js"

async function mem_index(id: string) {
    const mem = await mem_fs_get({ id: id })

    if (!mem) {
        return []
    }

    return [() => upsert_vec(mem), () => upsert_links(mem)]
}

export async function reindex() {
    let last_index: Date | null = null

    try {
        const contents = (
            await fs.readFile(CONFIG.mem_dir + "/_state.txt")
        ).toString()

        last_index = new Date(contents)
    } catch {}

    console.info({ last_index })

    const files = await fs.readdir(CONFIG.mem_dir)
    const ids = files
        .filter((f) => f.endsWith(".md"))
        .map((a) => path.basename(a, path.extname(a)))

    const ids_to_index: string[] = []
    for (const id of ids) {
        const stats = await fs.stat(path.join(CONFIG.mem_dir, id + ".md"))
        if (!last_index || stats.mtime > last_index) {
            ids_to_index.push(id)
        }
    }

    const jobs = await Promise.all(
        ids_to_index.map(async (id) => {
            console.info(`mem reindex ${id}`)
            return mem_index(id)
        }),
    )

    for (const job of jobs.flat()) {
        await job()
    }

    await fs.writeFile(CONFIG.mem_dir + "/_state.txt", new Date().toISOString())
}

export async function mem_reindex_watch() {
    console.info(`mem watch start`)

    const watcher = fs.watch(CONFIG.mem_dir, { recursive: true })

    for await (const event of watcher) {
        if (!event.filename?.endsWith(".md")) {
            continue
        }

        const id = event.filename.replace(".md", "")

        console.info(`mem reindex ${id}`)

        const jobs = await mem_index(id)
        await Promise.all(jobs)
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await reindex()
}
