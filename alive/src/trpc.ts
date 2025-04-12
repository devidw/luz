import { initTRPC } from "@trpc/server"
import { CONFIG } from "./config.js"
import { STATE } from "./state.js"

const trpc = initTRPC.create()

export const app_router = trpc.router({
    personas: trpc.procedure.query(() => {
        return ["general", ...CONFIG.personas.map((a) => a.id)]
    }),

    chat_history: trpc.procedure.query(() => {
        return STATE.user_chat.messages
    }),
})

export type App_Router = typeof app_router
