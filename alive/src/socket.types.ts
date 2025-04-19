import type { Msg } from "@luz/db-client"
import { Msg_Payload } from "./chat.js"

export interface ServerToClientEvents {
    msg_chunk: (
        chunk: Pick<Msg, "role" | "content"> & { thinking: boolean },
    ) => void
    typing_status: (status: "typing" | "idle") => void
    chat_history: (payload: Msg[]) => void
    error: (payload: unknown) => void
}

export interface ClientToServerEvents {
    msg: (payload: Msg_Payload) => void
    regen: () => void
    persona: (payload: string) => void
    clear: () => void
}
