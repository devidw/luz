import { lm } from "./lm.js"

export const emb = await lm.embedding.model(
    "text-embedding-nomic-embed-text-v1.5",
    {
        verbose: false,
    },
)
