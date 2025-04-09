<script lang="ts">
	import type { Msg, Msg_Role } from "@luz/db-client"

	export let msg: Pick<Msg, "role" | "content">
</script>

<div class="w-full flex">
	<div class="leading-180% px3 py2 rounded-lg {msg.role === 'User' ? 'ml-auto bg-[#2a1f2d]' : ''}">
		{#if msg.content}
			{msg.content}
		{:else}
			<span class="inline-flex gap-1">
				<span class="animate-bounce">•</span>
				<span class="animate-bounce" style="animation-delay: 0.2s">•</span>
				<span class="animate-bounce" style="animation-delay: 0.4s">•</span>
			</span>
		{/if}
	</div>
</div>
