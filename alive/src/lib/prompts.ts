import fs from "node:fs"
import { format } from "date-fns"
import { get_weather } from "src/tools/weather.js"
import { get_calendar_events } from "src/tools/apple_calendar.js"
import { CONFIG } from "src/config.js"
import { STATE } from "src/state.js"
import { mem_recall } from "src/mem/recall.js"

type Prompt_Part = {
    func: () => Promise<string>
    cache?: {
        value?: string
        timeout?: NodeJS.Timeout
        frequency: number
    }
}

const RAW_PROMPT = fs.readFileSync("../data/prompt.md").toString()

const PERSONA_PROMPTS: Record<string, string> = {
    general: "",
}

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
    mems: {
        func: async () => {
            const user_msg = STATE.user_chat.messages.at(-1)

            if (!user_msg) {
                return ""
            }

            const mems = await mem_recall({
                input: user_msg.content,
            })

            return mems
                .map(({ item }) => {
                    return `**${item.id}**\n${item.content}`
                })
                .join("\n\n")
        },
    },
}

if (CONFIG.integrations.weather) {
    PROMPT_PARTS["weather"] = {
        func: async () => {
            if (!CONFIG.integrations.weather) {
                return ""
            }

            const processed = await get_weather({
                latitude: CONFIG.integrations.weather.latitude,
                longitude: CONFIG.integrations.weather.longitude,
                date: new Date(),
            })

            const summary = `The temperature will range from ${processed.min_temp}°C to ${processed.max_temp}°C with a ${processed.rain_prob}% chance of rain and ${processed.rain_total}mm of precipitation.`

            return summary
        },
        cache: {
            frequency: 1000 * 60 * 60, // hourly
        },
    }
}

if (CONFIG.integrations.apple_calendar) {
    PROMPT_PARTS["apple_calendar"] = {
        func: async () => {
            const events = await get_calendar_events(new Date())

            if (events.length === 0) {
                return "No events found for this date."
            }

            return events
                .map((event) => {
                    const start = format(event.start, "h:mm a")
                    const end = format(event.end, "h:mm a")
                    return `${event.summary} (${start}-${end})`
                })
                .join("\n")
        },
        cache: {
            frequency: 1000 * 60 * 60, // hourly
        },
    }
}

export async function compile_prompt(prompt?: string) {
    let out = prompt ?? RAW_PROMPT

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
