import { DataTypes, Model } from "https://deno.land/x/denodb@v1.0.38/mod.ts"
import { db } from "./db.ts"
import { getInitialLocationId } from "./locations.ts"

class Player extends Model {
  static table = "players"
  static timestamps = true

  static fields = {
    id: { type: DataTypes.STRING, primaryKey: true, unique: true },
    discordUserId: { type: DataTypes.BIG_INTEGER, unique: true },
    locationId: { type: DataTypes.STRING },
  }

  static defaults = {
    locationId: getInitialLocationId(),
  }
}

db.link([Player])

export async function getPlayer(discordUserId: string) {
  const player = await Player.where({ discordUserId }).first()
  return player as Player
}
