import { Server } from "socket.io"
import express from "express"
import cors from "cors"
import { abort_msg_gen, msg_handler, regen_handler } from "./chat.js"
import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from "./socket.types.js"
import { CONFIG } from "./config.js"
import { app_router } from "./trpc.js"
import { createExpressMiddleware } from "@trpc/server/adapters/express"
import { createServer } from "http"
import { load_chat_history, STATE } from "./state.js"
import { STORE } from "./store.js"

const allowed_ips = new Set(CONFIG.ip_whitelist)

export const http_server = createServer()

const app = express()

app.use(
    cors({
        origin: "*",
    }),
)

app.use(
    "/trpc",
    createExpressMiddleware({
        router: app_router,
        createContext() {
            return {}
        },
    }),
)

http_server.on("request", app)

export const ws_server = new Server<ClientToServerEvents, ServerToClientEvents>(
    http_server,
    {
        maxHttpBufferSize: 10 * 1024 * 1024, // ~10 MiB
        cors: {
            origin: "*",
        },
        allowRequest: (req, callback) => {
            const client_ip = req.socket.remoteAddress

            if (!client_ip) {
                console.warn("Could not determine client IP")
                callback(null, false)
                return
            }

            if (allowed_ips.has(client_ip)) {
                callback(null, true)
            } else {
                console.warn(
                    `Rejected connection from unauthorized IP: ${client_ip}`,
                )
                callback(null, false)
            }
        },
    },
)

ws_server.on("connection", (socket) => {
    console.info(`+1 ${socket.handshake.address}`)

    socket.emit("chat_history", STATE.user_chat.messages)

    socket.on("disconnect", () => {
        console.info(`-1 ${socket.handshake.address}`)
    })

    socket.on("msg", msg_handler)
    socket.on("regen", regen_handler)

    socket.on("clear", () => {
        STORE.last_clear = new Date().toISOString()
        STATE.user_chat.messages = []
    })

    socket.on("abort", abort_msg_gen)
})
