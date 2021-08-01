import { CommandManager } from "./command-manager"
import { client } from "./db"
import { createEmbedBuilder } from "./embed-builder"
import { getInitialLocation, getInitialLocationId, getLocation } from "./locations"
import { ensurePlayer } from "./player"

export function addCommands(manager: CommandManager) {
  manager.add({
    name: "status",
    description: "See where you are, what you have, etc.",
    async *run({ member }) {
      let player = await ensurePlayer(member.user.id)
      let location = getLocation(player.locationId)

      if (!location) {
        yield "Not sure where you're at... maybe that place got deleted or somethin'. I'll send you back to the tavern."

        player = await client.player.update({
          where: { id: player.id },
          data: { locationId: getInitialLocationId() },
        })

        location = getInitialLocation()
      }

      yield {
        content: `Here's where you're at!`,
        embeds: [
          createEmbedBuilder()
            .setAuthorName(member.displayName)
            .setAuthorIcon(member.user.avatarURL({ format: "png", size: 32 }))
            .addField("Location", location.name)
            .build(),
        ],
      }
    },
  })
}
