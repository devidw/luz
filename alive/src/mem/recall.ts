import { sim_search } from "src/tools/sim_search.js"

/**
 * this is the place to build in some better algo to prio by recency & frequency etc
 */
export async function mem_recall({ input }: { input: string }) {
    const mems = await sim_search({
        query: input,
        collection: "mem",
    })

    const outs = mems.filter((mem) => mem.item.content.trim().length > 0)

    return outs
}
