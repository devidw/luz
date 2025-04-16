import { tool } from "@lmstudio/sdk"
import { sim_search } from "./sim_search.js"
import { z } from "zod"
import { mem_upsert, mem_delete } from "../mem/api.js"
import { web_visit } from "./web_visit.js"
import { web_search } from "./web_search.js"

export const msg_sim_search_tool = tool({
    name: "find_relevant_messages",
    description: "find relevant messages via vector similarity search",
    parameters: {
        query: z.string(),
    },
    implementation: async (params) => {
        const out = await sim_search({
            query: params.query,
            collection: "msg",
        })
        return out
    },
})

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
            collection: "mem",
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

export const mem_upsert_tool = tool({
    name: "upsert_memory",
    description: "upsert memory",
    parameters: {
        id: z.string(),
        // .describe(
        //     "conciese lowercase text based id like for example 'supplements' or 'preferences'. use underscores instead of whitespaces",
        // )
        content: z.string(),
    },
    implementation: async (params) => {
        console.info({ upsert_memory: params })

        await mem_upsert({
            id: params.id,
            content: params.content,
        })
    },
})

export const mem_delete_tool = tool({
    name: "delete_memory",
    description: "delete memory",
    parameters: {
        id: z.string(),
    },
    implementation: async (params) => {
        console.info({ delete_memory: params })

        await mem_delete(params.id)
    },
})

export const web_search_tool = tool({
    name: "web_search",
    description: "search the web",
    parameters: {
        query: z.string(),
    },
    implementation: async (params) => {
        console.info({ web_search: params })
        const results = await web_search(params.query)
        console.info(results)
        return results
    },
})

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
