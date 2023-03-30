import Browser from 'webextension-polyfill';
import { useEffect, useState } from 'react';

import ListChats from './views/ListChats';
import { useApp } from './Context';
import NewModel from './views/NewModel';
import Chat from './views/Chat';
import { ChatListItem, listChatSessions } from './chats';
import { SignedIn, SignedOut, SignIn, SignUp } from '@clerk/clerk-react';
import PulseLoader from 'react-spinners/PulseLoader';
import { getCurrentVersion } from './api';

export default function Popup(): JSX.Element {

  const { view, setView, models, activeChat, setActiveChat, reloadModels } = useApp()
  const [chats, setChats] = useState<ChatListItem[] | undefined>(undefined)
  const [email, setEmail] = useState("")
  const [emailInput, setEmailInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [showSignUp, setShowSignUp] = useState(false)
  const [disabled, setDisabled] = useState(false)

  const sendMsg = async () => {
    let queryOptions = { active: true, currentWindow: true };
    let tab = await Browser.tabs.query(queryOptions);
    const res = await Browser.tabs.sendMessage(tab[0].id!, "sent from popup")
  }

  async function handleEmailLogin() {
    // Check if the email is allowed
    setEmailInput("")
    const res = await fetch(import.meta.env.VITE_API_URL + "/temp/check_email", {
      headers: {
        "content-type": "application/json"
      },
      method: "POST",
      body: JSON.stringify({
        email: emailInput
      })
    })
    console.log(res.status, await res.text())
    if (res.status >= 300) {
      return
    }
    // Persist it locally if so
    await Browser.storage.local.set({
      "email": emailInput
    })
    setEmail(emailInput)
  }

  useEffect(() => {
    (async () => {
      const res = await Browser.storage.local.get("email")
      if (res["email"]) {
        console.log("found local email")
        setEmail(res["email"])
      }
    })()
    console.log("using extension version:", __APP_VERSION__)
  }, [])

  useEffect(() => {
    (async () => {
      try {
        await reloadModels()
        const chats = await reloadChats()
        if (chats) {
          const tabs = await Browser.tabs.query({active: true, lastFocusedWindow: true})
          const c = chats.find((c) => c.session.url.split("?")[0] === tabs[0].url!.split('?')[0])
          if (tabs[0] && tabs[0].url && !!c) {
            setActiveChat({
              modelInstanceID: c.session.model_instance_id,
              sessionID: c.session.id
            })
            setView("chat")
          }
        }
      } catch (error) {
        throw error
      } finally {
        setLoading(false)
      }
    })()
  }, [email])

  useEffect(() => {
    if (view === "list chats" && !loading) {
      reloadChats()
      reloadModels()
    }
  }, [view])

  async function reloadChats() {
    const c = await listChatSessions()
    setChats(c)
    return c
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

  function handleNewModel() {
    setView("new model")
  }

  return (
    <div className="flex flex-col grow w-screen h-screen overflow-y-scroll">
      {/* <SignedIn> */}
      {loading && <>
        <div className='w-full h-full flex flex-col justify-center items-center align-middle'>
          <p>Loading <PulseLoader
                color={"black"}
                loading={true}
                size={8}
                aria-label="Loading Spinner"
                data-testid="loader"
              /></p>
        </div>
      </>}
      {!!email && !loading && <>
        <VersionCheck />
        {view === "list chats" && <ListChats chats={chats} reloadChats={reloadChats} onNewModel={handleNewModel} onSelectChat={handleOpenChat} onNewChat={handleNewChat} />}
        {view === "new model" && <NewModel models={models} onSetView={(v) => setView(v)} />}
        {view === "chat" && <Chat session={chats?.find((c) => c.session.id === activeChat?.sessionID)?.session} />}
      </>}
      {/* </SignedIn> */}

      {/* <SignedOut>
        <div className="flex flex-col gap-4 w-screen h-screen justify-center items-center align-middle">
            {!showSignUp && <>
              <SignIn appearance={{
                elements: {
                  footerAction__signIn: "hidden",
                  formButtonPrimary: "bg-black text-white hover:border-solid hover:border-2 hover:bg-white hover:text-black hover:border-black"
                }
              }} afterSignInUrl="#" />
              <button onClick={() => setShowSignUp(true)} className='font-medium text-black no-underline'>No account? Sign up</button>
            </>}
            {showSignUp && <>
              <SignUp afterSignUpUrl="#" appearance={{
                elements: {
                  footerAction__signUn: "hidden",
                  formButtonPrimary: "bg-black text-white hover:border-solid hover:border-2 hover:bg-white hover:text-black hover:border-black"
                }
              }} />
              <button onClick={() => setShowSignUp(false)} className='font-medium text-black no-underline'>Already have an account? Sign in</button>
            </>}
          </div>
        </SignedOut> */}

        {!email && <div>
          <input value={emailInput} onChange={(e) => {
            setEmailInput(e.target.value)
          }} type="email" id="table-search" className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block w-full p-2.5" placeholder="Email" />
          <button disabled={disabled} onClick={() => handleEmailLogin()} className={`text-sm flex gap-2 justify-center cursor-pointer select-none items-center align-middle py-2 px-5 ${disabled ? "bg-gray-500" : "bg-black"} text-white font-bold rounded-lg border-white border-solid`}>
            Login
          </button>
        </div>}
    </div>
  );
}

function VersionCheck() {
  const [currentVersion, setCurrentVersion] = useState<string | undefined>()

  useEffect(() => {
    (async () => {
      if (BUILD_MODE === "opensource") {
        const version = await getCurrentVersion()
        const myParts = __APP_VERSION__.split(".")
        const currentParts = version.split(".")
        // God tier semver checks
        if (
          (myParts[0] < currentParts[0])
          || (myParts[0] === currentParts[0] && myParts[1] < currentParts[1])
          || (myParts[0] === currentParts[0] && myParts[1] === currentParts[1] && myParts[2] < currentParts[2])
          ) {
          setCurrentVersion(version)
        }
      }
    })()
  })

  return (
    <>
      {currentVersion && <div className='w-full p-4 bg-orange-700'>
        <p className='text-white font-semibold'>
          Version <strong className='font-bold'>{currentVersion}</strong> available, you are running <strong className='font-bold'>{__APP_VERSION__}</strong>. Rebuild and update to ensure compatibility.
        </p>
      </div>}
    </>
  )
}
