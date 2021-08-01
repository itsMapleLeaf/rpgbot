import { ReplyComponent } from "./reply-component"

export type CommandHandlerAction =
  | { type: "add"; components: ReplyComponent[] }
  | { type: "update"; components: ReplyComponent[] }
  | { type: "selectResponse"; customId: string; callback: (values: string[]) => void }
  | { type: "buttonResponse"; customId: string; callback: () => void }

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

export function waitForSelect(
  customId: string,
  callback: (values: string[]) => void,
): CommandHandlerAction {
  return { type: "selectResponse", customId, callback }
}

export function waitForButton(customId: string, callback: () => void): CommandHandlerAction {
  return { type: "buttonResponse", customId, callback }
}
