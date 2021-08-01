import { hasKey } from "./common"
import { NonEmptyArray, ValueOf } from "./types"

export type LocationId = ValueOf<typeof locationIds>

export type Location = {
  name: string
  description: string
  exits: NonEmptyArray<LocationId>
}

export function getInitialLocationId(): LocationId {
  return locationIds[0]
}

export function getInitialLocation(): Location {
  return locationMap[locationIds[0]]
}

export function getLocation(locationId: string): Location | undefined {
  return hasKey(locationMap, locationId) ? locationMap[locationId] : undefined
}

export function getAllLocations(): Location[] {
  return Object.values(locationMap)
}

const locationIds = ["tavern", "townSquare", "forest"] as const

const locationMap: Record<LocationId, Location> = {
  tavern: {
    name: "The Tavern",
    description:
      "The tavern is a large building with a bar and some tables. There are several people here, including a local barwoman and several customers.",
    exits: ["townSquare"],
  },
  townSquare: {
    name: "The Town Square",
    description:
      "The town square is a large open space with a few buildings and shop stalls, paths lined with cobblestone, and a fountain in the middle of the square.",
    exits: ["tavern", "forest"],
  },
  forest: {
    name: "The Forest",
    description:
      "The forest is a large area sporting a bounty of colorful foliage and wildlife. If you go deeper, you might find something interesting. But I haven't coded that in yet.",
    exits: ["townSquare"],
  },
}
