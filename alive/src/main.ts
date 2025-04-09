/**
 * alive
 */

console.info("i think, therefore i am")

import { http_server } from "./server.js"
import { init_state } from "./state.js"

await init_state()

http_server.listen(6900, () => {
    console.info(
        "server listening on http://localhost:6900 and ws://localhost:6900",
    )
})
