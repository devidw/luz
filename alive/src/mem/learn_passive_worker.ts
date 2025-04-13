import { db } from "src/lib/db.js"
import { learn_passive } from "./learn_passive.js"

export async function passive_learn_worker() {
    const msgs = await db.msg.findMany({
        orderBy: {
            created_at: "asc",
        },
        take: 10,
        where: {
            persona: "general",
            role: "User",
            NOT: {
                flags: {
                    contains: "|mem|",
                },
            },
        },
    })

    console.info({ learn_passive_worker: msgs.length })

    if (msgs.length === 0) {
        return
    }

    const input = msgs
        .map((msg) => {
            return `${msg.role}: ${msg.content}`
        })
        .join("\n")

    await learn_passive({ input })

    await Promise.all(
        msgs.map((msg) => {
            return db.msg.update({
                where: {
                    id: msg.id,
                },
                data: {
                    flags:
                        "|" +
                        [...new Set(...msg.flags.split("|")).add("mem")].join(
                            "|",
                        ) +
                        "|",
                },
            })
        }),
    )
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await passive_learn_worker()
}
