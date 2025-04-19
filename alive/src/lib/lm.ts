import { LMStudioClient } from "@lmstudio/sdk"

export const EMBEDDING_MODEL_KEY = "text-embedding-nomic-embed-text-v1.5"

// export const CHAT_MODEL_KEY = "mistral-small-3.1-24b-instruct-2503"
// export const CHAT_MODEL_KEY = "deepseek-r1-distill-llama-8b"
// export const CHAT_MODEL_KEY = "gemma-3-12b-it"
// export const CHAT_MODEL_KEY = "llama-3.2-1b-instruct"
// export const CHAT_MODEL_KEY = "llama-3.2-3b-instruct"
// export const CHAT_MODEL_KEY = "gemma-3-4b-it"
// export const CHAT_MODEL_KEY = "gemma-3-1b-it"
export const CHAT_MODEL_KEY = "sao10k-l3-8b-stheno-v3.2"

export const lm = new LMStudioClient()

async function mb_load_emb_model() {
    const loaded_list = await lm.embedding.listLoaded()

    const is_loaded = loaded_list.find(
        (a) => a.modelKey === EMBEDDING_MODEL_KEY,
    )

    if (!is_loaded) {
        await lm.embedding.load(EMBEDDING_MODEL_KEY)
    }
}

async function mb_load_chat_model() {
    const loaded_list = await lm.llm.listLoaded()

    // console.info(loaded_list)

    const is_loaded = loaded_list.find((a) => a.modelKey === CHAT_MODEL_KEY)

    if (!is_loaded) {
        await lm.llm.load(CHAT_MODEL_KEY)
    }
}

export async function mb_load_models() {
    await Promise.all([mb_load_emb_model(), mb_load_chat_model()])
}
