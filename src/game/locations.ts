import { hasKey } from "../common/helpers"
import { NonEmptyArray, ValueOf } from "../common/types"

export type LocationId = ValueOf<typeof locationIds>

export type Location = {
  id: LocationId
  name: string
  description: string
  exits: NonEmptyArray<LocationId>
}

export function getInitialLocationId(): LocationId {
  return locationIds[0]
}

export function getInitialLocation(): Location {
  return getLocation(getInitialLocationId())
}

export function getLocation(locationId: LocationId): Location
export function getLocation(locationId: string): Location | undefined
export function getLocation(locationId: string): Location | undefined {
  return hasKey(locationMap, locationId)
    ? { ...locationMap[locationId], id: locationId }
    : undefined
}

export function getAllLocations(): Location[] {
  return (Object.keys(locationMap) as LocationId[]).map((id) => getLocation(id))
}

const locationIds = ["tavern", "townSquare", "forest"] as const

const locationMap: Record<LocationId, Omit<Location, "id">> = {
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
