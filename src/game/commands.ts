import { MessageSelectOptionData } from "discord.js"
import { db } from "../db"
import { CommandHandler } from "../discord/command-handler"
import { addReply, updateReply, waitForSelect } from "../discord/command-handler-action"
import { buildEmbed } from "../discord/embed-builder"
import { actionRowComponent, embedComponent, selectMenuComponent } from "../discord/reply-component"
import { getInitialLocation, getInitialLocationId, getLocation, Location } from "./locations"
import { ensurePlayer } from "./player"

export const commands: CommandHandler[] = [
  {
    name: "status",
    description: "See where you are, what you have, etc.",
    async *run({ member }) {
      let player = await ensurePlayer(member.user.id)
      let location = getLocation(player.locationId)

      if (!location) {
        player = await db.player.update({
          where: { id: player.id },
          data: { locationId: getInitialLocationId() },
        })

        location = getInitialLocation()

        yield addReply(
          `Couldn't find where you were, so I just moved you back to ${location.name}. Anyway...`,
        )
      }

      yield addReply(
        `Here's where you're at.`,
        embedComponent(
          buildEmbed()
            .authorName(member.displayName)
            .authorIcon(member.user.avatarURL({ format: "png", size: 32 }))
            .inlineField("Location", location.name)
            .inlineField("Exits", location.exits.map((id) => getLocation(id).name).join(", "))
            .finish(),
        ),
      )
    },
  },

  {
    name: "move",
    description: "Move someplace else",
    async *run({ member }) {
      let player = await ensurePlayer(member.user.id)
      let location = getLocation(player.locationId)

      if (!location) {
        player = await db.player.update({
          where: { id: player.id },
          data: { locationId: getInitialLocationId() },
        })

        location = getInitialLocation()

        yield addReply(
          `Couldn't find where you were, so I just moved you back to ${location.name}. Anyway...`,
        )
      }

      const options = location.exits
        .map<MessageSelectOptionData>((id) => {
          const location = getLocation(id)
          return {
            label: location.name,
            value: id,
          }
        })
        .concat([{ label: "invalid location for test", value: "nope lol" }])

      let newLocation: Location | undefined
      const selectId = "newLocation"

      yield addReply(
        `Where do you want to go?`,
        actionRowComponent(selectMenuComponent({ customId: selectId, options })),
      )

      while (!newLocation) {
        yield waitForSelect(selectId, ([value]) => {
          if (value) newLocation = getLocation(value)
        })

        if (!newLocation) {
          yield updateReply(
            `Huh, couldn't find that location. Try again.`,
            actionRowComponent(selectMenuComponent({ customId: selectId, options })),
          )
        }
      }

      await db.player.update({
        where: { discordUserId: member.user.id },
        data: { locationId: newLocation.id },
      })

      yield updateReply(
        `Alright, here we are.`,
        embedComponent(
          buildEmbed()
            .authorIcon(member.user.avatarURL({ format: "png", size: 32 }))
            .authorName(`${member.displayName} moved!`)
            .title(newLocation.name)
            .description(newLocation.description)
            .field("Exits", newLocation.exits.map((id) => getLocation(id).name).join(", "))
            .finish(),
        ),
      )
    },
  },

  {
    name: "help",
    description: "Not sure what to do? This lists all of the commands.",
    async *run({ member }) {
      const embed = commands
        .reduce((embed, command) => embed.field(command.name, command.description), buildEmbed())
        .finish()

      yield addReply(`Here's a list of commands you can use.`, embedComponent(embed))
    },
  },
]
