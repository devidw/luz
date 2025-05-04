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
	import ErrorBox from "./ErrorBox.svelte"
	import { STATE } from "./state.svelte.js"
	import Photo from "./photo.svelte"
	import Avatar from "./Avatar.svelte"

	let messages = $state<(Msg & { chunks?: { content: string }[] })[]>([])
	let thinking_message = $state("")
	let input = $state("")
	let socket = $state<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null)
	let current_streaming_msg = $state<(Msg & { chunks: { content: string }[] }) | null>(null)
	let is_typing = $state(false)
	let messages_container = $state<HTMLDivElement | null>(null)
	let last_user_message = $state<HTMLDivElement | null>(null)
	let error = $state<string | null>(null)
	let is_generating_tts = $state(false)
	let auto_tts = $state(false)

	async function play_tts(text: string) {
		if (is_generating_tts) return

		is_generating_tts = true
		try {
			const response = await fetch("http://127.0.0.1:8000/tts", {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					text,
					speed: 0.8
				})
			})

			if (!response.ok) throw new Error("TTS request failed")

			const blob = await response.blob()
			const audio = new Audio(URL.createObjectURL(blob))
			await audio.play()
		} catch (error) {
			console.error("TTS error:", error)
		} finally {
			is_generating_tts = false
		}
	}

	function scroll_to_bottom() {
		if (messages_container) {
			messages_container.scrollTop = messages_container.scrollHeight
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

		socket.on(
			"msg_chunk",
			(chunk: Pick<Msg, "role" | "content"> & { thinking?: boolean; is_end?: boolean }) => {
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
							flags: ""
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

					// If this is the end chunk and auto-TTS is enabled, trigger TTS
					if (chunk.is_end && current_streaming_msg?.role === "Being" && auto_tts) {
						play_tts(current_streaming_msg.content)
					}
				}
			}
		)

		socket?.on("typing_status", async (status) => {
			is_typing = status === "typing"
			await tick()
			scroll_to_bottom()
		})

		socket?.on("error", (err: unknown) => {
			error = String(err)
			setTimeout(() => {
				error = null
			}, 5000)
		})

		return () => {
			socket?.disconnect()
		}
	})

	async function send_message() {
		if (!input.trim()) return
		const new_msg: Msg & { chunks: { content: string }[] } = {
			role: "User" as const,
			content: input,
			chunks: [{ content: input }],
			id: "",
			created_at: new Date(),
			flags: ""
		}

		messages = [...messages, new_msg]

		current_streaming_msg = null
		thinking_message = ""

		socket?.emit("msg", {
			content: input,
			pic: STATE.photo ?? undefined
		})

		input = ""
		// Trigger resize after clearing input
		requestAnimationFrame(() => {
			const textarea = document.querySelector("textarea")
			if (textarea) {
				textarea.style.height = "auto"
				textarea.dispatchEvent(new Event("input"))
			}
		})

		await tick()

		scroll_to_bottom()
	}

	function clear_chat() {
		messages = []
		socket?.emit("clear")
	}

	function regen() {
		if (messages.length > 0 && messages[messages.length - 1].role === "Being") {
			messages = messages.slice(0, -1)
		}

		current_streaming_msg = null

		socket?.emit("regen")
	}

	function abort_msg_gen() {
		socket?.emit("abort")
	}
</script>

<div class="h-screen flex flex-col">
	<Fullscreen />

	{#if error}
		<ErrorBox {error} />
	{/if}

	<div
		bind:this={messages_container}
		class="flex-1 overflow-y-auto space-y-3 mt3 max-w-3xl mx-auto max-w-xl w-full"
	>
		{#each messages as msg}
			<Message
				msg={{
					...msg,
					chunks: msg.chunks || [{ content: msg.content }]
				}}
				root={msg.role === "User" ? last_user_message : undefined}
			/>
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
					flags: ""
				}}
				root={undefined}
				is_thinking={true}
			/>
		{/if}

		<div class="sticky bottom-0 flex justify-center">
			<Avatar />
		</div>
	</div>

	<div class="max-w-xl w-full mx-auto">
		<div class="flex justify-between items-end">
			<div class="flex items-center gap-2">
				<label class="flex items-center gap-1 text-xs text-stone-500">
					<input type="checkbox" bind:checked={auto_tts} />
					auto-speak
				</label>
				{#if messages.length > 0 && messages[messages.length - 1].role === "Being"}
					<button
						on:click={() => play_tts(messages[messages.length - 1].content)}
						class="text-xs text-stone-500 hover:text-stone-300 disabled:opacity-50 disabled:cursor-not-allowed {is_generating_tts
							? 'animate-pulse'
							: ''}"
						disabled={is_generating_tts}
					>
						speak
					</button>
				{/if}
			</div>

			<div class="flex gap-3">
				{#if is_typing}
					<button on:click={abort_msg_gen}>abort</button>
				{/if}
				<button on:click={regen}>regen</button>
				<button on:click={clear_chat}>clear</button>
			</div>
		</div>

		<div class="flex">
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
				class="flex-1 py-4 px-4 border-t border-x border-zinc-500 resize-none bg-transparent leading-175% max-h-200px"
				style="outline: none;"
			></textarea>
		</div>
	</div>
</div>
