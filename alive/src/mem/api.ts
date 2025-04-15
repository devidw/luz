import { db } from "src/lib/db.js"
import { emb } from "src/lib/emb.js"
import { vec_mem } from "src/lib/vec.js"
import { mem_fs_delete, mem_fs_upsert } from "src/mem/fs_api.js"

function extract_links(content: string): string[] {
    const matches = content.match(/\[\[(.*?)\]\]/g)
    if (!matches) return []
    return matches.map((match) => match.slice(2, -2))
}

export async function upsert_links({
    id,
    content,
}: {
    id: string
    content: string
}) {
    const links = extract_links(content)
    await db.$transaction(async (tx) => {
        await tx.link.deleteMany({
            where: {
                source: id,
            },
        })

        await tx.link.createMany({
            data: links.map((target) => {
                return {
                    source: id,
                    target: target,
                }
            }),
        })
    })
}

export async function upsert_vec({
    id,
    content,
}: {
    id: string
    content: string
}) {
    const { embedding } = await emb.embed(content)
    await vec_mem.upsert({
        ids: [id],
        embeddings: [embedding],
    })
}

export async function mem_upsert(mem: { id: string; content: string }) {
    await mem_fs_upsert(mem)
    await upsert_vec(mem)
    await upsert_links(mem)
}

export async function mem_delete(id: string) {
    await mem_fs_delete({ id })

    await vec_mem.delete({
        ids: [id],
    })

    await db.link.deleteMany({
        where: {
            OR: [{ source: id }, { target: id }],
        },
    })
}
