import { vec_msg } from "./vec.js"
import { emb } from "./emb.js"
import { db } from "./db.js"
import { Msg } from "@luz/db-client"

export async function sim_search(query: string) {
    const { embedding } = await emb.embed(query)

    const out = await vec_msg.query({
        queryEmbeddings: [embedding],
    })

    if (!out.distances) {
        console.warn("got no distances for sim search")
        return []
    }

    const msgs = await db.msg.findMany({
        where: {
            id: {
                in: out.ids[0],
            },
        },
    })

    const merged: {
        distance: number
        msg: Msg
    }[] = []

    for (const [i, id] of out.ids[0].entries()) {
        const msg = msgs.find((b) => b.id === id)

        if (!msg) {
            console.warn(`couldn't find db msg for id ${id}`)
            continue
        }

        merged.push({
            distance: out.distances![0][i],
            msg,
        })
    }

    return merged
}
