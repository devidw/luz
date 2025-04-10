import { llm, MODEL_NAME } from "../src/lib/inference.js"
import { sim_search } from "../src/lib/sim_search.js"
import { tool } from "@lmstudio/sdk"
import { z } from "zod"

const some_tool = tool({
    name: "find_relevant_messages",
    description: "perform vector similarity search on past messages",
    parameters: {
        query: z.string(),
    },
    implementation: async (params) => {
        const out = await sim_search(params.query)
        return out
    },
})

const out = await llm.act(
    {
        messages: [
            {
                role: "assistant",
                content: [
                    {
                        type: "text",
                        text: "i need to figure out what the user likes based on past messages",
                    },
                ],
            },
        ],
    },
    [some_tool],
    {
        // draftModel: MODEL_NAME,
        onMessage: (msg) => {
            console.info(JSON.stringify(msg, null, 4))
        },
    },
)

console.info(JSON.stringify(out, null, 4))
