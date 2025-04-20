/**
 * 1. if we have unfinished business, we take care of that
 * 2. if we have ideas in the pipeline, we execute on them
 * 3. otherwise we source some fresh ideas
 * -> loop <-
 */

import { db } from "../lib/db.js"
import { STATE } from "../state.js"
import { mission_exec } from "./exec.js"
import { gen_ideas } from "./ideas.js"

let activity: Promise<void> | null = null
export let abort_controller = new AbortController()

export async function mission_control() {
    switch (STATE.can_go_on_missions) {
        case "on": {
            if (activity !== null) {
                break
            }

            activity = run_activity()

            break
        }
        case "off": {
            if (activity === null) {
                break
            }

            abort_controller.abort()

            await activity

            activity = null
            abort_controller = new AbortController()

            break
        }
    }
}

async function run_activity() {
    if (!STATE.can_go_on_missions) {
        return
    }

    // #

    const last_wip_one = await db.mission.findFirst({
        orderBy: {
            updated_at: "desc",
        },
        where: {
            status: "WIP",
        },
        select: {
            id: true,
        },
    })

    if (last_wip_one !== null) {
        await mission_exec({
            id: last_wip_one.id,
        })
        await run_activity()
        return
    }

    // #

    const last_idea_one = await db.mission.findFirst({
        orderBy: {
            created_at: "desc",
        },
        where: {
            status: "IDEA",
        },
        select: {
            id: true,
        },
    })

    if (last_idea_one !== null) {
        await mission_exec({
            id: last_idea_one.id,
        })
        await run_activity()
        return
    }

    // #

    await gen_ideas({ is_dev: false })
    await run_activity()
}
