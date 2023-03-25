import Browser from "webextension-polyfill"
import { APIReq } from "./api"

export interface ChatSession {
  user_id: string
  id: string
  created_at: Date
  updated_at: Date
  url: string
}

export interface ChatMessage {
  user_id: string
  id: string
  session_id: string
  author: 'ai' | 'user' | 'system'
  message: string
  hidden: boolean
  kind: 'user input' | 'highlight' | 'initial prompt' | 'response'
  created_at: Date
  updated_at: Date
  vote: 'up' | 'down' | null
  meta?: Record<string, unknown>
}

export interface ChatListItem { session: ChatSession, message?: ChatMessage }

export async function listChatSessions(offset?: string): Promise<ChatListItem[]> {
  const res = await (await APIReq(`/chat${offset ? 'offset='+encodeURIComponent(offset) : ''}`, "GET", undefined)).json()
  return res.sessions || []
}


export async function getChatSession(sessionID: string): Promise<ChatSession | undefined> {
  const res = await (await APIReq(`/chat/${encodeURIComponent(sessionID)}`, "GET", undefined)).json()
  return res.messages || []
}
