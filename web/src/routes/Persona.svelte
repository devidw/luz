<script lang="ts">
	import { get_trpc } from "./trpc"
	import { onMount } from "svelte"
	import { STATE } from "./state.svelte.js"

	let personas: string[] = $state([])

	onMount(async () => {
		personas = await get_trpc().personas.query()
	})
</script>

<select bind:value={STATE.persona}>
	{#each personas as persona}
		<option value={persona}>{persona}</option>
	{/each}
</select>
