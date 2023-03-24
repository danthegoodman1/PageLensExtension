import { useEffect, useRef, useState } from "react"
import { ChatController, ChatControllerOptions, ChatMessage, ChatSession, ModelModule } from "./controller"

export function useChatController(modelModule: ModelModule, opts: ChatControllerOptions) {
  const [isReceivingMessage, setIsReceivingMessage] = useState(false)
  const [session, setSession] = useState<ChatSession | undefined>()
  const [sessionReady, setSessionready] = useState(false)
  const [incomingMessage, setIncomingMessage] = useState<ChatMessage | undefined>()
  const [messageError, setMessageError] = useState<Error | undefined>()

  const controller = useRef(new ChatController(modelModule, opts))
  controller.current.incomingMessageUpdated = (message) => {
    setIncomingMessage(message)
  }

  useEffect(() => {
    if (opts.sessionID) {
      controller.current.loadSession(opts.sessionID).then(() => setSessionready(true))
      return
    }
    setSessionready(true)
  }, [])

  const handleSendMessage = async (message: string) => {
    try {
      setIsReceivingMessage(true)
      setSession(await controller.current.SendMessage(message))
    } catch (error) {
      setMessageError(error as Error)
    } finally {
      setIsReceivingMessage(false)
      setIncomingMessage(undefined)
    }
  }

  return {
    isReceivingMessage,
    session,
    incomingMessage,
    sendMessage: handleSendMessage,
    messageError,
    sessionReady
  }
}
