import { db } from "src/lib/db.js"
import { emb } from "src/lib/emb.js"
import { vec_mem } from "src/lib/vec.js"

function extract_links(content: string): string[] {
    const matches = content.match(/\[\[(.*?)\]\]/g)
    if (!matches) return []
    return matches.map((match) => match.slice(2, -2))
}

export async function mem_upsert({
    id,
    content,
}: {
    id: string
    content: string
}) {
    const links = extract_links(content)
    const { embedding } = await emb.embed(content)

    await db.$transaction(async (tx) => {
        await tx.mem.upsert({
            where: {
                id: id,
            },
            create: {
                id,
                content,
            },
            update: {
                id,
                content,
            },
        })

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

        await vec_mem.upsert({
            ids: [id],
            embeddings: [embedding],
        })
    })
}

export async function mem_delete(id: string) {
    await db.$transaction(async (tx) => {
        await tx.mem.delete({
            where: {
                id: id,
            },
        })

        await tx.link.deleteMany({
            where: {
                OR: [{ source: id }, { target: id }],
            },
        })

        await vec_mem.delete({
            ids: [id],
        })
    })
}
