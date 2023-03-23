// ** React Imports
import { useState, createContext, useContext } from 'react';

export type Platform = 'twitch' | 'multi';

export type ViewType = "list chats" | "new chat" | "chat" | "list models" | "add model"

// ** Create Context
export type AppContextType = {
	view: ViewType
	setView: (view: ViewType) => void
}
const AppContext = createContext<AppContextType | null>(null)

const AppContextProvider = ({ children }: { children: React.ReactNode }) => {

	const [view, setView] = useState<ViewType>("list chats")

	return (
		<AppContext.Provider
			value={{
				view,
				setView
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
