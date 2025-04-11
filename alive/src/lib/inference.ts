import { Msg, Msg_Role } from "@luz/db-client"
import fs from "node:fs"
import { lm } from "./lm.js"
import { format } from "date-fns"

// export const MODEL_NAME = "deepseek-r1-distill-llama-8b"
export const MODEL_NAME = "mistral-small-3.1-24b-instruct-2503"

export const llm = await lm.llm.model(MODEL_NAME, {
    verbose: false,
})

const raw_prompt = fs.readFileSync("../data/prompt.md").toString()

function compile_prompt() {
    return raw_prompt.replaceAll(
        "{{date}}",
        format(new Date(), "EEEE, d. MMMM yy hh:mm a"),
    )
}

export async function* infer({
    messages,
}: {
    messages: Pick<Msg, "role" | "content">[]
}) {
    const sys_msg = compile_prompt()

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

    fs.writeFileSync(
        "../data/chat.debug.json",
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
