import fs from "node:fs"
import { format } from "date-fns"
import { get_weather } from "src/tools/weather.js"
import { get_calendar_events } from "src/tools/calendar.js"
import { CONFIG } from "src/config.js"
import { STATE } from "src/state.js"

type Prompt_Part = {
    func: () => Promise<string>
    cache?: {
        value?: string
        timeout?: NodeJS.Timeout
        frequency: number
    }
}

const PERSONA_PROMPTS: Record<string, string> = {
    general: "",
}

const raw_prompt = fs.readFileSync("../data/prompt.md").toString()

for (const persona of CONFIG.personas) {
    PERSONA_PROMPTS[persona.id] = fs
        .readFileSync(persona.prompt_path)
        .toString()
}

const PROMPT_PARTS: Record<string, Prompt_Part> = {
    date: {
        func: async () => format(new Date(), "EEEE, d. MMMM yy hh:mm a"),
    },
    persona: {
        func: async () => {
            return PERSONA_PROMPTS[STATE.user_chat.persona]
        },
    },
    weather: {
        func: () =>
            get_weather({
                latitude: 37.7749,
                longitude: -122.4194,
                date: new Date(),
            }),
        cache: {
            frequency: 1000 * 60 * 60, // hourly
        },
    },
    calendar: {
        func: () => get_calendar_events(new Date()),
        cache: {
            frequency: 1000 * 60 * 60, // hourly
        },
    },
}

export async function compile_prompt() {
    let out = raw_prompt

    for (const [key, part] of Object.entries(PROMPT_PARTS)) {
        let val: string | undefined = undefined

        if (part.cache) {
            val = part.cache.value
        } else {
            val = await part.func()
        }

        if (!val) {
            continue
        }

        out = out.replaceAll(`{{${key}}}`, val)
    }

    return out
}

export async function setup_dynamic_prompt_parts() {
    const initial_runs: Promise<void>[] = []

    for (const [key, part] of Object.entries(PROMPT_PARTS)) {
        if (!part.cache?.frequency) {
            continue
        }

        const refresh = async () => {
            const val = await part.func()

            part.cache!.value = val

            console.info({
                [key]: val,
            })
        }

        initial_runs.push(refresh())

        part.cache.timeout = setInterval(refresh, part.cache.frequency)
    }

    await Promise.all(initial_runs)
}

export function clear_dynamic_prompt_parts() {
    for (const [key, part] of Object.entries(PROMPT_PARTS)) {
        if (part.cache?.timeout) {
            clearInterval(part.cache.timeout)
            part.cache.timeout = undefined
        }
    }
}
