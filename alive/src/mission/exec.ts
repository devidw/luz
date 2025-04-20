/**
 * persist in db if aborted before finished
 *
 * add dup check
 */

import { db } from "src/lib/db.js"
import { tool } from "@lmstudio/sdk"
import { llm } from "../lib/inference.js"
import { z } from "zod"
import {
    diary_sim_search_tool,
    mem_sim_search_tool,
    web_search_tool,
    web_visit_tool,
} from "src/tools/_tools.js"
import { abort_controller } from "./mission.js"
import { Mission } from "@luz/db-client"

const get_prompt = ({ mission }: { mission: Mission }) =>
    `
objective: ${mission.objective}

1. given the objective, define what the research result format should be:
    - is it a single answer to a question
    - is it a written piece
    - is it a list of ideas or items
    - ... what is it?
2. actively think about it and come up with high quality insights using first principe reasoning in a chain of shared thoughts
3. once you are happy with the collected information, compile it into a research result summary of the defined format in step 1, report it with the report tool
`.trim()

export async function mission_exec({
    is_dev,
    id,
}: {
    is_dev?: boolean
    id: string
}) {
    const mission = await db.mission.findFirst({
        where: {
            id: id,
        },
    })

    if (mission === null) {
        return
    }

    const done_tool = tool({
        name: "report",
        description: "report research and mark as completed",
        parameters: {
            content: z.string(),
        },
        async implementation(params) {
            console.info({ report: params })

            if (is_dev) {
                return "ok"
            }

            await db.mission.update({
                where: {
                    id: id,
                },
                data: {
                    status: "DONE",
                    state: params.content,
                },
            })

            return "ok"
        },
    })

    const out = await llm.act(
        {
            messages: [
                {
                    role: "system",
                    content: [
                        {
                            type: "text",
                            text: get_prompt({ mission }),
                        },
                    ],
                },
            ],
        },
        [
            done_tool,
            mem_sim_search_tool,
            // diary_sim_search_tool,
            // relations_sim_search_tool
            // web_search_tool,
            // web_visit_tool,
        ],
        {
            signal: abort_controller.signal,
            // onMessage: (msg) => {
            //     console.info(JSON.stringify(msg, null, 4))
            // },
            onPredictionFragment(fragment) {
                process.stdout.write(fragment.content)
            },
        },
    )

    console.info({ out })
}
