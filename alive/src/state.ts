import { db } from "./lib/db.js"
import type { Msg } from "@luz/db-client"
import { ws_server } from "./server.js"

type State = {
    user_chat: {
        persona: string
        messages: Pick<Msg, "role" | "content">[]
    }
}

/**
 *
 */
export const STATE: State = {
    user_chat: {
        persona: "general",
        messages: [],
    },
}

export async function load_chat_history() {
    const messages = await db.msg.findMany({
        where: {
            persona: STATE.user_chat.persona,
        },
        take: 10,
        orderBy: {
            created_at: "desc",
        },
        select: {
            role: true,
            content: true,
        },
    })

    messages.reverse()

    STATE.user_chat.messages = [...messages]

    ws_server.emit("chat_history", STATE.user_chat.messages)
}

export async function init_state() {
    await load_chat_history()
}
