import { db } from "./lib/db.js"
import type { Msg } from "@luz/db-client"
import { ws_server } from "./server.js"
import { STORE } from "./store.js"
import { mission_control } from "./mission/mission.js"

class State {
    _can_go_on_missions: "on" | "off" = "off"
    user_chat: {
        messages: Msg[]
    } = {
        messages: [],
    }

    get can_go_on_missions() {
        return this._can_go_on_missions
    }

    set can_go_on_missions(value: "on" | "off") {
        this._can_go_on_missions = value
        mission_control()
    }
}

/**
 *
 */
export const STATE = new State()

export async function load_chat_history() {
    const messages = await db.msg.findMany({
        where: {
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
