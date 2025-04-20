import { z } from "zod"
import { db } from "./lib/db.js"
import { Msg, Msg_Role } from "@luz/db-client"
import { infer } from "./lib/inference.js"
import { ws_server } from "./server.js"
import { STATE } from "./state.js"
import { emb } from "./lib/emb.js"
import { vec, vec_msg } from "./mem/vec.js"
import { randomUUID } from "crypto"
import { mem_remember } from "./mem/remember.js"

let abort_controller = new AbortController()

const msg_payload_schema = z.object({
    content: z.string().min(1),
    pic: z.string().nullish(),
})

export type Msg_Payload = z.output<typeof msg_payload_schema>

// Split on . ! or ? followed by whitespace or end of string
function split_into_sentence(input: string): string[] {
    return input.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0)
}

async function generate_message_content(messages: Msg[]) {
    ws_server.emit("typing_status", "typing")

    const generator = infer({
        messages,
        abort_controller,
    })

    let full_content = ""
    let sentence = ""
    let is_thinking = false

    for await (const chunk of generator) {
        full_content += chunk
        sentence += chunk

        if (chunk.includes("<think>")) {
            is_thinking = true
            continue
        }

        if (chunk.includes("</think>")) {
            is_thinking = false
            continue
        }

        ws_server.emit("msg_chunk", {
            role: Msg_Role.Being,
            content: chunk,
            thinking: is_thinking,
        })
    }

    ws_server.emit("typing_status", "idle")
    return full_content
}

async function generate_message(messages: Msg[]) {
    const content = await generate_message_content(messages)

    const being_msg: Msg = {
        id: randomUUID(),
        created_at: new Date(),
        role: Msg_Role.Being,
        content,
        persona: STATE.user_chat.persona,
        flags: "",
    }

    STATE.user_chat.messages.push(being_msg)

    await db.msg.create({
        data: being_msg,
    })

    const embedding = await emb.embed([being_msg.content])
    await vec_msg.add({
        ids: [being_msg.id],
        embeddings: embedding.map((a) => a.embedding),
    })

    return being_msg
}

export async function msg_handler(payload: unknown) {
    try {
        const parsed = msg_payload_schema.parse(payload)

        if (parsed.content.startsWith("/remember")) {
            const input = parsed.content.replace("/remember", "").trim()
            await mem_remember({ input })
            return
        }

        const user_msg: Msg = {
            id: randomUUID(),
            created_at: new Date(),
            role: Msg_Role.User,
            content: parsed.content,
            persona: STATE.user_chat.persona,
            flags: "",
            img: parsed.pic ?? null,
        }

        STATE.user_chat.messages.push(user_msg)

        await db.msg.create({
            data: user_msg,
        })

        const user_embedding = await emb.embed([user_msg.content])
        await vec_msg.add({
            ids: [user_msg.id],
            embeddings: user_embedding.map((a) => a.embedding),
        })

        await generate_message(STATE.user_chat.messages)
    } catch (e) {
        console.error(e)
        ws_server.emit("error", e)
    }
}

export async function regen_handler() {
    try {
        const messages = STATE.user_chat.messages
        if (messages.length === 0) return

        const last_msg = messages[messages.length - 1]

        if (last_msg.role === Msg_Role.Being) {
            STATE.user_chat.messages.pop()

            await db.msg.delete({
                where: { id: last_msg.id },
            })

            await vec_msg.delete({
                ids: [last_msg.id],
            })
        }

        await generate_message(STATE.user_chat.messages)
    } catch (e) {
        console.error(e)
        ws_server.emit("error", e)
    }
}

export function abort_msg_gen() {
    abort_controller.abort()
    abort_controller = new AbortController()
}
