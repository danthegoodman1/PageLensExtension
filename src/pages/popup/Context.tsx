// ** React Imports
import { useState, createContext, useContext, useEffect } from 'react';
import { getModels, Model } from './models';

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
}
const AppContext = createContext<AppContextType | null>(null)

const AppContextProvider = ({ children }: { children: React.ReactNode }) => {

	const [view, setView] = useState<ViewType>("list chats")
	const [models, setModels] = useState<Model[]>([])
	const [activeChat, setActiveChat] = useState<ActiveChat | undefined>(undefined)

  async function loadStoredModels() {
    const stored = await getModels()
    setModels(stored)
  }

	return (
		<AppContext.Provider
			value={{
				view,
				setView,
				models,
				reloadModels: loadStoredModels,
				activeChat,
				setActiveChat
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
