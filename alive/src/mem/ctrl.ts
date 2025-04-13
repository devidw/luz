import { mem_upsert } from "src/tools/mem.js"
import fs from "node:fs"
import path from "node:path"
import { db } from "src/lib/db.js"
import { vec_mem } from "src/lib/vec.js"

const PATH = "../data/mems"

export async function push_them() {
    await db.mem.deleteMany()
    await vec_mem.delete()

    const files = fs.readdirSync(PATH)

    for (const file of files) {
        const file_path = path.join(PATH, file)
        const content = fs.readFileSync(file_path, "utf-8")
        const id = path.basename(file, path.extname(file))

        console.info({ id })

        await mem_upsert({
            id,
            content,
        })
    }
}

export async function pull_them() {
    const mems = await db.mem.findMany()

    for (const mem of mems) {
        console.info({ id: mem.id })

        const file_path = path.join(PATH, `${mem.id}.md`)

        fs.writeFileSync(file_path, mem.content)
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const cmd = process.argv[2]

    console.info({ cmd })

    if (cmd === "pull") {
        await pull_them()
    } else if (cmd === "push") {
        await push_them()
    } else {
        console.error("Usage: node ctrl.js [pull|push]")
        process.exit(1)
    }
}
