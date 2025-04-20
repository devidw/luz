import { get_vec_collection } from "./vec.js"
import { emb } from "../lib/emb.js"
import { db } from "../lib/db.js"
import { Msg } from "@luz/db-client"
import { mem_fs_get } from "src/mem/fs_api.js"
import { Mem, Vec_Collection_Id } from "./types.js"

export async function sim_search({
    query,
    collection_id,
    n,
}: {
    query: string
    collection_id: Vec_Collection_Id
    n?: number
}) {
    const { embedding } = await emb.embed(query)

    const vec_collection = get_vec_collection(collection_id)

    const out = await vec_collection.query({
        queryEmbeddings: [embedding],
        nResults: n ?? 5,
    })

    if (!out.distances) {
        console.warn("got no distances for sim search")
        return []
    }

    let items: Msg[] | Mem[] = []
    switch (collection_id) {
        case "msg":
            items = await db.msg.findMany({
                where: {
                    id: {
                        in: out.ids[0],
                    },
                },
            })
            break
        default:
            const all = await Promise.all(
                out.ids[0].map((id) => mem_fs_get({ collection_id, id })),
            )
            items = all.filter(Boolean) as Mem[]
            break
    }

    const merged: {
        distance: number
        item: Msg | Mem
    }[] = []

    for (const [i, id] of out.ids[0].entries()) {
        const item = items.find((mem) => mem.id === id)

        if (!item) {
            await vec_collection.delete({ ids: [id] })
            console.info(`del orphan ${collection_id} ${id}`)
            continue
        }

        merged.push({
            distance: out.distances![0][i],
            item,
        })
    }

    return merged
}
