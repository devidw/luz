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

	let messages: Msg[] = [
		{
			role: "User" as const,
			content: "Hey there! Can you help me with something?"
		} as Msg,
		{
			role: "Being" as const,
			content:
				"Of course! I'm here to help. What would you like to know? I can assist you with various topics and questions you might have."
		} as Msg
	]
	let input = ""
	let socket: Socket<ServerToClientEvents, ClientToServerEvents>
	let current_streaming_msg: Pick<Msg, "role" | "content"> | null = null
	let is_typing = false

	onMount(() => {
		socket = io(`ws://${window.location.hostname}:6900`)

		socket.on("msg_chunk", (chunk: Pick<Msg, "role" | "content">) => {
			if (!current_streaming_msg) {
				current_streaming_msg = {
					role: chunk.role,
					content: chunk.content
				}
				messages = [...messages, current_streaming_msg as Msg]
			} else {
				current_streaming_msg.content += chunk.content
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

		messages = [...messages, { role: "User" as const, content: input } as Msg]
		current_streaming_msg = null

		socket.emit("msg", { content: input })
		input = ""
	}
</script>

<div class="h-screen flex flex-col">
	<Fullscreen />

	<div class="flex-1 overflow-y-auto space-y-3 mt3 max-w-3xl mx-auto max-w-xl w-full">
		{#each messages as msg}
			<Message {msg} />
		{/each}

		{#if is_typing}
			<Message msg={{ role: "Being", content: "" }} />
		{/if}
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
				class="flex-1 py-4 px-4 border-t border-x border-zinc-800 resize-none bg-transparent leading-180%"
				style="outline: none;"
			/>
		</form>
	</div>
</div>
