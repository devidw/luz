import {
    get_mem_delete_tool,
    get_mem_upsert_tool,
    mem_sim_search_tool,
} from "src/tools/_tools.js"
import { llm } from "../lib/inference.js"
import { compile_prompt } from "src/lib/prompts.js"

/**
 * one thing we could do here to add one more step of high quality is have it propose the change first for review and then we give it a checklist to tick all boxes, then when all boxes tick, it triggers the actual operation, if not it has to change and propose changes, if it ticks al boxes it goes ahead, otherwise repeats the cycle
 */

const PROMPT = `
you are given some new information and it's your job to integrate it into our memory system

part or all of the information might already be covered in the memory system

use the memory similarity search tool to get an idea of what we have you can lookup relevant other memories that are similar to the information given

1. noop : if the information is already covered in full, we have nothing futher to do

2. op : if we learn something new about the user, we have to make sure to extend or update the memory system

2.1. exisitng : if only parts of it are covered and the docs that we have are a good place for the new info, we should expand on them on update them, rephrase the memory content as necessary to fit into the memory system

2.2. new : if there is no good place for the new info given, we should create new docs accordingly

---

## important

information should only ever exist in place, we don't want to have redundant copies fly around in different docs

always be thoughtful about how you mutate the memory system

---

## time

if you are certain about something being today, prefix with "{{today}}", like:

- {{today}} : <content>
- ...

the placeholder is replaced after you submit your content
so you just include it and don't have to worry about it

only include it if you are certain it's today tho

---

## ids

memory ids should be short identifies similar to file names, lowercase text only, underscores instead of whitespace, as short as possible, like 'supplements', 'preferences', 'social_life'
`.trim()

export async function mem_remember({
    input,
    is_dev,
}: {
    input: string
    is_dev?: boolean
}) {
    console.info({ remember: input })

    const out = await llm.act(
        {
            messages: [
                {
                    role: "system",
                    content: [
                        {
                            type: "text",
                            text: PROMPT,
                        },
                    ],
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "new memory input to process: " + input,
                        },
                    ],
                },
            ],
        },
        [
            mem_sim_search_tool,
            get_mem_upsert_tool({ is_dev: is_dev }),
            get_mem_delete_tool({ is_dev: is_dev }),
        ],
        {
            onPredictionFragment(fragment) {
                process.stdout.write(fragment.content)
            },
            onMessage(msg) {
                console.info(JSON.stringify(msg, null, 4))
            },
        },
    )

    console.info({ out })

    return out
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const out = await mem_remember({
        is_dev: true,
        input: `user likes black mirror`,
    })
    console.info(JSON.stringify(out, null, 4))
}
