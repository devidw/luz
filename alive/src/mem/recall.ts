/**
 * this is the place to build in some better algo to prio by recency & frequency etc
 *
 * def want to have min sim
 * also account for recency (ctime)
 *
 * lets pull in more than we want to pick into the prompt
 * compute ranks and then only take the top_x
 */

import { sim_search } from "src/mem/sim_search.js"
import { Mem } from "./types.js"

const MIN_CLOSENESS = 1
const COUNT = 5

export async function mem_recall({ input }: { input: string }) {
    const docs = await Promise.all([
        sim_search({
            query: input,
            collection_id: "mem",
            n: COUNT,
        }),
        sim_search({
            query: input,
            collection_id: "relations",
            n: COUNT,
        }),
        sim_search({
            query: input,
            collection_id: "diary",
            n: COUNT,
        }),
    ])

    const outs = docs
        .flat()
        .filter((mem) => {
            if (mem.distance > MIN_CLOSENESS) {
                return false
            }

            if (mem.item.content.trim().length === 0) {
                return false
            }

            return true
        })
        .sort((a, b) => a.distance - b.distance)

    return outs.slice(0, COUNT) as { distance: number; item: Mem }[]
}
