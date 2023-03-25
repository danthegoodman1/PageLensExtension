import Browser from 'webextension-polyfill';
import ListChats from './views/ListChats';
import { useApp } from './Context';
import NewModel from './views/NewModel';
import Chat from './views/Chat';
import { ChatListItem, listChatSessions } from './chats';
import { useState } from 'react';

export default function Popup(): JSX.Element {

  const { view, setView, models, activeChat, setActiveChat } = useApp()
  const [chats, setChats] = useState<ChatListItem[]>([])

  const sendMsg = async () => {
    let queryOptions = { active: true, currentWindow: true };
    let tab = await Browser.tabs.query(queryOptions);
    console.log("tab", tab)
    const res = await Browser.tabs.sendMessage(tab[0].id!, "sent from popup")
    console.log("got response", res)
  }

  async function reloadChats() {
    const c = await listChatSessions()
    setChats(c)
  }

  function handleNewChat(modelInstanceID?: string) {
    if (models.length === 0) {
      setView("new model")
      return
    }
    if (modelInstanceID) {
      setActiveChat({
        modelInstanceID
      })
      setView("chat")
      return
    }
    setView("new chat")
  }

  function handleOpenChat(modelInstanceID: string, sessionID: string) {
    setActiveChat({
      modelInstanceID,
      sessionID
    })
    setView("chat")
  }

  function handleCloseChat() {
    setView("list chats")
    setActiveChat()
  }

  function handleNewModel() {
    setView("new model")
  }

  return (
    <div className="flex grow w-screen h-screen">
      {view === "list chats" && <ListChats chats={chats} reloadChats={reloadChats} onNewModel={handleNewModel} onSelectChat={handleOpenChat} onNewChat={handleNewChat} />}
      {view === "new model" && <NewModel models={models} onSetView={(v) => setView(v)} />}
      {view === "chat" && <Chat />}
    </div>
  );
}
