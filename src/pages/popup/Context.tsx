// ** React Imports
import { useState, createContext, useContext, useEffect } from 'react';
import { getModels, StoredModel } from './models';

export type Platform = 'twitch' | 'multi';

export type ViewType = "list chats" | "new chat" | "chat" | "list models" | "new model"

// ** Create Context
export type AppContextType = {
	view: ViewType
	setView: (view: ViewType) => void
	models: StoredModel[]
	reloadModels: () => Promise<void>
	activeChat: string | undefined
	setActiveChat: (chatID?: string) => void
}
const AppContext = createContext<AppContextType | null>(null)

const AppContextProvider = ({ children }: { children: React.ReactNode }) => {

	const [view, setView] = useState<ViewType>("list chats")
	const [models, setModels] = useState<StoredModel[]>([])
	const [activeChat, setActiveChat] = useState<string | undefined>(undefined)

  async function loadStoredModels() {
    console.log("fetching stored models")
    const stored = await getModels()
    setModels(stored)
  }

	useEffect(() => {
		loadStoredModels()
	}, [])

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
