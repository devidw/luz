<script lang="ts">
	import { get_trpc } from "../trpc.js"

	let query = ""
	let results: any[] = []

	async function handle_search() {
		if (!query.trim()) return
		results = await get_trpc().sim_search.query({ query })
	}
</script>

<div class="p-4 max-w-2xl mx-auto">
	<div class="mb-6">
		<input
			type="text"
			bind:value={query}
			placeholder="Search memories... (press Enter)"
			class="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-blue-500 focus:outline-none"
			on:keydown={(e) => e.key === "Enter" && handle_search()}
		/>
	</div>

	{#if results.length > 0}
		<div class="bg-gray-800 rounded p-4">
			<pre class="text-gray-300 whitespace-pre-wrap text-xs">{JSON.stringify(
					results,
					null,
					4
				)}</pre>
		</div>
	{:else if query}
		<div class="text-gray-400">No results found</div>
	{/if}
</div>
