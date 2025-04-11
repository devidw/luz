import type { Msg } from "@luz/db-client"

export interface ServerToClientEvents {
    msg_chunk: (
        chunk: Pick<Msg, "role" | "content"> & { thinking: boolean },
    ) => void
    typing_status: (status: "typing" | "idle") => void
}

export interface ClientToServerEvents {
    msg: (msg: { content: string }) => void
}
