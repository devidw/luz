<script lang="ts">
	let is_fullscreen = false

	function toggle_fullscreen() {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen()
			is_fullscreen = true
		} else {
			document.exitFullscreen()
			is_fullscreen = false
		}
	}
</script>

<button
	on:click={toggle_fullscreen}
	class="absolute top-2 left-2 p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 lt-sm:hidden"
	title={is_fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
>
	{is_fullscreen ? "[-]" : "[+]"}
</button>
