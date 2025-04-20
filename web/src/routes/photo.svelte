<script lang="ts">
	import { STATE } from "./state.svelte"

	const {
		onPhotoTaken = (data: string) => {
			console.info(data)
		}
	} = $props()

	let error_message = $state<string | null>(null)

	async function handleFileUpload(event: Event) {
		error_message = null
		const input = event.target as HTMLInputElement
		const file = input.files?.[0]

		if (!file) {
			error_message = "Please select an image file"
			return
		}

		if (!file.type.startsWith("image/")) {
			error_message = "Please select a valid image file"
			return
		}

		try {
			const reader = new FileReader()
			reader.onload = (e) => {
				const base64 = e.target?.result as string
				STATE.photo = base64
				onPhotoTaken(base64)
			}
			reader.readAsDataURL(file)
		} catch (err) {
			console.error("Error processing image:", err)
			error_message = "Error processing the image"
		}
	}

	function clearPhoto() {
		STATE.photo = null
		error_message = null
	}
</script>

<div class="flex flex-col items-center gap-4">
	<div class="flex gap-2">
		<label class="cursor-pointer bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded transition-colors">
			Upload Photo
			<input type="file" accept="image/*" on:change={handleFileUpload} class="hidden" />
		</label>

		{#if STATE.photo}
			<button
				on:click={clearPhoto}
				class="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded transition-colors"
			>
				Clear
			</button>
		{/if}
	</div>

	{#if error_message}
		<div class="text-red-500 text-sm">{error_message}</div>
	{/if}

	{#if STATE.photo}
		<img src={STATE.photo} alt="Preview" class="w-32 h-32 object-cover rounded" />
	{/if}
</div>
