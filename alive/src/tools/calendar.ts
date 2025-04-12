import { format, isSameDay } from "date-fns"
import ical, { VEvent } from "node-ical"
import * as dav from "dav"
import "../lib/env.js"
import fs from "node:fs"

export async function get_calendar_events(date: Date) {
    const app_pw = process.env.APPLE_APP_PW
    const apple_id = process.env.APPLE_ID

    if (!app_pw || !apple_id) {
        throw new Error("Missing APPLE_APP_PW or APPLE_ID in env")
    }

    const xhr = new dav.transport.Basic(
        new dav.Credentials({
            username: apple_id,
            password: app_pw,
        }),
    )

    const account = await dav.createAccount({
        server: "https://caldav.icloud.com",
        xhr,
        loadCollections: true,
        loadObjects: false,
    })

    if (!account.calendars || account.calendars.length === 0) {
        return "No calendars found."
    }

    const all_events: Pick<VEvent, "summary" | "start" | "end">[] = []

    for (const calendar of account.calendars) {
        const updated = await dav.syncCalendar(calendar, { xhr })

        for (const object of updated.objects || []) {
            // @ts-expect-error
            const str = object.data?.props?.calendarData

            if (
                !str ||
                typeof str !== "string" ||
                !str.includes("BEGIN:VEVENT")
            )
                continue

            try {
                const parsed = ical.parseICS(str)

                for (const event of Object.values(parsed)) {
                    if (event.type !== "VEVENT") continue

                    all_events.push({
                        summary: event.summary,
                        start: event.start,
                        end: event.end,
                    })
                }
            } catch (err) {
                console.warn("Failed to parse calendar object:", err)
                continue
            }
        }
    }

    fs.writeFileSync("../data/cal.json", JSON.stringify(all_events, null, 4))

    const today_events = all_events
        .filter((event) => isSameDay(date, new Date(event.start)))
        .sort(
            (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
        )
        .map((event) => ({
            ...event,
            start: format(new Date(event.start), "h:mm a"),
            end: format(new Date(event.end), "h:mm a"),
        }))

    if (today_events.length === 0) {
        return "No events found for this date."
    }

    return today_events
        .map((event) => `${event.summary} (${event.start}-${event.end})`)
        .join("\n")
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const out = await get_calendar_events(new Date())
    console.log(out)
}
