import { useEffect, useState } from "react"
import { ArrowLeft } from "react-feather"
import useWebSocket, { ReadyState } from 'react-use-websocket'
import Browser, { Tabs } from "webextension-polyfill"
import * as Tooltip from "@radix-ui/react-tooltip"

import { ChatMessage, ChatSession, getChatSession } from "../chats"
import SendIcon from "../Components/SendIcon"
import { useApp } from "../Context"

const socketAPI = "ws://localhost:8080/chat"

export default function ListModels(props: { session?: ChatSession }) {

  const { view, setView, models, activeChat, setActiveChat } = useApp()

  const [socketUrl, setSocketUrl] = useState<string | null>(null)
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    // reconnectAttempts: 5,
    // retryOnError: true,
  })

  const [pageURL, setPageURL] = useState("")

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [initalLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    if (!activeChat) {
      console.error("no active chat, returning to list chats")
      setView("list chats")
    }
  }, [activeChat])

  useEffect(() => {

  }, [lastMessage, readyState])

  useEffect(() => {
    (async () => {
      if (activeChat?.sessionID) {
        const m = await getChatSession(activeChat.sessionID)
        setMessages(m)
      }

      const tabs = await Browser.tabs.query({active: true, lastFocusedWindow: true})
      console.log(tabs)
      if (tabs[0] && tabs[0].url) {
        setPageURL(tabs[0].url)
      }

      setInitialLoading(false)
    })()
  }, [])

  const model = models.find((m) => m.instance_id === activeChat!.modelInstanceID)!

  return (
    <div className="w-full flex flex-col p-1">
      <div className="flex flex-row">
        <div onClick={() => {
          setView("list chats")
        }} className="cursor-pointer flex items-center">
          <ArrowLeft size={20} fontWeight={900} />
          <p className="font-semibold text-lg text-[14px]">Go home</p>
        </div>
        <div>
        <div className="flex flex-row justify-center items-center align-middle mb-1 mx-3 gap-2">
          <h1 className="text-2xl font-bold">Chat with {model.name}</h1>
          <div className="flex flex-col justify-start items-start">
            <strong className="font-semibold text-xs text-gray-500">{new Date().toDateString().split(" ").slice(1, 3).join(" ")}</strong>
            <Tooltip.Provider delayDuration={300}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <div className="w-[200px] overflow-hidden">
                    <p className="text-xs text-gray-500 whitespace-nowrap" style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{props.session? props.session.url : pageURL}</p>
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="TooltipContent border-solid border-2 border-black bg-white rounded-md p-1" sideOffset={5}>
                    {props.session? props.session.url : pageURL}
                  <Tooltip.Arrow className="TooltipArrow fill-black" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
          </div>
        </div>

        </div>
      </div>
      <div className="w-full h-full flex flex-col px-2 py-1 justify-between mb-2">
          {/* Message window */}
          <div className="bg-gray-400 w-full h-full">

          </div>

        {/* Chat box */}
        <div className="flex flex-col gap-2 items-start mt-1">
          <form className="w-full">
            <div className="w-full border rounded-lg">
              <div className="px-2 pt-2 bg-white rounded-t-lg">
                <textarea id="comment" rows={3} className="w-full resize-none focus:outline-none px-0 text-sm font-medium text-gray-900 bg-white border-0 focus:ring-0" placeholder="Ask a question" required></textarea>
              </div>
              <div className="flex items-center justify-end px-2 pt-1 pb-2">
                <div className="flex pl-0 space-x-1 sm:pl-2">
                  <button onClick={() => {}} className="text-sm flex gap-2 justify-center items-center align-middle py-2 px-5 bg-black text-white font-bold rounded-lg">
                    Send
                    <SendIcon />
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
