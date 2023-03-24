import { useRef, useState } from "react"
import { ChatController, ChatSession, ModelModule } from "./controller"

export function useChatController(modelModule: ModelModule) {
  const [isReceivingMessage, setIsReceivingMessage] = useState(false)
  const [session, setSession] = useState<ChatSession | undefined>()
  const [messageError, setMessageError] = useState<Error | undefined>()

  const controller = useRef(new ChatController(modelModule))
  controller.current.sessionUpdated = (transcript) => {
    setSession(transcript)
  }

  const handleSendMessage = async (message: string) => {
    try {
      setIsReceivingMessage(true)
      await controller.current.SendMessage(message)
    } catch (error) {
      setMessageError(error as Error)
    } finally {
      setIsReceivingMessage(false)
    }
  }

  return {
    canReceiveMessages: controller.current.canStreamMessages,
    isReceivingMessage,
    session,
    sendMessage: handleSendMessage,
    messageError
  }
}
