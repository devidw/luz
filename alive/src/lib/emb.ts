import { CONFIG } from "src/config.js"
import { lm } from "./lm.js"

export const emb = await lm.embedding.model(CONFIG.embedding_model_key)
