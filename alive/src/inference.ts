import { LMStudioClient } from "@lmstudio/sdk"
import { Msg, Msg_Role } from "@luz/db-client"
import fs from "node:fs"

const sys_prompt = fs.readFileSync("../data/prompt.md").toString()

const client = new LMStudioClient()

const model = await client.llm.model("mistral-small-3.1-24b-instruct-2503")

export async function* infer({
    messages,
}: {
    messages: Pick<Msg, "role" | "content">[]
}) {
    const chat_messages = [
        {
            role: "system" as const,
            content: [
                {
                    type: "text" as const,
                    text: sys_prompt,
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

    const generator = model.respond(
        {
            messages: chat_messages,
        },
        {
            maxTokens: 100,
            temperature: 1,
        },
    )

    for await (const chunk of generator) {
        yield chunk.content
    }
}
