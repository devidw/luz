import { Msg, Msg_Role } from "@luz/db-client"
import fs from "node:fs"
import { lm } from "./lm.js"
import { compile_prompt } from "./prompts.js"
import { CONFIG } from "src/config.js"

export const llm = await lm.llm.model(CONFIG.chat_model_key)

export async function* infer({
    messages,
}: {
    messages: Pick<Msg, "role" | "content">[]
}) {
    const sys_msg = await compile_prompt()

    const chat_messages = [
        {
            role: "system" as const,
            content: [
                {
                    type: "text" as const,
                    text: sys_msg,
                },
            ],
        },
        ...messages.map((msg) => ({
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
        })),
    ]

    fs.writeFileSync("../data/debug/sys_msg.md", sys_msg)

    fs.writeFileSync(
        "../data/debug/chat.json",
        JSON.stringify(chat_messages, null, 4),
    )

    const generator = llm.respond(
        {
            messages: chat_messages,
        },
        {
            // maxTokens: 100,
            temperature: 1,
        },
    )

    for await (const chunk of generator) {
        yield chunk.content
    }
}
