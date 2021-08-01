import { CommandManager } from "./command-manager"
import { createEmbedBuilder } from "./embed-builder"

const storage = new Map<string, string>()
const localStorage = {
  getItem: (key: string) => storage.get(key),
  setItem: (key: string, value: string) => storage.set(key, value),
}

export function addCommands(manager: CommandManager) {
  const startCommand = manager.add({
    name: "start",
    description: "Enter the game",
    run({ member }) {
      const location = localStorage.getItem(`player:${member.user.id}:location`)
      if (location) {
        return `You're already in the game!`
      }

      localStorage.setItem(`player:${member.user.id}:location`, "The Tavern")
      return `Done! Welcome to the game, ${member.displayName}!`
    },
  })

  manager.add({
    name: "status",
    description: "See where you are, what you have, etc.",
    run({ member }) {
      const location = localStorage.getItem(`player:${member.user.id}:location`)
      if (!location) {
        return `You ain't even in the game yet! Run /${startCommand.name} first.`
      }

      return {
        content: `Here's where you're at!`,
        embeds: [
          createEmbedBuilder()
            .setAuthorName(member.displayName)
            .setAuthorIcon(member.user.avatarURL() ?? "")
            .addField("Location", location)
            .build(),
        ],
      }
    },
  })
}
