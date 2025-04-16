import turndown from "turndown"

const service = new turndown()
service.remove(["script", "style"])
service.addRule("img", {
    filter: ["img"],
    replacement: () => {
        return ""
    },
})

export async function web_visit({ url }: { url: string }) {
    const out = await fetch(url)
    const html = await out.text()
    const md = service.turndown(html)
    return md
}

if (import.meta.url === `file://${process.argv[1]}`) {
    const out = await web_visit({ url: "https://en.wikipedia.org/wiki/Hug" })
    console.info(out)
}
