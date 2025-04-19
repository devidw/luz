import { db } from "./lib/db.js"
import type { Msg } from "@luz/db-client"
import { ws_server } from "./server.js"
import { STORE } from "./store.js"

type State = {
    user_chat: {
        persona: string
        messages: Msg[]
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
            created_at: {
                gt: STORE.last_clear,
            },
        },
        take: 10,
        orderBy: {
            created_at: "desc",
        },
    })

    messages.reverse()

    STATE.user_chat.messages = [...messages]

    ws_server.emit("chat_history", STATE.user_chat.messages)
}

export async function init_state() {
    await load_chat_history()
}
