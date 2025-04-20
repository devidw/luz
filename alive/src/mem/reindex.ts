/**
 * somewwhere we have to store the last index time
 * then we find all files in the mem dir that have been created or updated after that
 * and we just re-embed them for now
 * this can be improved by per file basis timestamps going forward
 */

import fs from "node:fs/promises"
import { CONFIG } from "src/config.js"
import path from "node:path"
import { mem_fs_get } from "./fs_api.js"
import { get_vec_collection, upsert_vec } from "./vec.js"
import { Vec_Collection_Id } from "./types.js"

async function mem_index_vec({
    collection_id,
    id,
}: {
    collection_id: Vec_Collection_Id
    id: string
}) {
    const mem = await mem_fs_get({
        collection_id,
        id,
    })

    if (!mem) {
        return
    }

    await upsert_vec(mem)
}

async function mem_reindex_collection({
    collection_id,
}: {
    collection_id: Vec_Collection_Id
}) {
    const dir = CONFIG.mem_dirs[collection_id]

    let last_index: Date | null = null

    try {
        const contents = (await fs.readFile(dir + "/_state.txt")).toString()

        last_index = new Date(contents)
    } catch {}

    console.info({ last_index })

    const entries = await fs.readdir(dir, {
        recursive: true,
        withFileTypes: true,
    })

    const ids = entries
        .filter((f) => f.isFile() && f.name.endsWith(".md"))
        .map((a) => {
            const id = path.basename(a.name, path.extname(a.name))
            const full_path = `${a.parentPath}/${id}`.replace(dir + "/", "")
            return full_path
        })

    // console.info(ids)

    const ids_to_index: string[] = []

    for (const id of ids) {
        const stats = await fs.stat(path.join(dir, id + ".md"))
        if (!last_index || stats.ctime > last_index) {
            ids_to_index.push(id)
        }
    }

    console.info({ reindex: ids_to_index.length })

    if (ids_to_index.length === 0) {
        return
    }

    await Promise.all(
        ids_to_index.map(async (id) => {
            return mem_index_vec({
                collection_id,
                id,
            })
        }),
    )

    await fs.writeFile(dir + "/_state.txt", new Date().toISOString())
}

/**
 * for rename on macos i get "rename" but neither the new name nor an event for the new file
 * thus we just force reindex on "rename"
 */
async function mem_collection_watch({
    collection_id,
}: {
    collection_id: Vec_Collection_Id
}) {
    console.info(`${collection_id} watch start`)

    const collection = get_vec_collection(collection_id)

    const watcher = fs.watch(CONFIG.mem_dirs[collection_id], {
        recursive: true,
    })

    for await (const event of watcher) {
        if (!event.filename?.endsWith(".md")) {
            continue
        }

        const id = event.filename.replace(".md", "")

        console.info(`mem ${id} ${event.eventType}`)

        switch (event.eventType) {
            case "change": {
                await mem_index_vec({ collection_id, id })
                break
            }
            case "rename": {
                await collection.delete({ ids: [id] }) // id is the prev filename, now out of date
                await mem_reindex_collection({ collection_id })
                break
            }
        }
    }
}

export async function mem_reindex_all() {
    await mem_reindex_collection({ collection_id: "mem" })
    await mem_reindex_collection({ collection_id: "diary" })
    await mem_reindex_collection({ collection_id: "relations" })
}

export async function mem_watch_all() {
    mem_collection_watch({ collection_id: "mem" })
    mem_collection_watch({ collection_id: "diary" })
    mem_collection_watch({ collection_id: "relations" })
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await mem_reindex_all()
    // await reindex({ collection_id: "relations" })
    // await mem_collection_watch({ collection_id: "relations" })
}
