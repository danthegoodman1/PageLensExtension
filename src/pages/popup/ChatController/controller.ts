import Browser from "webextension-polyfill"
import { ChatMessage, ChatSession } from "../chats"

export interface ModelModule {
  name: string
  iconPath: string
  canStreamMessages: boolean

  /**
   * Sends the current chat message with context. Transcript has already been modified. Can ignore `onProgress` if the model does not support streaming messages.
   */
  submitChat: (onProgress?: (progress: string) => void) => Promise<string>
}

export interface ChatControllerOptions {
  url: string
}

export class ChatController {

  opts: ChatControllerOptions
  session: ChatSession
  module: ModelModule
  moduleKey?: string

  incomingMessageUpdated?: (message: ChatMessage) => void

  constructor(module: ModelModule, opts: ChatControllerOptions) {
    this.module = module
    this.opts = opts

    this.session = { messages: [], created: new Date().getTime(), lastUpdated: new Date().getTime(), id: window.crypto.randomUUID(), url: opts.url }
  }

  async loadSession(sessionID: string) {
    const sessionKey = `chat_${this.session.id}`
    const existingSession = await Browser.storage.local.get(sessionKey)
    if (!existingSession) {
      console.error("did not find existing session!")
      return
    }
    this.session = existingSession[sessionKey]
  }

  /**
   * Sends a message for the chat
   * @argument onProgress a callback that will be invoked for every update if `moduile.canStreamMessages = true`.
   * @returns The final chat message
   */
  async SendMessage(message: string): Promise<ChatSession> {
    if (this.session.messages.length === 0) {
      // TODO: Fetch initial page content
      const pageContent = ""
      this.session.messages.push({
        hidden: true,
        author: "user",
        created: new Date().getTime(),
        message: [
          {
            content: `${this.session.initialPrompt || ""}${pageContent}`,
            kind: "initial prompt"
          }
        ]
      })
    }
    // TODO: Check if a region is highlighted, include it, and omit in prompt? Or format fancy
    this.session.messages.push({
      author: "user",
      created: new Date().getTime(),
      message: [{
        content: message,
        kind: "input"
      }]
    })
    let response: ChatMessage = {
      author: "ai",
      created: new Date().getTime(),
      message: [{
        content: "",
        kind: "response"
      }]
    }
    this.session.messages.push(response)
    response.message[0].content = await this.module.submitChat((progress) => {
      response.message[0].content = progress
      if (this.incomingMessageUpdated) // send the update if we have the function
        this.incomingMessageUpdated(response)
    })
    if (this.incomingMessageUpdated) // send the update if we have the function
      this.incomingMessageUpdated(response)
    this.saveSession()
    return this.session
  }

  /**
   * Saves the session to local storage
   */
  async saveSession() {
    await Browser.storage.local.set({ [`chat_${this.session.id}`]: this.session })
  }
}
