import React from 'react';
import { createRoot } from 'react-dom/client';
import '@pages/popup/index.css';
import '@assets/styles/tailwind.css';
import Popup from '@pages/popup/Popup';
import { AppContextProvider } from './Context';
import { ClerkProvider } from '@clerk/clerk-react';
import Clerk from '@clerk/clerk-js';
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://857e87b449a44aeba6cdf0338bd43853@o4504918524755968.ingest.sentry.io/4504918525607936",
  environment: import.meta.env.DEV ? "dev" : "prod"
})

function init() {
  const rootContainer = document.querySelector("#__root");
  if (!rootContainer) throw new Error("Can't find Popup root element");
  const root = createRoot(rootContainer);
  root.render(
    <AppContextProvider>
      <ClerkProvider Clerk={Clerk} publishableKey={import.meta.env.VITE_CLERK_PUB_KEY}>
        <Popup />
      </ClerkProvider>
    </AppContextProvider>
  );
}

init();
