// ** React Imports
import { useState, createContext, useContext, useEffect } from 'react';
import Browser from 'webextension-polyfill';
import { getModels, Model } from './models';
import { useAuth } from '@clerk/clerk-react';

export type Platform = 'twitch' | 'multi';

export type ViewType = "list chats" | "new chat" | "chat" | "list models" | "new model"

export interface ActiveChat {
	modelInstanceID: string
	sessionID?: string
}

// ** Create Context
export type AppContextType = {
	view: ViewType
	setView: (view: ViewType) => void
	models: Model[]
	reloadModels: () => Promise<void>
	activeChat: ActiveChat | undefined
	setActiveChat: (chat?: ActiveChat) => void
	targetBtnMode: "plain" | "withpage"
	setTargetButtonMode: (btnMode: AppContextType["targetBtnMode"]) => void
}
const AppContext = createContext<AppContextType | null>(null)

const AppContextProvider = ({ children }: { children: React.ReactNode }) => {

	const [view, setView] = useState<ViewType>("list chats")
	const [models, setModels] = useState<Model[]>([])
	const [activeChat, setActiveChat] = useState<ActiveChat | undefined>(undefined)
	const [targetBtnMode, setTargetBtnMode] = useState<AppContextType["targetBtnMode"]>("withpage")
	const { getToken } = useAuth()

  async function loadStoredModels() {
		const token = await getToken()
		if (!token) {
			throw new Error("missing token!")
		}
    const stored = await getModels(token)
    setModels(stored)
  }

	useEffect(() => {
		(async () => {
			// Load the button mode
			const existingMode = (await Browser.storage.local.get("btn mode"))["btn mode"]
			if (existingMode) {
				setTargetBtnMode(existingMode)
			}
		})()
	}, [])

	return (
		<AppContext.Provider
			value={{
				view,
				setView,
				models,
				reloadModels: loadStoredModels,
				activeChat,
				setActiveChat,
				targetBtnMode,
				setTargetButtonMode: (btnMode) => {
					Browser.storage.local.set({"btn mode": btnMode})
					setTargetBtnMode(btnMode)
				}
			}}
		>
			{children}
		</AppContext.Provider>
	);
};

export const useApp = (): AppContextType => {
	const context = useContext(AppContext as unknown as React.Context<AppContextType | undefined>);
	if (!context) {
		throw Error('useAppContext: Seems you forgot to wrap your app in `<AppContextProvider />`');
	}

	return context;
};

const ThemeContext = AppContextProvider;
export { AppContext, AppContextProvider, ThemeContext };
