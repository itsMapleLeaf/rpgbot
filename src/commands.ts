import { CommandManager } from "./command-handler"
import { createInteractionResponseDataBuilder } from "./interaction-response-data-builder"

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
        return createInteractionResponseDataBuilder()
          .setContent(
            `You ain't even in the game yet! Run /${startCommand.name} first.`,
          )
          .build()
      }

      return createInteractionResponseDataBuilder()
        .setContent(`Here's where you're at, partner!`)
        .addEmbed((embed) =>
          embed
            .setAuthorName(member.displayName)
            .setAuthorIcon(member.user.avatarURL() ?? "")
            .addField("Location", location),
        )
        .build()
    },
  })
}
