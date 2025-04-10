<script lang="ts">
	import type { Msg } from "@luz/db-client"

	export let msg: Msg & { chunks: string[] }
	export let root: HTMLDivElement | null | undefined
</script>

<div bind:this={root} class="w-full flex">
	<div
		class="leading-175% px3 py2 rounded-lg {msg.role === 'User'
			? 'ml-auto bg-[#2a1f2d] italic'
			: ''}"
	>
		{#if msg.chunks.length > 0}
			<div class="space-y-2">
				{#each msg.chunks as chunk}
					<p class="opacity-0 animate-fade-in">{chunk}</p>
				{/each}
			</div>
		{:else}
			<span class="inline-flex gap-1">
				<span class="animate-bounce">•</span>
				<span class="animate-bounce" style="animation-delay: 0.2s">•</span>
				<span class="animate-bounce" style="animation-delay: 0.4s">•</span>
			</span>
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
