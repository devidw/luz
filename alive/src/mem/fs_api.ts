import fs from "node:fs/promises"
import path from "node:path"
import { CONFIG } from "../config.js"
import { can_edit, get_vec_collection } from "./vec.js"
import { Mem, Vec_Collection_Id } from "./types.js"

export async function mem_fs_get({
    collection_id,
    id,
}: {
    collection_id: Vec_Collection_Id
    id: string
}) {
    try {
        const file_path = path.join(CONFIG.mem_dirs[collection_id], `${id}.md`)
        const content = await fs.readFile(file_path, "utf-8")

        return {
            id,
            content,
            collection_id,
        }
    } catch (e) {
        if (e instanceof Error && "code" in e && e.code === "ENOENT") {
            const collection = get_vec_collection(collection_id)
            await collection.delete({ ids: [id] })
            console.info(`del orphan ${collection_id} ${id}`)
        } else {
            console.error(e)
        }

        return null
    }
}

export async function mem_fs_upsert(mem: Mem) {
    if (!can_edit(mem.collection_id)) {
        throw new Error(`can not edit ${mem.collection_id}`)
    }

    try {
        const file_path = path.join(
            CONFIG.mem_dirs[mem.collection_id],
            `${mem.id}.md`,
        )
        await fs.writeFile(file_path, mem.content, "utf-8")
    } catch (e) {
        console.error(e)
    }
}

export async function mem_fs_delete({
    collection_id,
    id,
}: {
    collection_id: Vec_Collection_Id
    id: string
}) {
    if (!can_edit(collection_id)) {
        throw new Error(`can not edit ${collection_id}`)
    }

    try {
        const file_path = path.join(CONFIG.mem_dirs[collection_id], `${id}.md`)
        await fs.unlink(file_path)
    } catch (e) {
        console.error(e)
    }
}
