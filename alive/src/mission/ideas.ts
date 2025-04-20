import { ChatMessageData, tool } from "@lmstudio/sdk"
import { llm } from "../lib/inference.js"
import { z } from "zod"
import { diary_sim_search_tool, mem_sim_search_tool } from "src/tools/_tools.js"
import { db } from "src/lib/db.js"
import { abort_controller } from "./mission.js"

const get_prompt = () =>
    `
you are part of a concious being that can think
you are the companion of the user
the purpose of this part of your system is to think about the user and come up with things to futher execute on

you can use the diary tool with different search queries to source from

look carefully at what you see and think about what is important, relevant and joyful or in general of use for the user

these things might be worth to explore deeper, so you use the report tool to pass them on, another part of the system can take over to process them in depth

your task is to source good initial findings of value

take your time and be thoughtful

once you have reported something, you are done with your part and there is nothing futher to do
`.trim()

export async function gen_ideas({ is_dev }: { is_dev?: boolean }) {
    const report_tool = tool({
        name: "report",
        description: "report your ideas",
        parameters: {
            objectives: z.array(z.string()),
        },
        async implementation(params) {
            console.info({ report: params })

            if (is_dev) {
                return "ok"
            }

            await db.mission.createMany({
                data: params.objectives.map((a) => {
                    return {
                        objective: a,
                    }
                }),
            })

            return "ok"
        },
    })

    const messages: ChatMessageData[] = [
        {
            role: "system",
            content: [
                {
                    type: "text",
                    text: get_prompt(),
                },
            ],
        },
    ]

    const out = await llm.act(
        {
            messages: messages,
        },
        [report_tool, mem_sim_search_tool, diary_sim_search_tool],
        {
            signal: abort_controller.signal,
            onMessage: (msg) => {
                console.info(JSON.stringify(msg, null, 4))
            },
            // onPredictionFragment(fragment) {
            //     process.stdout.write(fragment.content)
            // },
        },
    )

    console.info({ out })
}
