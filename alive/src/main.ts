/**
 * alive
 */

console.info("\n\ti think,\n\ttherefore i am\n")

import "./lib/env.js"
import {
    clear_dynamic_prompt_parts,
    setup_dynamic_prompt_parts,
} from "./lib/prompts.js"
import { reindex, mem_reindex_watch } from "./mem/reindex.js"

import { http_server } from "./server.js"
import { init_state } from "./state.js"

async function start() {
    await Promise.all([init_state(), reindex()])
    setup_dynamic_prompt_parts()
    mem_reindex_watch()
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
