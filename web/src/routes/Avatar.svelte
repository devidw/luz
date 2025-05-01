<script lang="ts">
	import { browser } from "$app/environment"
	import { onMount } from "svelte"

	onMount(async () => {
		if (!browser) {
			return
		}

		await import("@google/model-viewer")
	})
</script>

<model-viewer
	src="/avatar.glb"
	alt=""
	auto-rotate
	camera-controls
	shadow-intensity="1"
	interaction-prompt="none"
></model-viewer>

<style>
	model-viewer {
		background-color: transparent;
		overflow: hidden;
	}
</style>
