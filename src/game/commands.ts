import { MessageSelectOptionData } from "discord.js"
import { Location, Player } from "../../prisma/client"
import { db } from "../db"
import { CommandHandler, CommandHandlerContext } from "../discord/command-handler"
import { buildEmbed } from "../discord/embed-builder"
import {
  actionRowComponent,
  buttonComponent,
  embedComponent,
  selectMenuComponent,
} from "../discord/reply-component"
import { getInitialLocation, getLocation } from "./locations"
import { ensurePlayer } from "./player"

export const commands: CommandHandler[] = [
  {
    name: "status",
    description: "See where you are, what you have, etc.",
    async run(context) {
      const player = await ensurePlayer(context.member.user.id)

      await context.addReply(
        `Here's where you're at.`,
        embedComponent(
          buildEmbed()
            .authorName(context.member.displayName)
            .authorIcon(context.member.user.avatarURL({ format: "png", size: 32 }))
            .inlineField("Location", player.location.name)
            .inlineField("Exits", player.location.exitLocations.map((l) => l.name).join(", "))
            .finish(),
        ),
      )
    },
  },

  {
    name: "move",
    description: "Move someplace else",
    async run(context) {
      const player = await ensurePlayer(context.member.user.id)

      let options = getLocationSelectOptions(player)

      await context.addEphemeralReply(
        ...locationSelectComponent(`Where do you want to go?`, options),
      )

      const newLocation = await promptForNewLocation(context, options)
      if (!newLocation) return

      await db.player.update({
        where: { discordUserId: context.member.user.id },
        data: { locationId: newLocation.id },
      })

      // remove the ephemeral form
      await context.updateReply("Done.")

      await context.addReply(
        `Here we are!`,
        embedComponent(
          buildEmbed()
            .authorIcon(context.member.user.avatarURL({ format: "png", size: 32 }))
            .authorName(`${context.member.displayName} moved!`)
            .title(newLocation.name)
            .description(newLocation.description)
            .field("Exits", newLocation.exitLocations.map((l) => l.name).join(", "))
            .finish(),
        ),
      )
    },
  },

  {
    name: "help",
    description: "Not sure what to do? This lists all of the commands.",
    async run(context) {
      const embed = commands
        .reduce((embed, command) => embed.field(command.name, command.description), buildEmbed())
        .footer({
          text: "There ain't much yet! Still working on stuff.",
        })
        .finish()

      await context.addReply(`Here's a list of commands you can use.`, embedComponent(embed))
    },
  },
]

async function promptForNewLocation(
  context: CommandHandlerContext,
  options: { label: string; value: string }[],
) {
  let newLocation: (Location & { exitLocations: Location[] }) | undefined

  while (!newLocation) {
    const interaction = await context.waitForInteraction()

    if (interaction?.customId === "move:confirm") {
      newLocation = await getLocation(options[0].value)
    }

    if (interaction?.customId === "move:cancel") {
      await context.updateReply(`Alright, carry on.`)
      return
    }

    if (interaction?.customId === "move:newLocation") {
      const [newLocationId] = interaction?.values ?? []
      if (newLocationId) {
        newLocation = await getLocation(newLocationId)
      }
    }

    if (!newLocation) {
      await context.updateReply(
        ...locationSelectComponent(`Huh, couldn't find that place. Try again.`, options),
      )
    }
  }

  return newLocation
}

function getLocationSelectOptions(
  player: Player & { location: Location & { exitLocations: Location[] } },
) {
  if (player.location.exitLocations.length === 0) {
    const initialLocation = getInitialLocation()
    return [{ label: initialLocation.name, value: initialLocation.id }]
  }

  return player.location.exitLocations.map((location) => ({
    label: location.name,
    value: location.id,
  }))
}

function locationSelectComponent(content: string, options: MessageSelectOptionData[]) {
  const [onlyOption, ...rest] = options
  if (onlyOption && rest.length === 0) {
    return [
      `Move to ${onlyOption.label}?`,
      actionRowComponent(
        buttonComponent({ customId: "move:confirm", label: "Confirm", style: "PRIMARY" }),
        buttonComponent({ customId: "move:cancel", label: "Cancel", style: "SECONDARY" }),
      ),
    ]
  }

  return [
    content,
    actionRowComponent(selectMenuComponent({ customId: "move:newLocation", options })),
    actionRowComponent(
      buttonComponent({ customId: "move:cancel", label: "Cancel", style: "SECONDARY" }),
    ),
  ]
}
