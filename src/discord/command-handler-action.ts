import { normalizeReplyComponents, ReplyComponentArgs } from "./reply-component"

export type CommandHandlerAction =
  | ReturnType<typeof addReply>
  | ReturnType<typeof addEphemeralReply>
  | ReturnType<typeof updateReply>
  | ReturnType<typeof deleteReply>
  | ReturnType<typeof waitForInteraction>

export function addReply(...components: ReplyComponentArgs) {
  return {
    type: "add",
    components: normalizeReplyComponents(components),
    ephemeral: false,
  } as const
}

export function addEphemeralReply(...components: ReplyComponentArgs) {
  return {
    type: "add",
    components: normalizeReplyComponents(components),
    ephemeral: true,
  } as const
}

export function updateReply(...components: ReplyComponentArgs) {
  return {
    type: "update",
    components: normalizeReplyComponents(components),
  } as const
}

export function deleteReply() {
  return { type: "delete" } as const
}

export function waitForInteraction() {
  return { type: "interaction" } as const
}
