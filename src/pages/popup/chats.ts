import Browser from "webextension-polyfill"

export interface ChatMessage {
  author: "user" | "ai"
  /**
   * Message components to join for a single message
   */
  message: {
    /**
     * The message content
     */
    content: string
    /**
     * Whether this should be visually hidden, used for highlighted regions
     */
    hidden?: boolean
    kind: "input" | "highlight" | "initial prompt" | "response"
  }[]
  created: number
  vote?: "up" | "down"
  hidden?: boolean
  [key: string]: any
}

export interface ChatSession {
  initialPrompt?: string
  messages: ChatMessage[]
  id: string
  created: number
  lastUpdated: number
  url: string
}

export interface ChatSessionIndex {
  id: string
  created: number
  lastUpdate: number
  url: string
}

export async function listChatSessions(): Promise<ChatSessionIndex[]> {
  const sessions: ChatSessionIndex[] = (await Browser.storage.local.get("chat_sessions") as Record<string, ChatSessionIndex[]>)["chat_sessions"]
  return sessions || []
}


export async function getChatSession(id: string): Promise<ChatSession | undefined> {
  return (await Browser.storage.local.get(id))[id]
}

export async function putChatSession(session: ChatSession) {
  await Promise.all([
    Browser.storage.local.set({
      "chat_sessions": [...await listChatSessions(), {
        created: session.created,
        id: session.id,
        lastUpdate: session.lastUpdated,
        url: session.url
      } as ChatSessionIndex].filter((val, ind, self) => ind === self.findIndex((s) => val.id === s.id)) // deduplicate
    }),
    Browser.storage.local.set({
      [session.id]: session
    })
  ])
}

export async function deleteChatSession(id: string) {
  await Promise.all([
    Browser.storage.local.set({
      "chat_sessions": (await listChatSessions()).filter((i) => i.id !== id)
    }),
    Browser.storage.local.remove(id)
  ])
}
