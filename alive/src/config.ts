import { z } from "zod"
import fs from "node:fs"

const config_schema = z.object({
    chat_model_key: z.string(),
    embedding_model_key: z.string(),
    tool_model_key: z.string(),
    chat_prompt_path: z.string(),
    mem_dirs: z.record(z.string(), z.string()),
    ip_whitelist: z.array(z.string()).default([]),
    integrations: z
        .object({
            apple_calendar: z.object({}),
            weather: z.object({
                latitude: z.number(),
                longitude: z.number(),
            }),
        })
        .partial()
        .default({}),
})

const raw = fs.readFileSync("../data/config.json").toString()
const obj = JSON.parse(raw)

export const CONFIG = config_schema.parse(obj)
