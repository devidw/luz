import { z } from "zod"
import fs from "node:fs"

const config_schema = z.object({
    ip_whitelist: z.array(z.string()).default([]),
})

const raw = fs.readFileSync("../data/config.json").toString()
const obj = JSON.parse(raw)

export const CONFIG = config_schema.parse(obj)
