import { Msg, Msg_Role } from "@luz/db-client"
import fs from "node:fs"
import { lm } from "./lm.js"
import { compile_prompt } from "./prompts.js"
import { CONFIG } from "src/config.js"
import type { ChatMessageData } from "@lmstudio/sdk"

export const llm = await lm.llm.model(CONFIG.chat_model_key)

export async function* infer({
    messages,
    abort_controller,
}: {
    messages: Msg[]
    abort_controller: AbortController
}) {
    const sys_msg_content = await compile_prompt()

    const sys_msg = {
        role: "system" as const,
        content: [
            {
                type: "text" as const,
                text: sys_msg_content,
            },
        ],
    }

    const chat_messages: ChatMessageData[] = [
        sys_msg,
        ...(await Promise.all(
            messages.map(async (msg, index) => {
                const out: ChatMessageData = {
                    role: {
                        [Msg_Role.User]: "user" as const,
                        [Msg_Role.Being]: "assistant" as const,
                    }[msg.role],
                    content: [
                        {
                            type: "text" as const,
                            text: msg.content,
                        },
                    ],
                }

                if (msg.img && index + 1 === messages.length) {
                    const img = await lm.files.prepareImageBase64(
                        "photo",
                        msg.img,
                    )

                    // @ts-ignore
                    out.content.push(img)
                }

                return out
            }),
        )),
    ]

    fs.writeFileSync(
        "../data/debug/chat.json",
        JSON.stringify(chat_messages, null, 4),
    )

    const generator = llm.respond(
        {
            messages: chat_messages,
        },
        {
            temperature: 0.8,
            signal: abort_controller.signal,
        },
    )

    for await (const chunk of generator) {
        yield chunk.content
    }
}
