/**
 * higher level mem api
 *
 * executes operations across data stores like
 * - fs store
 * - vector db
 * - links
 */

import { db } from "src/lib/db.js"
import { get_vec_collection, upsert_vec } from "src/mem/vec.js"
import { mem_fs_delete, mem_fs_upsert } from "src/mem/fs_api.js"
import type { Mem, Vec_Collection_Id } from "./types.js"

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

export async function mem_upsert(mem: Mem) {
    await mem_fs_upsert(mem)
    await upsert_vec(mem)
    // await upsert_links(mem)
}

export async function mem_delete({
    collection_id,
    id,
}: {
    collection_id: Vec_Collection_Id
    id: string
}) {
    await mem_fs_delete({
        collection_id,
        id,
    })

    const colleciton = get_vec_collection(collection_id)

    await colleciton.delete({
        ids: [id],
    })

    // await db.link.deleteMany({
    //     where: {
    //         OR: [{ source: id }, { target: id }],
    //     },
    // })
}
