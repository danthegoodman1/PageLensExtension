import { useEffect, useState } from 'react';
import Browser from 'webextension-polyfill';
import ListChats from './views/ListChats';
import { useApp } from './Context';
import NewModel from './views/NewModel';
import { getModels, StoredModel } from './models';

export default function Popup(): JSX.Element {

  const { view, setView } = useApp()

  const [models, setModels] = useState<StoredModel[]>([])

  useEffect(() => {
    loadStoredModels()
  }, [])

  async function loadStoredModels() {
    console.log("fetching stored models")
    const stored = await getModels()
    setModels(stored)
  }

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
  function handleNewModel() {
    setView("new model")
  }

  return (
    <div className="flex grow w-screen h-screen">
      {view === "list chats" && <ListChats onNewModel={handleNewModel} onSelectChat={handleOpenChat} onNewChat={handleNewChat} />}
      {view === "new model" && <NewModel onSetView={(v) => setView(v)} />}
    </div>
  );
}
