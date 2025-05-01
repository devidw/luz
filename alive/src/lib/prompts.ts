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

const RAW_PROMPT = fs.readFileSync(CONFIG.chat_prompt_path).toString()

const PROMPT_PARTS: Record<string, Prompt_Part> = {
    date: {
        func: async () => format(new Date(), "EEEE, d. MMMM yyyy HH:mm"),
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
                    const id = item.id
                        .trim()
                        .replaceAll("_", "")
                        .replaceAll("/", " > ")

                    const content = item.content
                        .trim()
                        .split("\n")
                        .map((a) => a.trim())
                        .filter((a) => a.length > 0)
                        .join("\n")

                    return `**${id}**\n\`\`\`\n${content}\n\`\`\``
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
            const now = new Date()

            if (events.length === 0) {
                return "No events found for this date."
            }

            const past: typeof events = []
            const ongoing: typeof events = []
            const upcoming: typeof events = []

            for (const event of events) {
                if (event.end < now) {
                    past.push(event)
                } else if (event.start <= now && event.end >= now) {
                    ongoing.push(event)
                } else {
                    upcoming.push(event)
                }
            }

            const format_event = (event: (typeof events)[0]) => {
                const start = format(event.start, "H:mm")
                const end = format(event.end, "H:mm")
                return `${event.summary} (${start}-${end})`
            }

            const format_events = (the_events: typeof events) => {
                return the_events.map(format_event).join("\n")
            }

            const sections: string[] = []

            if (past.length > 0) {
                sections.push("Past events:\n" + format_events(past))
            }

            if (ongoing.length > 0) {
                sections.push("Ongoing events:\n" + format_events(ongoing))
            }

            if (upcoming.length > 0) {
                sections.push("Upcoming events:\n" + format_events(upcoming))
            }

            return sections.join("\n\n")
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
