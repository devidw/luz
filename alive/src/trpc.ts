import { initTRPC } from "@trpc/server"
import { CONFIG } from "./config.js"
import { STATE } from "./state.js"
import { z } from "zod"
import { sim_search } from "./tools/sim_search.js"

const trpc = initTRPC.create()

export const app_router = trpc.router({
    personas: trpc.procedure.query(() => {
        return ["general", ...CONFIG.personas.map((a) => a.id)]
    }),

    chat_history: trpc.procedure.query(() => {
        return STATE.user_chat.messages
    }),

    sim_search: trpc.procedure
        .input(
            z.object({
                query: z.string().min(1),
            }),
        )
        .query(async ({ input }) => {
            const outs = await sim_search({
                collection: "mem",
                query: input.query,
            })
            return outs
        }),
})

export type App_Router = typeof app_router
