import { randomUUID } from "crypto"
import Browser from "webextension-polyfill"

export interface ModelModule {
  /**
   * The storage key where the API key will be stored in the browser.
   */
  storageKey: string

  name: string
  iconPath: string

  /**
   * Sends the current chat message with context. Transcript has already been modified. Can ignore `onProgress` if the model does not support streaming messages.
   */
  submitChat: (onProgress?: (progress: string) => void) => Promise<string>
}

export interface ChatControllerOptions {
  transcript?: ChatTranscript
}

export interface ChatMessage {
  author: "user" | "ai"
  message: string
  created: Date
  vote?: "up" | "down"
  hidden?: boolean
  [key: string]: any
}

export interface ChatTranscript {
  initialPrompt?: string
  messages: ChatMessage[]
  id: string
  created: Date
  lastUpdated: Date
}

export class ChatController {

  opts?: ChatControllerOptions
  transcript: ChatTranscript = { messages: [], created: new Date(), lastUpdated: new Date(), id: randomUUID() }
  canStreamMessages = false
  module: ModelModule
  moduleKey?: string

  transcriptUpdated?: (transcript: ChatTranscript) => void

  constructor(module: ModelModule, opts?: ChatControllerOptions) {
    this.module = module
    this.opts = opts
    if (this.opts?.transcript) {
      this.transcript = this.opts.transcript
    }
  }

  /**
   * Sends a message for the chat
   * @argument onProgress a callback that will be invoked for every update if `canStreamMessages = true`.
   * @returns The final chat message
   */
  async SendMessage(message: string) {
    if (this.transcript.messages.length === 0) {
      // TODO: Fetch initial page content
      const pageContent = ""
      this.transcript.messages.push({
        hidden: true,
        author: "user",
        created: new Date(),
        message: `${this.transcript.initialPrompt || ""}${pageContent}`
      })
    }
    this.transcript.messages.push({
      author: "user",
      created: new Date(),
      message
    })
    let response: ChatMessage = {
      author: "ai",
      created: new Date(),
      message: ""
    }
    this.transcript.messages.push(response)
    response.message = await this.module.submitChat((progress) => {
      response.message = progress
    })
    if (this.transcriptUpdated) // send the update if we have the function
      this.transcriptUpdated(this.transcript)
  }

  /**
   * Saves the transcript
   */
  async saveTranscript() {
    
  }

  /**
   * Gets the storage key from sync storage
   */
  async loadKey() {
    const key = await Browser.storage.sync.get(this.module.storageKey)
    this.moduleKey = key[this.module.storageKey]
  }
}
