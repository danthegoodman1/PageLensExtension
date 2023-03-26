import { useEffect, useState } from "react"
import { Search, PlusCircle } from "react-feather"
import * as Tooltip from '@radix-ui/react-tooltip'
import { ModelDefinitions } from "../models"
import { useApp } from "../Context"
import { ChatListItem, listChatSessions } from "../chats"

export interface ListChatsProps {
  onSelectChat: (modelInstanceID: string, sessionID: string) => void
  onNewChat: (modelID?: string) => void
  onNewModel: () => void
  reloadChats: () => void
  chats: ChatListItem[]
}

export default function ListChats({ onNewChat, onSelectChat, onNewModel, reloadChats, chats }: ListChatsProps) {

  const [search, setSearch] = useState("")

  const { models, reloadModels, setActiveChat } = useApp()

  useEffect(() => {
    reloadModels()
    reloadChats()
    setActiveChat(undefined)
  }, [])

  return (
    <div className="w-full flex grow shrink-0 flex-col px-2 py-1 justify-between">
      <div>

        <div className="flex flex-row mb-4">
          <h1 className="text-2xl font-bold">Chats</h1>
        </div>

        {/* Search Bar */}
        <div className="flex flex-row mb-4 relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={16} className="text-black" />
          </div>
          <input value={search} onChange={(e) => {
            setSearch(e.target.value)
          }} type="text" id="table-search" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block w-full pl-10 p-2.5" placeholder="Search for chats" />
        </div>

        {/* Quick start chat */}
        <div className="flex flex-row mb-4 items-center align-middle gap-2">
          <Tooltip.Provider delayDuration={300}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button onClick={() => onNewModel()} className="IconButton">
                  <PlusCircle size={48} className="text-black cursor-pointer" strokeWidth={1} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="TooltipContent border-solid border-2 border-black bg-white rounded-md p-1" sideOffset={5}>
                  Add new model
                  <Tooltip.Arrow className="TooltipArrow fill-black" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>

          {models.map((model) => {
            return (
              <Tooltip.Provider delayDuration={300}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button onClick={() => onNewChat(model.instance_id)} className="IconButton">
                      <img src={ModelDefinitions[model.model_id].image} className="h-[42px] w-[42px] rounded-md" />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="TooltipContent border-solid border-2 border-black bg-white rounded-md p-1" sideOffset={5}>
                      Chat with {model.name}
                      <Tooltip.Arrow className="TooltipArrow fill-black" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            )
          })}
        </div>

        {/* Chats list */}
        <div className="flex flex-col mb-4 gap-1">

          {chats.map((chat) => {
            return (
              <div onClick={() => {
                onSelectChat(chat.session.model_instance_id, chat.session.id)
              }} className="cursor-pointer flex flex-row mb-2 border-solid border-black border-2 rounded-md px-2 py-3 justify-start items-center gap-2">
                <img src={ModelDefinitions[chat.session.model_id].image} className="h-[42px] w-[42px] rounded-md" />
                <div className="flex flex-col shrink min-w-0">
                  <p className="text-xs text-gray-500 truncate w-full"><strong className="font-semibold">{new Date(chat.session.created_at).toDateString().split(" ").slice(1, 3).join(" ")}</strong> - {chat.session.title || chat.session.url}</p>
                  <p className="text-sm truncate w-full text-gray-600">{chat.message && <strong className="font-bold">{chat.message?.author === "user" ? "user" : models.find((m) => m.instance_id === chat.session.model_instance_id)?.name}</strong>}: {chat.message ? chat.message.message.slice(0, 75) : "(no messages)"}</p>
                </div>
              </div>
            )
          })}
          {/* <div className="cursor-pointer  flex flex-row mb-2 border-solid border-black border-2 rounded-md px-2 py-3 justify-start items-center gap-2">
            <div className="h-[42px] w-[42px] rounded-xl bg-orange-500 shrink-0"></div>
            <div className="flex flex-col shrink min-w-0">
              <p className="text-xs text-gray-500 truncate w-full"><strong className="font-semibold">Mar 23rd</strong> - {'https://lightning.ai/docs/pytorch/stable/starter/blah/blah/blahfefee'}</p>
              <p className="text-sm truncate w-full text-gray-600">Blah blah blah Blah blah blah Blah blah blah Blah blah blahBlah blah blahBlah blah blah </p>
            </div>
          </div> */}

        </div>
      </div>

      <div id="me" className=" cursor-pointer flex flex-row mb-2 rounded-md p-2 justify-center items-center gap-2 justify-self-end place-items-end border-solid border-black border-2" onClick={() => onNewChat()}>
        <PlusCircle size={32} className="text-black cursor-pointer" strokeWidth={1.5} />
        <p className="text-xl font-medium">New chat</p>
      </div>

    </div>
  )
}
