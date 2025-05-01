import { initTRPC } from "@trpc/server"
import { CONFIG } from "./config.js"
import { STATE } from "./state.js"
import { z } from "zod"
import { sim_search } from "./mem/sim_search.js"
import { db } from "./lib/db.js"
import { load_chat_history } from "./state.js"
import { vec_collection_id_schema } from "./mem/types.js"
import { mem_recall } from "./mem/recall.js"

const trpc = initTRPC.create()

export const app_router = trpc.router({
    chat_history: trpc.procedure.query(() => {
        return STATE.user_chat.messages
    }),

    delete_message: trpc.procedure
        .input(
            z.object({
                id: z.string(),
            }),
        )
        .mutation(async ({ input }) => {
            await db.msg.delete({
                where: {
                    id: input.id,
                },
            })
            await load_chat_history()
        }),

    sim_search: trpc.procedure
        .input(
            z.object({
                collection_id: vec_collection_id_schema.or(
                    z.literal("meta_search"),
                ),
                query: z.string().min(1),
            }),
        )
        .query(async ({ input }) => {
            if (input.collection_id === "meta_search") {
                return await mem_recall({
                    input: input.query,
                })
            }

            return await sim_search({
                collection_id: input.collection_id,
                query: input.query,
            })
        }),
})

export type App_Router = typeof app_router
