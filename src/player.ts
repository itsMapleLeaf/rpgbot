import { Snowflake } from "discord.js"
import { Player } from "../prisma/client"
import { client } from "./db"
import { getInitialLocationId } from "./locations"

export async function ensurePlayer(discordUserId: Snowflake): Promise<Player> {
  return (
    (await client.player.findUnique({
      where: { discordUserId },
    })) ??
    (await client.player.create({
      data: {
        discordUserId,
        locationId: getInitialLocationId(),
      },
    }))
  )
}
