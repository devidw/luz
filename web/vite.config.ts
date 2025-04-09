import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"
import unocss from "unocss/vite"
import unocss_preset from "unocss/preset-wind4"

export default defineConfig({
	plugins: [
		sveltekit(),
		unocss({
			presets: [unocss_preset()]
		})
	]
})
