import { z } from "zod"
import { db } from "./lib/db.js"
import { Msg_Role } from "@luz/db-client"
import { infer } from "./lib/inference.js"
import { ws_server } from "./server.js"
import { STATE } from "./state.js"
import { emb } from "./lib/emb.js"
import { vec, vec_msg } from "./lib/vec.js"
import { randomUUID } from "crypto"

const msg_schema = z.object({
    content: z.string().min(1),
})

// Split on . ! or ? followed by whitespace or end of string
function split_into_sentence(input: string): string[] {
    return input.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0)
}

export async function msg_handler(payload: unknown) {
    const parsed = msg_schema.parse(payload)

    const user_msg = {
        id: randomUUID(),
        role: Msg_Role.User,
        content: parsed.content,
    }

    STATE.user_chat.messages.push(user_msg)

    ws_server.emit("typing_status", "typing")

    const generator = infer({
        messages: STATE.user_chat.messages,
    })

    let full_content = ""
    let sentence = ""

    for await (const chunk of generator) {
        full_content += chunk
        sentence += chunk

        const parts = split_into_sentence(sentence)

        if (parts.length > 1) {
            const fst = parts.shift()!

            sentence = parts[0]

            ws_server.emit("msg_chunk", {
                role: Msg_Role.Being,
                content: fst,
            })
        }
    }

    ws_server.emit("typing_status", "idle")

    const being_msg = {
        id: randomUUID(),
        role: Msg_Role.Being,
        content: full_content,
    }

    STATE.user_chat.messages.push(being_msg)

    await db.msg.createMany({
        data: [user_msg, being_msg],
    })

    const embeddings = await emb.embed([user_msg.content, being_msg.content])

    await vec_msg.add({
        ids: [user_msg.id, being_msg.id],
        embeddings: embeddings.map((a) => a.embedding),
    })
}
