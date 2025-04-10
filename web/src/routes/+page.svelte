<script lang="ts">
	import { onMount } from "svelte"
	import { io, type Socket } from "socket.io-client"
	import type { Msg } from "@luz/db-client"
	import type {
		ClientToServerEvents,
		ServerToClientEvents
	} from "../../../alive/src/socket.types.js"
	import autosize from "svelte-autosize"
	import Message from "./Message.svelte"
	import Fullscreen from "./Fullscreen.svelte"

	let messages: (Msg & { chunks: string[] })[] = []
	let input = ""
	let socket: Socket<ServerToClientEvents, ClientToServerEvents>
	let current_streaming_msg: (Msg & { chunks: string[] }) | null = null
	let is_typing = false
	let messages_container: HTMLDivElement | null = null
	let last_user_message: HTMLDivElement | null = null

	onMount(() => {
		socket = io(`ws://${window.location.hostname}:6900`)

		socket.on("msg_chunk", (chunk: Pick<Msg, "role" | "content">) => {
			if (!current_streaming_msg) {
				current_streaming_msg = {
					role: chunk.role,
					content: chunk.content,
					chunks: [chunk.content],
					id: "",
					created_at: new Date()
				}
				messages = [...messages, current_streaming_msg]
			} else {
				current_streaming_msg.content += chunk.content
				current_streaming_msg.chunks = [...current_streaming_msg.chunks, chunk.content]
				messages = messages
			}
		})

		socket.on("typing_status", (status) => {
			is_typing = status === "typing"
		})

		return () => {
			socket?.disconnect()
		}
	})

	function send_message() {
		if (!input.trim()) return
		const new_msg: Msg & { chunks: string[] } = {
			role: "User" as const,
			content: input,
			chunks: [input],
			id: "",
			created_at: new Date()
		}
		messages = [...messages, new_msg]
		current_streaming_msg = null
		socket.emit("msg", { content: input })
		input = ""

		// Scroll to bottom with offset after sending message
		if (messages_container) {
			const offset = 160
			messages_container.scrollTo({
				top: messages_container.scrollHeight - messages_container.clientHeight - offset,
				behavior: "smooth"
			})
		}
	}
</script>

<div class="h-screen flex flex-col">
	<Fullscreen />

	<div
		bind:this={messages_container}
		class="flex-1 overflow-y-auto space-y-3 mt3 max-w-3xl mx-auto max-w-xl w-full"
	>
		{#each messages as msg}
			<Message {msg} root={msg.role === "User" ? last_user_message : undefined} />
		{/each}

		{#if is_typing}
			<Message
				msg={{ role: "Being", content: "", chunks: [], id: "", created_at: new Date() }}
				root={undefined}
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
