import { ReplyComponent } from "./reply-component"

export type CommandHandlerAction =
  | { type: "add"; components: ReplyComponent[] }
  | { type: "update"; components: ReplyComponent[] }
  | { type: "interaction" }

export function addReply(...components: (string | ReplyComponent)[]): CommandHandlerAction {
  return {
    type: "add",
    components: components.map((c) =>
      typeof c === "string" ? { type: "content", content: c } : c,
    ),
  }
}

export function updateReply(...components: (string | ReplyComponent)[]): CommandHandlerAction {
  return {
    type: "update",
    components: components.map((c) =>
      typeof c === "string" ? { type: "content", content: c } : c,
    ),
  }
}

export function waitForInteraction(): CommandHandlerAction {
  return { type: "interaction" }
}
