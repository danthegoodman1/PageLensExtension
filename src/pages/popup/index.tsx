import { createRoot } from 'react-dom/client';
import '@pages/popup/index.css';
import '@assets/styles/tailwind.css';
import Popup from '@pages/popup/Popup';
import { ClerkProvider } from '@clerk/chrome-extension';
import * as Sentry from "@sentry/react";
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { AppContextProvider } from './Context';

Sentry.init({
  dsn: "https://857e87b449a44aeba6cdf0338bd43853@o4504918524755968.ingest.sentry.io/4504918525607936",
  environment: import.meta.env.DEV ? "dev" : "prod"
})

function init() {
  const rootContainer = document.querySelector("#__root");
  if (!rootContainer) throw new Error("Can't find Popup root element");
  const root = createRoot(rootContainer);

  root.render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
}

init();

function App() {
  const navigate = useNavigate()
  return (
    <ClerkProvider navigate={to => navigate(to)} publishableKey={import.meta.env.VITE_CLERK_PUB_KEY}>
      <AppContextProvider>
        <Popup />
      </AppContextProvider>
    </ClerkProvider>
  )
}
