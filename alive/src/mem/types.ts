import { z } from "zod"

export const vec_collection_id_schema = z.enum([
    "msg",
    "mem",
    "diary",
    "relations",
    "missions",
])

export type Vec_Collection_Id = z.output<typeof vec_collection_id_schema>

export type Mem = {
    id: string
    content: string
    collection_id: Vec_Collection_Id
}
