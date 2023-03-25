import Browser from "webextension-polyfill"
import { APIReq } from "./api"

export interface ChatSession {
  id: string
  created_at: string
  updated_at: string
  url: string
}

export interface ChatMessage {
  id: string
  session_id: string
  author: 'ai' | 'user' | 'system'
  message: string
  hidden: boolean
  kind: 'user input' | 'highlight' | 'initial prompt' | 'response' | "placeholder"
  created_at: string
  updated_at: string
  vote: 'up' | 'down' | null
  meta?: Record<string, unknown>
}

export interface ChatListItem { session: ChatSession, message?: ChatMessage }

export async function listChatSessions(offset?: string): Promise<ChatListItem[]> {
  console.log("listing chat sessions")
  const res = await (await APIReq(`/chat${offset ? 'offset='+encodeURIComponent(offset) : ''}`, "GET", undefined)).json()
  return res.sessions || []
}


export async function getChatSession(sessionID: string): Promise<ChatMessage[]> {
  const res = await (await APIReq(`/chat/${encodeURIComponent(sessionID)}`, "GET", undefined)).json()
  return res.messages || []
}
