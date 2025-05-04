<script lang="ts">
	import type { Msg } from "@luz/db-client"
	import { get_trpc } from "./trpc.js"

	export let msg: Msg & { chunks: { content: string }[] }
	export let is_thinking = false
	export let root: HTMLDivElement | null | undefined

	async function delete_message() {
		await get_trpc().delete_message.mutate({ id: msg.id })
	}
</script>

<div bind:this={root} class="w-full flex flex-col">
	<div
		class="z-1 leading-175% px3 py2 rounded-lg whitespace-pre-wrap backdrop-blur-sm {msg.role ===
		'User'
			? 'ml-auto max-w-70% bg-[#2a1f2d]/80 italic'
			: 'bg-black/50'} {is_thinking ? 'text-stone-500' : ''}"
	>
		{#if msg.chunks?.length > 0}
			{#each msg.chunks as chunk}
				<span class="animate-fade-in">{chunk.content}</span>
			{/each}
		{:else}
			{msg.content}
		{/if}
	</div>
	<div class="flex gap-2 self-end mt-1">
		<button on:click={delete_message} class="text-xs text-stone-500 hover:text-stone-300">
			delete
		</button>
	</div>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.animate-fade-in {
		animation: fade-in 0.3s ease-in forwards;
	}
</style>
