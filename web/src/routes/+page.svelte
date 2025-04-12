<script lang="ts">
	import { onMount, tick } from "svelte"
	import { io, type Socket } from "socket.io-client"
	import type { Msg } from "@luz/db-client"
	import type {
		ClientToServerEvents,
		ServerToClientEvents
	} from "../../../alive/src/socket.types.js"
	import autosize from "svelte-autosize"
	import Message from "./Message.svelte"
	import Fullscreen from "./Fullscreen.svelte"
	import Persona from "./Persona.svelte"
	import { STATE } from "./state.svelte.js"
	import { trpc } from "./trpc.js"

	let messages = $state<(Msg & { chunks?: { content: string }[] })[]>([])
	let thinking_message = $state("")
	let input = $state("")
	let socket = $state<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
	let current_streaming_msg = $state<(Msg & { chunks: { content: string }[] }) | null>(null)
	let is_typing = $state(false)
	let messages_container = $state<HTMLDivElement | null>(null)
	let last_user_message = $state<HTMLDivElement | null>(null)

	function scroll_to_bottom() {
		if (messages_container) {
			const offset = 160
			messages_container.scrollTo({
				top: messages_container.scrollHeight - messages_container.clientHeight - offset,
				behavior: "smooth"
			})
		}
	}

	// onMount(async () => {
	// 	messages = await trpc.chat_history.query()
	// 	await tick()
	// 	scroll_to_bottom()
	// })

	onMount(() => {
		socket = io(`ws://${window.location.hostname}:6900`)

		socket.on("chat_history", async (payload) => {
			messages = payload
			await tick()
			scroll_to_bottom()
		})

		socket.on("msg_chunk", (chunk: Pick<Msg, "role" | "content"> & { thinking: boolean }) => {
			if (chunk.thinking) {
				thinking_message += chunk.content
				is_typing = true
			} else {
				if (!current_streaming_msg) {
					current_streaming_msg = {
						role: chunk.role,
						content: chunk.content,
						chunks: [{ content: chunk.content }],
						id: "",
						created_at: new Date(),
						persona: STATE.persona
					}
					messages = [...messages, current_streaming_msg]
				} else {
					current_streaming_msg.content += chunk.content
					current_streaming_msg.chunks = [
						...current_streaming_msg.chunks,
						{ content: chunk.content }
					]
					messages = messages
				}
			}
		})

		socket?.on("typing_status", (status) => {
			is_typing = status === "typing"
		})

		return () => {
			socket?.disconnect()
		}
	})

	function send_message() {
		if (!input.trim()) return
		const new_msg: Msg & { chunks: { content: string }[] } = {
			role: "User" as const,
			content: input,
			chunks: [{ content: input }],
			id: "",
			created_at: new Date(),
			persona: STATE.persona
		}

		messages = [...messages, new_msg]

		current_streaming_msg = null
		thinking_message = ""

		socket?.emit("msg", {
			content: input
		})

		input = ""

		scroll_to_bottom()
	}

	$effect(() => {
		socket?.emit("persona", STATE.persona)
	})
</script>

<div class="h-screen flex flex-col">
	<Fullscreen />

	<div class="text-center">
		<Persona />
	</div>

	<div
		bind:this={messages_container}
		class="flex-1 overflow-y-auto space-y-3 mt3 max-w-3xl mx-auto max-w-xl w-full"
	>
		{#each messages as msg}
			<Message {msg} root={msg.role === "User" ? last_user_message : undefined} />
		{/each}

		{#if is_typing}
			<span class="inline-flex gap-1">
				<span class="animate-bounce">•</span>
				<span class="animate-bounce" style="animation-delay: 0.2s">•</span>
				<span class="animate-bounce" style="animation-delay: 0.4s">•</span>
			</span>
		{/if}

		{#if thinking_message.length > 0}
			<Message
				msg={{
					role: "Being",
					content: thinking_message,
					chunks: [{ content: thinking_message }],
					id: "",
					created_at: new Date(),
					persona: STATE.persona
				}}
				root={undefined}
				is_thinking={true}
			/>
		{/if}

		<div class="h-screen"></div>
	</div>

	<div class="max-w-xl w-full mx-auto">
		<form on:submit|preventDefault={send_message} class="flex">
			<textarea
				use:autosize
				rows="1"
				bind:value={input}
				on:keydown={(e) => {
					if (e.key === "Enter" && !e.shiftKey) {
						e.preventDefault()
						send_message()
					}
				}}
				placeholder="Type a message..."
				class="flex-1 py-4 px-4 border-t border-x border-zinc-800 resize-none bg-transparent leading-175%"
				style="outline: none;"
			/>
		</form>
	</div>
</div>
