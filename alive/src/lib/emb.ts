import { EMBEDDING_MODEL_KEY, lm } from "./lm.js"

export const emb = await lm.embedding.model(EMBEDDING_MODEL_KEY)
