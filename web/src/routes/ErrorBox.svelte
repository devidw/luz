<script lang="ts">
	export let error: string
</script>

<div class="fixed top-4 right-4 max-w-md">
	<div class="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200 shadow-lg">
		<div class="font-bold mb-2">Error</div>
		<div class="text-sm">{error}</div>
	</div>
</div>
