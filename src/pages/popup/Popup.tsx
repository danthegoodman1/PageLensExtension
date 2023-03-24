import { useEffect, useState } from 'react';
import Browser from 'webextension-polyfill';
import ListChats from './views/ListChats';
import { useApp } from './Context';
import NewModel from './views/NewModel';

export default function Popup(): JSX.Element {

  const { view, setView, models, activeChat, setActiveChat } = useApp()

  const sendMsg = async () => {
    let queryOptions = { active: true, currentWindow: true };
    let tab = await Browser.tabs.query(queryOptions);
    console.log("tab", tab)
    const res = await Browser.tabs.sendMessage(tab[0].id!, "sent from popup")
    console.log("got response", res)
  }

  function handleNewChat(modelName?: string) {
    if (models.length === 0) {
      setView("new model")
      return
    }
    setView("new chat")
  }

  function handleOpenChat(chatID?: string) {
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
      {view === "list chats" && <ListChats onNewModel={handleNewModel} onSelectChat={handleOpenChat} onNewChat={handleNewChat} />}
      {view === "new model" && <NewModel models={models} onSetView={(v) => setView(v)} />}
    </div>
  );
}
