<script lang="ts">
	import type { Msg } from "@luz/db-client"

	export let msg: Msg & { chunks: { content: string }[] }
	export let is_thinking = false
	export let root: HTMLDivElement | null | undefined
</script>

<div bind:this={root} class="w-full flex">
	<div
		class="leading-175% px3 py2 rounded-lg {msg.role === 'User'
			? 'ml-auto bg-[#2a1f2d] italic'
			: ''} {is_thinking ? 'text-stone-500' : ''}"
	>
		{#if msg.chunks?.length > 0}
			{#each msg.chunks as chunk}
				<span class="animate-fade-in whitespace-pre-wrap">{chunk.content}</span>
			{/each}
		{:else}
			{msg.content}
		{/if}
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
