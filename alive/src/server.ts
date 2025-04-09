import { Server } from "socket.io"
import { createServer as create_http_server } from "http"
import { msg_handler } from "./chat.js"
import type {
    ClientToServerEvents,
    ServerToClientEvents,
} from "./socket.types.js"
import { CONFIG } from "./config.js"

const allowed_ips = new Set(CONFIG.ip_whitelist)

export const http_server = create_http_server()

export const ws_server = new Server<ClientToServerEvents, ServerToClientEvents>(
    http_server,
    {
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

    socket.on("disconnect", () => {
        console.info(`-1 ${socket.handshake.address}`)
    })

    socket.on("msg", msg_handler)

    socket.on("typing_status", (status) => {
        socket.broadcast.emit("typing_status", status)
    })
})
