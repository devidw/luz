import fs from "node:fs/promises"
import path from "node:path"
import { CONFIG } from "../config.js"

export type Mem = {
    id: string
    content: string
}

await fs.mkdir(CONFIG.mem_dir, { recursive: true })

export async function mem_fs_get(params: { id: string } | { path: string }) {
    try {
        const file_path =
            "id" in params
                ? path.join(CONFIG.mem_dir, `${params.id}.md`)
                : params.path

        const content = await fs.readFile(file_path, "utf-8")

        return {
            id: "id" in params ? params.id : path.basename(file_path, ".md"),
            content,
        }
    } catch (e) {
        console.error(e)
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
