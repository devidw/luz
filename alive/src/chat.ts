import { z } from "zod"
import { db } from "./lib/db.js"
import { Msg, Msg_Role } from "@luz/db-client"
import { infer } from "./lib/inference.js"
import { ws_server } from "./server.js"
import { STATE } from "./state.js"
import { emb } from "./lib/emb.js"
import { vec, vec_msg } from "./lib/vec.js"
import { randomUUID } from "crypto"
import { mem_remember } from "./mem/remember.js"

const msg_payload_schema = z.object({
    content: z.string().min(1),
})

export type Msg_Payload = z.output<typeof msg_payload_schema>

// Split on . ! or ? followed by whitespace or end of string
function split_into_sentence(input: string): string[] {
    return input.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0)
}

export async function msg_handler(payload: unknown) {
    try {
        const parsed = msg_payload_schema.parse(payload)

        if (parsed.content.startsWith("/remember")) {
            const input = parsed.content.replace("/remember", "").trim()
            await mem_remember({ input })
            return
        }

        const user_msg = {
            id: randomUUID(),
            created_at: new Date(),
            role: Msg_Role.User,
            content: parsed.content,
            persona: STATE.user_chat.persona,
        } satisfies Partial<Msg>

        STATE.user_chat.messages.push(user_msg)

        ws_server.emit("typing_status", "typing")

        const generator = infer({
            messages: STATE.user_chat.messages,
        })

        let full_content = ""
        let sentence = ""
        let is_thinking = false

        for await (const chunk of generator) {
            full_content += chunk
            sentence += chunk

            // Check for thinking tags
            if (chunk.includes("<think>") && !is_thinking) {
                is_thinking = true
                continue
            }

            if (chunk.includes("</think>") && is_thinking) {
                is_thinking = false
                continue
            }

            ws_server.emit("msg_chunk", {
                role: Msg_Role.Being,
                content: chunk,
                thinking: is_thinking,
            })

            // const parts = split_into_sentence(sentence)

            // if (parts.length > 1) {
            //     const fst = parts.shift()!

            //     sentence = parts[0]

            //     ws_server.emit("msg_chunk", {
            //         role: Msg_Role.Being,
            //         content: fst,
            //     })
            // }
        }

        ws_server.emit("typing_status", "idle")

        const being_msg = {
            id: randomUUID(),
            created_at: new Date(),
            role: Msg_Role.Being,
            content: full_content,
            persona: STATE.user_chat.persona,
        } satisfies Partial<Msg>

        STATE.user_chat.messages.push(being_msg)

        await db.msg.createMany({
            data: [user_msg, being_msg],
        })

        const embeddings = await emb.embed([
            user_msg.content,
            being_msg.content,
        ])

        await vec_msg.add({
            ids: [user_msg.id, being_msg.id],
            embeddings: embeddings.map((a) => a.embedding),
        })
    } catch (e) {
        console.error(e)
        ws_server.emit("error", e)
    }
}
