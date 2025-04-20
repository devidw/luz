<script lang="ts">
	import { get_trpc } from "../trpc.js"
	import type { Vec_Collection_Id } from "../../../../alive/src/mem/types"

	let query = ""
	let results: any[] = []
	let selected_collection: Vec_Collection_Id | "meta_search" = "meta_search"

	async function handle_search() {
		if (!query.trim()) return
		results = await get_trpc().sim_search.query({ query, collection_id: selected_collection })
	}
</script>

<div class="p-4 max-w-2xl mx-auto">
	<div class="mb-6">
		<div class="flex gap-4 mb-4">
			<label class="flex items-center gap-2">
				<input type="radio" bind:group={selected_collection} value="meta_search" />
				Meta Search
			</label>
			<label class="flex items-center gap-2">
				<input type="radio" bind:group={selected_collection} value="msg" />
				Messages
			</label>
			<label class="flex items-center gap-2">
				<input type="radio" bind:group={selected_collection} value="mem" />
				Memories
			</label>
			<label class="flex items-center gap-2">
				<input type="radio" bind:group={selected_collection} value="diary" />
				Diary
			</label>
			<label class="flex items-center gap-2">
				<input type="radio" bind:group={selected_collection} value="relations" />
				Relations
			</label>
		</div>

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
