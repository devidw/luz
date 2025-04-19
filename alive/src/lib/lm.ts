import { LMStudioClient } from "@lmstudio/sdk"
import { CONFIG } from "../config.js"

export const lm = new LMStudioClient()

async function mb_load_emb_model() {
    const loaded_list = await lm.embedding.listLoaded()

    const is_loaded = loaded_list.find(
        (a) => a.modelKey === CONFIG.embedding_model_key,
    )

    if (!is_loaded) {
        await lm.embedding.load(CONFIG.embedding_model_key)
    }
}

async function mb_load_chat_model() {
    const loaded_list = await lm.llm.listLoaded()

    // console.info(loaded_list)

    const is_loaded = loaded_list.find(
        (a) => a.modelKey === CONFIG.chat_model_key,
    )

    if (!is_loaded) {
        await lm.llm.load(CONFIG.chat_model_key)
    }
}

export async function mb_load_models() {
    await Promise.all([mb_load_emb_model(), mb_load_chat_model()])
}
