import { addCommand } from "./command-handler.ts"
import { createInteractionResponseDataBuilder } from "./interaction-response-data-builder.ts"

const startCommand = addCommand({
  name: "start",
  description: "Enter the game",
  run({ member }) {
    const location = localStorage.getItem(`player:${member.user.id}:location`)
    if (location) {
      return createInteractionResponseDataBuilder()
        .setContent(`You're already in the game!`)
        .build()
    }

    localStorage.setItem(`player:${member.user.id}:location`, "The Tavern")
    return createInteractionResponseDataBuilder()
      .setContent(`Done! Welcome to the game, ${member.nick || member.user.username}!`)
      .build()
  },
})

addCommand({
  name: "status",
  description: "See where you are, what you have, etc.",
  run({ member }) {
    const location = localStorage.getItem(`player:${member.user.id}:location`)
    if (!location) {
      return createInteractionResponseDataBuilder()
        .setContent(`You ain't even in the game, yet! Run /${startCommand.name} first.`)
        .build()
    }

    return createInteractionResponseDataBuilder()
      .setContent(`Here's where you're at, partner!`)
      .addEmbed((embed) =>
        embed
          .setAuthorName(member.nick || member.user.username)
          .setAuthorIcon(
            `https://cdn.discordapp.com/avatars/${member.user.id}/${member.user.avatar}`,
          )
          .addField("Location", location),
      )
      .build()
  },
})
