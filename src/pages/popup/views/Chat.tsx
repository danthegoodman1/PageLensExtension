import { useEffect, useState } from "react"
import { ArrowLeft, ChevronDown, Copy, Edit3 } from "react-feather"
import useWebSocket, { ReadyState } from 'react-use-websocket'
import Browser from "webextension-polyfill"
import * as Tooltip from "@radix-ui/react-tooltip"
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import ReactMarkdown from "react-markdown"
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism'
import PulseLoader from "react-spinners/PulseLoader"

import { ChatMessage, ChatSession, getChatSession } from "../chats"
import SendIcon from "../Components/SendIcon"
import { useApp } from "../Context"
import { useAuth } from "@clerk/clerk-react"

const socketAPI = import.meta.env.VITE_SOCKET_API

interface WebSocketMessage {
  type: "close" | "response" | "stream response" | "error"
  data: any
}

interface OutgoingChatMessage {
  webpage?: string
  prompt: string
  url?: string
  sessionID?: string
  modelInstanceID: string
  meta?: { [key: string]: any }
  title?: string
}

export default function Chat(props: { session?: ChatSession }) {

  const { setView, models, activeChat, targetBtnMode, setTargetButtonMode } = useApp()

  const [outgoingMessage, setOutgoingMessage] = useState("")
  const [incomingMessage, setIncomingMessage] = useState<{ content: string } | undefined>()
  const [showSpinner, setShowSpinner] = useState(false)
  const [session, setSession] = useState<ChatSession | undefined>(props.session)
  const [metaDown, setMetaDown] = useState(false)
  const [highlighted, setHighlighted] = useState<string | undefined>()

  const [socketUrl, setSocketUrl] = useState<string | null>(null)
  const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl, {
    // reconnectAttempts: 5,
    // retryOnError: true,
  })

  const { getToken } = useAuth()

  const [pageURL, setPageURL] = useState(props.session?.url || "")
  const [pageTitle, setPageTitle] = useState(props.session?.title || "")

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [initalLoading, setInitialLoading] = useState(true)

  // Only allow withpage if we don't already have a page
  const canDoPage = !messages.some((m) => m.kind === "webpage")
  const realButtonMode = targetBtnMode === "withpage" && canDoPage ? targetBtnMode : "plain"

  useEffect(() => {
    if (!activeChat) {
      console.error("no active chat, returning to list chats")
      setView("list chats")
    }
  }, [activeChat])

  useEffect(() => {
    const inputElement = document.getElementById("input")
    if (inputElement) inputElement.focus()
  }, [])

  useEffect(() => {
    if (lastMessage) {
      const msg = JSON.parse(lastMessage.data) as WebSocketMessage
      console.log("got websocket message", msg)
      switch (msg.type) {
        case "close":
          setSocketUrl(null)
          break
        case "response":
          const m = messages
          const chatMessage = msg.data as ChatMessage
          m.push(chatMessage)
          setMessages(m)
          setSocketUrl(null)
          setIncomingMessage(undefined)
          setShowSpinner(false)
          if (!props.session) {
            console.log("first response in session, setting session")
            setSession({
              created_at: new Date(chatMessage.created_at),
              id: chatMessage.session_id,
              updated_at: new Date(chatMessage.updated_at),
              url: pageURL,
              title: pageTitle,
              model_instance_id: model.instance_id,
              model_id: model.model_id,
              user_id: "" // not needed
            })
          }
          document.getElementById("bottom")?.scrollIntoView()
          break
        case "stream response":
          setIncomingMessage(msg.data)
          setShowSpinner(false)
          break
        case "error":
          setMessages((m) => {
            m.push({
              author: "system",
              kind: "error",
              created_at: new Date().toISOString(),
              hidden: false,
              id: "placeholder",
              message: msg.data.error,
              session_id: "",
              updated_at: new Date().toISOString(),
              vote: null,
            })
            return m
          })
          setSocketUrl(null)
          setIncomingMessage(undefined)
          setShowSpinner(false)
          break
      }
    }
  }, [lastMessage, readyState])

  const buttonDisabled = initalLoading || outgoingMessage === ""

  useEffect(() => {
    (async () => {
      if (activeChat?.sessionID) {
        console.log("got a session for this chat")
        const token = await getToken()
        if (!token) {
          throw new Error("missing token!")
        }
        const m = await getChatSession(token, activeChat.sessionID)
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
        if (pageTitle === "") {
          if (tabs[0] && tabs[0].title) {
            setPageTitle(tabs[0].title)
          }
        }
      }
      // TODO: Otherwise show it needs to be on a webpage?

      setInitialLoading(false)
    })();
    (async () => {
      const tab = await Browser.tabs.query({ active: true, currentWindow: true });
      const res = await Browser.scripting.executeScript({
        func: function getInnerText() {
          //You can play with your DOM here or check URL against your regex
          return window.getSelection()?.toString()
        },
        target: {tabId: tab[0].id!}
      })
      if (!!res[0].result) {
        setHighlighted(res[0].result as string)
      }
    })();
  }, [])

  const model = models.find((m) => m.instance_id === activeChat!.modelInstanceID)!

  async function handleSend() {
    // Connect to the socket
    console.log("connecting to websocket")
    const res = await Browser.storage.local.get("email")
    setSocketUrl(socketAPI+`?email=${encodeURIComponent(res["email"])}`)
  }

  useEffect(() => {
    (async () => {
      console.log("READY STATE", readyState)
      if (readyState === ReadyState.OPEN) {
        // Send the message
        console.log("sending message over websocket", session?.id || activeChat?.sessionID)
        const payload: OutgoingChatMessage = {
          prompt: outgoingMessage,
          url: pageURL,
          modelInstanceID: model.instance_id,
          sessionID: session?.id || activeChat?.sessionID,
          title: pageTitle,
          meta: {}
        }
        const tab = await Browser.tabs.query({ active: true, currentWindow: true });
        if (realButtonMode === "withpage") {
          // We need to get the webpage
          const res = await Browser.scripting.executeScript({
            func: function getInnerText() {
              //You can play with your DOM here or check URL against your regex
              return document.body.innerText
            },
            target: {tabId: tab[0].id!}
          })
          if (res[0].result) {
            payload.webpage = res[0].result
            // Push the fake page
            setMessages((m) => {
              m.push({
                author: "system",
                kind: "webpage",
                created_at: new Date().toISOString(),
                hidden: false,
                id: window.crypto.randomUUID(), // doesn't really matter, just should be unique
                message: "<omitted>",
                session_id: session?.id || "not yet", // if this is the first message, we don't know yet
                updated_at: new Date().toISOString(),
                vote: null,
                meta: {
                  title: pageTitle
                }
              })
              return m
            })
            payload.meta!.title = pageTitle
          } else {
            console.error("did not get page content!")
            // TODO: handle error better
          }
        }

        if (!!highlighted) {
          payload.meta!.highlight = highlighted
        }

        // Push this message to messages
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
            meta: {
              highlight: highlighted
            }
          })
          return m
        })
        sendMessage(JSON.stringify(payload))
        setOutgoingMessage("")
        setShowSpinner(true)
        document.getElementById("bottom")?.scrollIntoView()
      }
      if (readyState === ReadyState.CLOSED) {
        console.log("socket closed")
        setSocketUrl(null)
      }
    })()
  }, [readyState])

  async function goToSessionURL() {
    if (!session?.url) {
      console.error("no session url")
      return
    }

    // Remove query parameters from the target URL
    const targetUrlWithoutQueryParams = session.url.split('?')[0];

    // Query all tabs in the current window
    const tabs = await Browser.tabs.query({ currentWindow: true });
    for (const tab of tabs) {
      // Remove query parameters from the tab's URL
      const tabUrlWithoutQueryParams = tab.url!.split('?')[0];

      // Check if the URLs match
      if (tabUrlWithoutQueryParams === targetUrlWithoutQueryParams) {
        // Activate the matching tab and focus the window
        Browser.tabs.update(tab.id, { active: true });
        Browser.windows.update(tab.windowId!, { focused: true });
        return;
      }
    }

    // If no matching tab is found, create a new one
    Browser.tabs.create({ url: session.url });
  }

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
                  <div onClick={() => goToSessionURL()} className="w-[200px] overflow-hidden cursor-pointer">
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
        <div className="bg-gray-400 w-full h-full max-h-[70vh] overflow-y-scroll">
          {messages.map((m, i) => {
            if (m.author === "system" && m.kind === "error") {
              return (<div key={i} className="my-2 px-1 bg-red-200 border-solid border-black border-2">
                <strong className="font-bold">Error</strong>: <Md>{m.message}</Md>
              </div>)
            }
            if (m.author === "system" && m.kind === "webpage") {
              return (
                <Tooltip.Provider delayDuration={300}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <div onClick={() => goToSessionURL()} key={i} className="cursor-pointer my-2 px-1 bg-yellow-100 border-solid border-black border-2">
                        <strong className="font-bold">Webpage</strong>: {!!pageTitle ? <strong className="font-bold">{pageTitle}</strong> : session?.url}
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
              )
            }
            return (
              <div key={i} className="my-2 px-1 bg-gray-50 border-solid border-black border-2">
                <div className="flex flex-row gap-1 items-center">
                  <strong className="font-bold">{m.author === "user" ? "You" : model.name}:</strong>
                  <>
                    {m.meta?.highlight && <Tooltip.Provider delayDuration={300}>
                      <Tooltip.Root>
                        <Tooltip.Trigger>
                          <div className="flex items-center gap-1 cursor-default">
                            <Edit3 stroke="black" size={10} />
                            <p className="text-gray-500">(highlighted)</p>
                          </div>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content className="TooltipContent border-solid border-2 border-black bg-white rounded-md p-1" sideOffset={5}>
                            <>
                              {(m.meta.highlight as string).length < 40 ? m.meta.highlight : (m.meta.highlight as string).slice(0, 40) + "..." }
                            </>
                            <Tooltip.Arrow className="TooltipArrow fill-black" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>}
                  </>
                </div>
                <Md>{m.message}</Md> @ {m.created_at}
              </div>
            )
          })}
          {showSpinner && !incomingMessage && <div className="my-2 px-1 bg-gray-50 border-solid border-black border-2">
              <strong className="font-bold">{model.name}</strong>
              : Thinking
              <PulseLoader
                color={"black"}
                loading={true}
                size={8}
                aria-label="Loading Spinner"
                data-testid="loader"
              />
            </div>}
          {incomingMessage && <div className="my-2 px-1 bg-gray-50 border-solid border-black border-2">
            <strong className="font-bold">{model.name}</strong>: <Md>{incomingMessage.content}</Md>
          </div>}
          <div id="bottom"></div>
        </div>

        {/* Chat box */}
        <div className="flex flex-col gap-2 items-start mt-1">
          <div className="w-full border rounded-lg">
            <div className="px-2 pt-2 bg-white rounded-t-lg">
              <textarea value={outgoingMessage} onChange={((e) => {
                setOutgoingMessage(e.target.value)
              })} onKeyDown={(e) => {
                if (e.key === "Meta") {
                  setMetaDown(true)
                }
                if (e.key === "Enter" && metaDown) {
                  handleSend()
                }
              }} onKeyUp={((e) => {
                if (e.key === "Meta") {
                  setMetaDown(false)
                }
              })} id="input" rows={3} className="w-full resize-none focus:outline-none px-0 text-sm font-medium text-gray-900 bg-white border-0 focus:ring-0" placeholder="Ask a question" required></textarea>
            </div>
            <div className="flex items-center justify-end px-2 pt-1 pb-2">
              <div className="flex relative pl-0 sm:pl-2">
                <Tooltip.Provider delayDuration={100}>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <button onClick={() => handleSend()} className={`text-sm flex gap-2 justify-center cursor-pointer select-none items-center align-middle py-2 pl-5 pr-3 ${buttonDisabled ? "bg-gray-500" : "bg-black"} ${highlighted ? "text-[#fce7ac]" : "text-white"} font-bold rounded-l-lg border-r-[1px] border-white border-solid`}>
                        {realButtonMode === "withpage" ? "Send with Page" : "Send"}
                        {/* <SendIcon fill={highlighted ? "#fce7ac" : "white"} /> */}
                        <div className="flex gap-1 items-center text-lg">
                        {/* <kbd className="-mb-[2px] p-2 rounded-md bg-gray-600">⌘</kbd> */}
                        <kbd className="px-1.5 py-[1px] text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">⌘ ↩</kbd>
                        {/* <p className="text-small font-light">+</p>
                        <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">↩</kbd> */}
                        </div>
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      {highlighted && <Tooltip.Content className="TooltipContent border-solid border-2 border-black bg-white rounded-md p-1" sideOffset={5}>
                          Will include highligted content!
                        <Tooltip.Arrow className="TooltipArrow fill-black" />
                      </Tooltip.Content>}
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      className={`text-sm flex gap-2 justify-center cursor-pointer select-none items-center align-middle py-2 px-3 ${
                        buttonDisabled ? 'bg-gray-500' : 'bg-black'
                      } text-white font-bold rounded-r-lg`}
                    >
                      <ChevronDown size={20} stroke="white" />
                    </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.Content>
                      <DropdownMenu.Item
                        className="!focus:ring-0 !focus:ring-offset-0"
                        onSelect={() => {
                          setTargetButtonMode("withpage")
                        }}
                      >
                        <div
                          className={`text-sm flex gap-2 justify-center cursor-pointer select-none items-center align-middle py-2 px-3 ${
                            !canDoPage ? 'bg-gray-200 text-gray-600' : 'bg-white cursor-pointer text-black'
                          } font-bold rounded-t-lg border-black border-t-[1px] border-l-[1px] border-r-[1px]`}
                        >
                          {canDoPage ? "With Page" : "Page Already Sent"}
                        </div>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        className="!focus:ring-0 !focus:ring-offset-0"
                        onSelect={() => {
                          setTargetButtonMode("plain")
                        }}
                      >
                        <div
                          className={`text-sm flex gap-2 justify-center select-none items-center align-middle py-2 px-3 ${
                            buttonDisabled ? 'bg-gray-200 text-gray-600' : 'bg-white cursor-pointer text-back'
                          } font-bold rounded-b-lg border-black border-b-[1px] border-l-[1px] border-r-[1px]`}
                        >
                          Without Page
                        </div>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Md({children}: any) {
  const [clicked, setClicked] = useState(false)
  return <ReactMarkdown
  components={{
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <div className="relative">
          <span onClick={() => {
            const childContent = node.children.map((c) => (c as any).value).join("")
            navigator.clipboard.writeText(childContent)
            setClicked(true)
            setTimeout(() => {
              setClicked(false)
            }, 1000)
          }} className={`absolute top-0 right-0 flex gap-1 justify-center align-middle items-center bg-white p-1 rounded-bl-lg ${clicked ? "text-gray-400" : "text-black"} ${clicked ? "cursor-default" : "cursor-pointer"}`}>
            <Copy size={12} />
            {clicked ? "Copied" : "Copy"}
          </span>
          <SyntaxHighlighter
            children={String(children).replace(/\n$/, '')}
            style={dracula as any}
            language={match[1]}
            PreTag="div"
            {...props}
          />
        </div>
      ) : (
        <code className={className + ` text-white bg-black rounded-lg p-1`} {...props}>
          {children}
        </code>
      )
    }
  }}
  className="overflow-y-scroll" children={children} />
}
