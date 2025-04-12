import { createTRPCClient, httpBatchLink } from "@trpc/client"
import type { App_Router } from "../../../alive/src/trpc"

export const trpc = createTRPCClient<App_Router>({
	links: [
		httpBatchLink({
			url: "http://localhost:6900/trpc"
		})
	]
})
