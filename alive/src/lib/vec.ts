import { ChromaClient } from "chromadb"

export const vec = new ChromaClient()

export const vec_msg = await vec.getOrCreateCollection({
    name: "msg",
})
