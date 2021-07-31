import { addCommand } from "./command-handler.ts"

addCommand({
  name: "ping",
  description: "Pong!",
  run: () => ({
    content: "Pong!",
  }),
})
