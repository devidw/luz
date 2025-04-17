import { tool } from "@lmstudio/sdk"
import { llm } from "../lib/inference.js"
import { z } from "zod"
import { mem_remember } from "./remember.js"
import { compile_prompt } from "src/lib/prompts.js"

const PROMPT = `
it's {{date}}

you are given part of a conversation between a user and their companion

it's your job to identify any information about the user that is relevant to remember long term about them

these could be preferences, interests, relations, experiences, opinions, projects, dreams, and so on

you should process the entire input given to you and extract relevant pieces

rephrase them into a standalone conciese version from 3rd person and use the store tool to save them

if there is no information given that is of relevance for long term memory there is nothing further to do
`.trim()

export async function learn_passive({ input }: { input: string }) {
    console.info({ learn_passive: input })

    let inputs: string[] = []

    const store_tool = tool({
        name: "store",
        description: "store memory list",
        parameters: {
            memories: z.array(z.string()),
        },
        async implementation(params) {
            console.info({ store: params })

            inputs = params.memories
        },
    })

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
                            text: "input to process:\n\n" + input,
                        },
                    ],
                },
            ],
        },
        [store_tool],
        {
            onPredictionFragment(fragment) {
                process.stdout.write(fragment.content)
            },
        },
    )

    console.info({ out })

    for (const input of inputs) {
        await mem_remember({ input })
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await learn_passive({
        input: `user: nothing interesting happend today, but maybe i will watch black mirror later\nbeing: oh that's cool, tell me about which episodes you've seen so far\nuser: let's talk about the world\nuser: i don't like fat ppl\nbeeing: ok`,
    })
}
