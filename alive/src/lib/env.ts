import { config } from "dotenv"

const env_path = new URL("../../../.env", import.meta.url).pathname
console.info({ env_path })

config({
    path: env_path,
})
