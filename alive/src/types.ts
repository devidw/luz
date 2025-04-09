import type { Msg } from "@luz/db-client"

export type State = {
    user_chat: {
        messages: Pick<Msg, "role" | "content">[]
    }
}
