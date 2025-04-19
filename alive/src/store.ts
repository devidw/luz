import { z } from "zod"
import fs from "node:fs"

const store_schema = z.object({
    last_clear: z.coerce.date().optional(),
})

const STORE_PATH = "../data/store.json"
const raw = fs.readFileSync(STORE_PATH).toString()
const obj = JSON.parse(raw)

export const STORE = new Proxy<z.output<typeof store_schema>>(
    store_schema.parse(obj),
    {
        set(target: any, prop: string, value: any) {
            target[prop] = value
            fs.writeFileSync(STORE_PATH, JSON.stringify(target, null, 4))
            return true
        },
    },
)
