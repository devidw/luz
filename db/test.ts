import { PrismaClient } from "@luz/db-client"

const db = new PrismaClient()

await db.msg.create({
  data: {
    role: "User",
    content: "hey",
  },
})
