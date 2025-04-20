import { tool } from "@lmstudio/sdk"
import { sim_search } from "../mem/sim_search.js"
import { z } from "zod"
import { mem_upsert, mem_delete } from "../mem/api.js"
import { web_visit } from "./web_visit.js"
import { web_search } from "./web_search.js"
import { format } from "date-fns"
import { vec_collection_id_schema } from "src/mem/types.js"

export const mem_sim_search_tool = tool({
    name: "find_relevant_memories",
    description: "find relevant memories via vector similarity search",
    parameters: {
        query: z.string(),
    },
    implementation: async (params) => {
        console.info({ find_relevant_memories: params })

        const out = await sim_search({
            query: params.query,
            collection_id: "mem",
        })

        const processed = out.map((one) => {
            return {
                id: one.item.id,
                content: one.item.content,
            }
        })

        console.info(JSON.stringify(processed, null, 4))

        return out
    },
})

export function get_mem_upsert_tool({ is_dev }: { is_dev?: boolean }) {
    return tool({
        name: "upsert_memory",
        description: "upsert memory",
        parameters: {
            collection_id: vec_collection_id_schema,
            id: z.string(),
            // .describe(
            //     "conciese lowercase text based id like for example 'supplements' or 'preferences'. use underscores instead of whitespaces",
            // )
            content: z.string(),
        },
        implementation: async (params) => {
            console.info({ upsert_memory: params })

            if (is_dev) {
                return
            }

            const content = params.content.replaceAll(
                "{{today}}",
                format(new Date(), "yyyy-MM-dd"),
            )

            await mem_upsert({
                collection_id: params.collection_id,
                id: params.id,
                content: content,
            })
        },
    })
}

export function get_mem_delete_tool({ is_dev }: { is_dev?: boolean }) {
    return tool({
        name: "delete_memory",
        description: "delete memory",
        parameters: {
            collection_id: vec_collection_id_schema,
            id: z.string(),
        },
        implementation: async (params) => {
            console.info({ delete_memory: params })

            if (is_dev) {
                return
            }

            await mem_delete({
                collection_id: params.collection_id,
                id: params.id,
            })
        },
    })
}

export const web_visit_tool = tool({
    name: "web_visit",
    description: "visit a webpage",
    parameters: {
        url: z.string(),
    },
    implementation: async (params) => {
        console.info({ web_visit: params })
        const content = await web_visit(params)
        return content
    },
})
