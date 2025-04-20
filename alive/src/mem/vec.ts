import { ChromaClient } from "chromadb"
import type { Vec_Collection_Id, Mem } from "./types.js"
import { emb } from "../lib/emb.js"
import { mem_fs_status } from "./fs_api.js"

export const vec = new ChromaClient()

export const vec_msg = await vec.getOrCreateCollection({
    name: "msg",
})

export const vec_mem = await vec.getOrCreateCollection({
    name: "mem",
})

export const vec_diary = await vec.getOrCreateCollection({
    name: "diary",
})

export const vec_relations = await vec.getOrCreateCollection({
    name: "relations",
})

export function get_vec_collection(id: Vec_Collection_Id) {
    switch (id) {
        case "msg":
            return vec_msg
        case "mem":
            return vec_mem
        case "diary":
            return vec_diary
        case "relations":
            return vec_relations
    }
}

export function can_edit(id: Vec_Collection_Id) {
    switch (id) {
        case "mem":
            return true
        default:
            return false
    }
}

export async function upsert_vec(mem: Mem) {
    const collection = get_vec_collection(mem.collection_id)

    const fs_status = await mem_fs_status({
        collection_id: mem.collection_id,
        id: mem.id,
    })

    if (!fs_status) {
        console.warn(`no status for ${mem.collection_id} ${mem.id}`)
        return
    }

    const { embedding } = await emb.embed(mem.content)
    // console.info({ emb_dims: embedding.length })

    await collection.upsert({
        ids: [mem.id],
        embeddings: [embedding],
        metadatas: [
            {
                atime: fs_status.atime.getTime(),
                mtime: fs_status.mtime.getTime(),
                ctime: fs_status.ctime.getTime(),
                birthtime: fs_status.birthtime.getTime(),
            },
        ],
    })
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const out = await vec_diary.count()
    console.info(JSON.stringify(out, null, 4))
}
