import type { State } from "./types.js"
import { db } from "./lib/db.js"

/**
 *
 */
export const STATE: State = {
    user_chat: {
        messages: [],
    },
}

export async function init_state() {
    const messages = await db.msg.findMany({
        take: 10,
        orderBy: {
            created_at: "desc",
        },
        select: {
            role: true,
            content: true,
        },
    })

    STATE.user_chat.messages = messages
}
