import { vec_msg } from "../src/lib/vec.js"
import { emb } from "../src/lib/emb.js"
import { db } from "../src/lib/db.js"

const { embedding } = await emb.embed("feminine")

const out = await vec_msg.query({
    queryEmbeddings: [embedding],
})

// console.info(JSON.stringify(out, null, 4))

const msgs = await db.msg.findMany({
    where: {
        id: {
            in: out.ids[0],
        },
    },
})

const merged = out.ids[0].map((a, i) => {
    const msg = msgs.find((b) => b.id === a)

    return {
        distance: out.distances ? out.distances[0][i] : null,
        content: msg?.content,
    }
})

console.info(JSON.stringify(merged, null, 4))
