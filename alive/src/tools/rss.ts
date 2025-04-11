import Parser from "rss-parser"

async function get_rss_entries({
    urls,
    start_date,
}: {
    urls: string[]
    start_date: Date
}) {
    const parser = new Parser()
    const entries: Parser.Item[] = []

    for (const url of urls) {
        const res = await fetch(url)
        const json = await res.json()
        const str = json.contents

        const feed = await parser.parseString(str)

        for (const entry of feed.items) {
            const entry_date = entry.pubDate ? new Date(entry.pubDate) : null
            if (entry_date && entry_date >= start_date) {
                entries.push(entry)
            }
        }
    }

    return entries
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const out = await get_rss_entries({
        urls: [
            "https://api.allorigins.win/get?url=https://openai.com/news/rss.xml",
        ],
        start_date: new Date("2025-04-10T00:00:00Z"),
    })

    console.log(JSON.stringify(out, null, 4))
}
