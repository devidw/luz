/**
 * alive
 */

import "./lib/env.js"
import {
    clear_dynamic_prompt_parts,
    setup_dynamic_prompt_parts,
} from "./lib/prompts.js"

console.info("i think, therefore i am")

import { http_server } from "./server.js"
import { init_state } from "./state.js"

async function start() {
    await init_state()
    setup_dynamic_prompt_parts()
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
