import { useEffect, useState } from "react"
import { ArrowLeft } from "react-feather"
import useWebSocket, { ReadyState } from 'react-use-websocket'
import Browser, { Tabs } from "webextension-polyfill"
import * as Tooltip from "@radix-ui/react-tooltip"

import { ChatMessage, ChatSession, getChatSession } from "../chats"
import SendIcon from "../Components/SendIcon"
import { useApp } from "../Context"
import { PageRequest, PageResponse } from "@src/pages/content"

const socketAPI = "ws://localhost:8080/chat?hey=ho"

interface WebSocketMessage {
  type: "close" | "response" | "stream response"
  data: any
}

interface OutgoingChatMessage {
  highlighted?: string
  webpage?: string
  prompt: string
  url?: string
  sessionID?: string
  modelInstanceID: string
}

export default function ListModels(props: { session?: ChatSession }) {

  const { setView, models, activeChat } = useApp()

  const [outgoingMessage, setOutgoingMessage] = useState("")
  const [incomingMessage, setIncomingMessage] = useState<ChatMessage>()
  const [session, setSession] = useState<ChatSession | undefined>(props.session)

  const [socketUrl, setSocketUrl] = useState<string | null>(null)
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    // reconnectAttempts: 5,
    // retryOnError: true,
  })

  const [pageURL, setPageURL] = useState(props.session?.url || "")

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [initalLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    if (!activeChat) {
      console.error("no active chat, returning to list chats")
      setView("list chats")
    }
  }, [activeChat])

  useEffect(() => {
    if (lastMessage) {
      const msg = JSON.parse(lastMessage.data) as WebSocketMessage
      console.log("got websocket message", msg)
      switch (msg.type) {
        case "close":
          setSocketUrl(null)
          break
        case "response":
          if (msg.data) {
            const m = messages
            m.push(msg.data as ChatMessage)
            setMessages(m)
          }
          setSocketUrl(null)
          break
        case "stream response":
          const chatMessage = msg.data as ChatMessage
          setIncomingMessage(chatMessage)
          if (!props.session) {
            console.log("first response in session, setting session")
            setSession({
              created_at: chatMessage.created_at,
              id: chatMessage.session_id,
              updated_at: chatMessage.updated_at,
              url: pageURL,
            })
          }
          break
      }
    }
  }, [lastMessage, readyState])

  const buttonDisabled = initalLoading || outgoingMessage === ""

  useEffect(() => {
    (async () => {
      if (activeChat?.sessionID) {
        const m = await getChatSession(activeChat.sessionID)
        setMessages(m)
      } else {
        // Put an initial message int here
        setMessages((m) => {
          m.push({
            author: "ai",
            kind: "placeholder",
            created_at: new Date().toISOString(),
            hidden: false,
            id: "placeholder",
            message: "How can I help?",
            session_id: "",
            updated_at: new Date().toISOString(),
            vote: null,
          })
          return m
        })
      }

      if (pageURL === "") {
        const tabs = await Browser.tabs.query({active: true, lastFocusedWindow: true})
        if (tabs[0] && tabs[0].url) {
          setPageURL(tabs[0].url)
        }
      }
      // TODO: Otherwise show it needs to be on a webpage?

      setInitialLoading(false)
    })()
  }, [])

  const model = models.find((m) => m.instance_id === activeChat!.modelInstanceID)!

  function handleSend() {
    // Connect to the socket
    console.log("connecting to websocket")
    setSocketUrl(socketAPI)
  }

  useEffect(() => {
    (async () => {
      console.log("READY STATE", readyState)
      if (readyState === ReadyState.OPEN) {
        // Send the message
        console.log("sending message over websocket")
        const payload: OutgoingChatMessage = {
          prompt: outgoingMessage,
          url: pageURL,
          modelInstanceID: model.instance_id
        }
        const tab = await Browser.tabs.query({ active: true, currentWindow: true });
        if (messages.length <= 1) {
          // We need to get the webpage
          const resp = await Browser.tabs.sendMessage(tab[0].id!, {
            type: "page content"
          } as PageRequest) as PageResponse
          if (resp.pageContent) {
            payload.webpage = resp.pageContent
          } else {
            console.error("did not get page content!")
            // TODO: handle error better
          }
        }
        // Check for highlight
        const resp = await Browser.tabs.sendMessage(tab[0].id!, {
          type: "selection"
        } as PageRequest) as PageResponse
        if (resp.selection) {
          console.log("got selected region")
          payload.highlighted = resp.selection
        }

        // TODO: push this message to messages
        setMessages((m) => {
          m.push({
            author: "user",
            kind: "user input",
            created_at: new Date().toISOString(),
            hidden: false,
            id: window.crypto.randomUUID(), // doesn't really matter, just should be unique
            message: outgoingMessage,
            session_id: session?.id || "not yet", // if this is the first message, we don't know yet
            updated_at: new Date().toISOString(),
            vote: null,
          })
          return m
        })
        sendMessage(JSON.stringify(payload))
        setOutgoingMessage("")
      }
      if (readyState === ReadyState.CLOSED) {
        console.log("socket closed")
        setSocketUrl(null)
      }
    })()
  }, [readyState])

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
          <p>{JSON.stringify(messages)}</p>
        </div>

        {/* Chat box */}
        <div className="flex flex-col gap-2 items-start mt-1">
          <div className="w-full border rounded-lg">
            <div className="px-2 pt-2 bg-white rounded-t-lg">
              <textarea value={outgoingMessage} onChange={((e) => {
                setOutgoingMessage(e.target.value)
              })} onKeyDown={(e) => {
                // TODO: enter/shift+enter handling
              }} id="comment" rows={3} className="w-full resize-none focus:outline-none px-0 text-sm font-medium text-gray-900 bg-white border-0 focus:ring-0" placeholder="Ask a question" required></textarea>
            </div>
            <div className="flex items-center justify-end px-2 pt-1 pb-2">
              <div className="flex pl-0 space-x-1 sm:pl-2">
                <button disabled={buttonDisabled} onClick={() => handleSend()} className={`text-sm flex gap-2 justify-center items-center align-middle py-2 px-5 ${buttonDisabled ? "bg-gray-500" : "bg-black"} text-white font-bold rounded-lg`}>
                  Send
                  <SendIcon />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
