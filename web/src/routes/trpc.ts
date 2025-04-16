import { createTRPCClient, httpBatchLink } from "@trpc/client"
import type { App_Router } from "../../../alive/src/trpc"

let trpc_instance: ReturnType<typeof createTRPCClient<App_Router>> | null = null

export function get_trpc() {
	if (!trpc_instance) {
		trpc_instance = createTRPCClient<App_Router>({
			links: [
				httpBatchLink({
					url: `${window.location.origin.replace(/:\d+/, ":6900")}/trpc`
				})
			]
		})
	}
	return trpc_instance
}
