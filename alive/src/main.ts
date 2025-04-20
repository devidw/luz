/**
 * alive
 */

console.info("\n\ti think,\n\ttherefore i am\n")

import "./lib/env.js"
import { mb_load_models } from "./lib/lm.js"
import {
    clear_dynamic_prompt_parts,
    setup_dynamic_prompt_parts,
} from "./lib/prompts.js"
import { mem_reindex_all, mem_watch_all } from "./mem/reindex.js"

import { http_server } from "./server.js"
import { init_state } from "./state.js"

async function start() {
    await mb_load_models()

    await Promise.all([init_state(), mem_reindex_all()])

    setup_dynamic_prompt_parts()

    mem_watch_all()
}

// function stop() {
//     clear_dynamic_prompt_parts()
// }

// process.on("SIGINT", stop)
// process.on("SIGTERM", stop)

await start()

http_server.listen(6900, () => {
    console.info(
        "server listening on http://localhost:6900 and ws://localhost:6900",
    )
})
