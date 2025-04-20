// curl -s --compressed "https://api.search.brave.com/res/v1/web/search?q=brave+search" \
//   -H "Accept: application/json" \
//   -H "Accept-Encoding: gzip" \
//   -H "X-Subscription-Token: <YOUR_API_KEY>"

import "../lib/env.js"
import fs from "node:fs"

export async function web_search({ query, n }: { query: string; n?: number }) {
    const url = new URL("https://api.search.brave.com/res/v1/web/search")
    url.searchParams.set("q", query)
    url.searchParams.set("safesearch", "off")
    url.searchParams.set("text_decorations", "0")
    url.searchParams.set("result_filter", "web")
    url.searchParams.set("units", "metric")
    url.searchParams.set("count", n ? `${n}` : `${5}`)

    const response = await fetch(url, {
        headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip",
            "X-Subscription-Token": process.env.BRAVE_API_KEY!,
        },
    })

    if (!response.ok) {
        const txt = await response.text()
        throw new Error(
            `Brave search failed: ${response.status} ${response.statusText}\n${txt}`,
        )
    }

    const data = await response.json()

    const entries = data.web.results

    const outs = entries.map((one) => {
        return {
            title: one.title,
            description: one.description,
            url: one.url,
            age: one.age,
        }
    })

    return outs
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const out = await web_search({ query: "alien earth show" })
    fs.writeFileSync("../data/web.json", JSON.stringify(out, null, 4))
}
