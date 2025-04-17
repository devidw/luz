import fs from "node:fs/promises"
import path from "node:path"
import { CONFIG } from "../config.js"
import { vec_mem } from "src/lib/vec.js"

export type Mem = {
    id: string
    content: string
}

await fs.mkdir(CONFIG.mem_dir, { recursive: true })

export async function mem_fs_get({ id }: { id: string }) {
    try {
        const file_path = path.join(CONFIG.mem_dir, `${id}.md`)
        const content = await fs.readFile(file_path, "utf-8")

        return {
            id,
            content,
        }
    } catch (e) {
        if (e instanceof Error && "code" in e && e.code === "ENOENT") {
            await vec_mem.delete({ ids: [id] })
            console.info(`del orphan mem ${id}`)
        } else {
            console.error(e)
        }

        return null
    }
}

export async function mem_fs_upsert({
    id,
    content,
}: {
    id: string
    content: string
}) {
    try {
        const file_path = path.join(CONFIG.mem_dir, `${id}.md`)
        await fs.writeFile(file_path, content, "utf-8")
    } catch (e) {
        console.error(e)
    }
}

export async function mem_fs_delete({ id }: { id: string }) {
    try {
        const file_path = path.join(CONFIG.mem_dir, `${id}.md`)
        await fs.unlink(file_path)
    } catch (e) {
        console.error(e)
    }
}
