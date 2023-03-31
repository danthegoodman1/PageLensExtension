import { APIReq } from "./api"

export interface ChatSession {
  user_id: string
  id: string
  created_at: Date
  updated_at: Date
  url: string
  model_instance_id: string
  model_id: string
  title: string
}

export interface ChatMessage {
  id: string
  session_id: string
  author: 'ai' | 'user' | 'system'
  message: string
  hidden: boolean
  kind: 'user input' | 'webpage' | 'initial prompt' | 'response' | "placeholder" | "error"
  created_at: string
  updated_at: string
  vote: 'up' | 'down' | null
  meta?: Record<string, unknown>
}

export interface ChatListItem { session: ChatSession, message?: ChatMessage }

export async function listChatSessions(token: string, offset?: string): Promise<ChatListItem[]> {
  console.log("listing chat sessions")
  const res = await (await APIReq(token, `/chat${offset ? 'offset='+encodeURIComponent(offset) : ''}`, "GET", undefined)).json()
  return res.sessions || []
}


export async function getChatSession(token: string, sessionID: string): Promise<ChatMessage[]> {
  const res = await (await APIReq(token, `/chat/${encodeURIComponent(sessionID)}`, "GET", undefined)).json()
  return res.messages || []
}
