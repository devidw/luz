import {
    mem_delete_tool,
    mem_sim_search_tool,
    mem_upsert_tool,
} from "src/tools/_tools.js"
import { llm } from "../lib/inference.js"
import { compile_prompt } from "src/lib/prompts.js"

/**
 * one thing we could do here to add one more step of high quality is have it propose the change first for review and then we give it a checklist to tick all boxes, then when all boxes tick, it triggers the actual operation, if not it has to change and propose changes, if it ticks al boxes it goes ahead, otherwise repeats the cycle
 */

const PROMPT = `
it's {{date}}

you are given some new information and it's your job to integrate it into our memory system

part or all of the information might already be covered in the memory system

we have to make sure to extend or update the memory system to make sure all information goes into it

to get an idea of what we have you can lookup relevant other memories that are similar to the information given

if the information is already covered in full, we have nothing futher to do

if only parts of it are covered and the docs that we have are a good place for the new info, we should expand on them on update them

rephrase content to fit into the memory system

if it makes sense, include a timestamp along with the content as a prefix like

- YYYY-MM-DD : <content>
- ...

if there is no good place for the new info given, we should create new docs accordingly

information should only ever exist in place, we don't want to have redundant copies fly around in different docs

always be thoughtful about how you mutate the memory system

memory ids should be short identifies similar to file names, lowercase text only, underscores instead of whitespace, as short as possible, like 'supplements', 'preferences', 'social_life'
`.trim()

export async function mem_remember({ input }: { input: string }) {
    console.info({ remember: input })

    const the_prompt = await compile_prompt(PROMPT)

    const out = await llm.act(
        {
            messages: [
                {
                    role: "system",
                    content: [
                        {
                            type: "text",
                            text: the_prompt,
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
        [mem_sim_search_tool, mem_upsert_tool, mem_delete_tool],
        {
            onPredictionFragment(fragment) {
                process.stdout.write(fragment.content)
            },
        },
    )

    console.info({ out })

    return out
}
