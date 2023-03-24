import Browser from "webextension-polyfill"

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
  session?: ChatSession
}

export interface ChatMessage {
  author: "user" | "ai"
  message: string
  created: Date
  vote?: "up" | "down"
  hidden?: boolean
  [key: string]: any
}

export interface ChatSession {
  initialPrompt?: string
  messages: ChatMessage[]
  id: string
  created: Date
  lastUpdated: Date
}

export class ChatController {

  opts?: ChatControllerOptions
  session: ChatSession = { messages: [], created: new Date(), lastUpdated: new Date(), id: window.crypto.randomUUID() }
  module: ModelModule
  moduleKey?: string

  sessionUpdated?: (transcript: ChatSession) => void

  constructor(module: ModelModule, opts?: ChatControllerOptions) {
    this.module = module
    this.opts = opts
    if (this.opts?.session) {
      this.session = this.opts.session
    }
  }

  /**
   * Sends a message for the chat
   * @argument onProgress a callback that will be invoked for every update if `moduile.canStreamMessages = true`.
   * @returns The final chat message
   */
  async SendMessage(message: string) {
    if (this.session.messages.length === 0) {
      // TODO: Fetch initial page content
      const pageContent = ""
      this.session.messages.push({
        hidden: true,
        author: "user",
        created: new Date(),
        message: `${this.session.initialPrompt || ""}${pageContent}`
      })
    }
    this.session.messages.push({
      author: "user",
      created: new Date(),
      message
    })
    let response: ChatMessage = {
      author: "ai",
      created: new Date(),
      message: ""
    }
    this.session.messages.push(response)
    response.message = await this.module.submitChat((progress) => {
      response.message = progress
      if (this.sessionUpdated) // send the update if we have the function
        this.sessionUpdated(this.session)
    })
    if (this.sessionUpdated) // send the update if we have the function
      this.sessionUpdated(this.session)
    this.saveSession()
  }

  /**
   * Saves the session to local storage
   */
  async saveSession() {
    await Browser.storage.local.set({ [`chat_${this.session.id}`]: this.session })
  }
}
