import { z } from "zod"
import { db } from "./db.js"
import { Msg_Role } from "@luz/db-client"
import { infer } from "./inference.js"
import { ws_server } from "./server.js"
import { STATE } from "./state.js"

const msg_schema = z.object({
    content: z.string().min(1),
})

export async function msg_handler(payload: unknown) {
    const parsed = msg_schema.parse(payload)

    const user_msg = {
        role: Msg_Role.User,
        content: parsed.content,
    }

    STATE.user_chat.messages.push(user_msg)

    ws_server.emit("typing_status", "typing")

    const generator = infer({
        messages: STATE.user_chat.messages,
    })

    let full_content = ""
    let first_chunk = true

    for await (const chunk of generator) {
        if (first_chunk) {
            ws_server.emit("typing_status", "idle")
            first_chunk = false
        }

        full_content += chunk

        ws_server.emit("msg_chunk", {
            role: Msg_Role.Being,
            content: chunk,
        })
    }

    const being_msg = {
        role: Msg_Role.Being,
        content: full_content,
    }

    STATE.user_chat.messages.push(being_msg)

    await db.msg.createMany({
        data: [user_msg, being_msg],
    })
}
