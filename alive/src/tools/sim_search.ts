import { vec_msg, vec_mem } from "../lib/vec.js"
import { emb } from "../lib/emb.js"
import { db } from "../lib/db.js"
import { Msg } from "@luz/db-client"
import { mem_fs_get, type Mem } from "src/mem/fs_api.js"

export async function sim_search({
    query,
    collection,
}: {
    query: string
    collection: "msg" | "mem"
}) {
    const { embedding } = await emb.embed(query)

    const vec_collection = collection === "msg" ? vec_msg : vec_mem
    const out = await vec_collection.query({
        queryEmbeddings: [embedding],
        nResults: 5,
    })

    if (!out.distances) {
        console.warn("got no distances for sim search")
        return []
    }

    let items: Msg[] | Mem[] = []
    switch (collection) {
        case "msg":
            items = await db.msg.findMany({
                where: {
                    id: {
                        in: out.ids[0],
                    },
                },
            })
            break
        case "mem":
            const all = await Promise.all(
                out.ids[0].map((id) => mem_fs_get({ id })),
            )
            items = all.filter(Boolean) as Mem[]
            break
        default:
            throw new Error(`Invalid collection type: ${collection}`)
    }

    const merged: {
        distance: number
        item: Msg | Mem
    }[] = []

    for (const [i, id] of out.ids[0].entries()) {
        const item = items.find((mem) => mem.id === id)

        if (!item) {
            console.warn(`couldn't find db ${collection} for id ${id}`)
            continue
        }

        merged.push({
            distance: out.distances![0][i],
            item,
        })
    }

    return merged
}
