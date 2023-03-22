import React, { useEffect } from 'react';
import logo from '@assets/img/logo.svg';
import Browser from 'webextension-polyfill';

export default function Popup(): JSX.Element {

  const sendMsg = async () => {
    let queryOptions = { active: true, currentWindow: true };
    let tab = await Browser.tabs.query(queryOptions);
    console.log("tab", tab)
    Browser.tabs.sendMessage(tab[0].id!, "sent from popup")
  }

  return (
    <div className="absolute top-0 left-0 right-0 bottom-0 text-center h-full p-3 bg-gray-800">
      <header className="flex flex-col items-center justify-center text-white">
        <img src={logo} className="h-36 pointer-events-none animate-spin-slow" alt="logo" />
        <p>
          Edite <code>src/pages/popup/Popup.jsx</code> and save to reload.
        </p>
        <a
          className="text-blue-400"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React!
        </a>
        <p>Popup styled with TailwindCSS!</p>
        <button onClick={() => sendMsg()}>YEET</button>
      </header>
    </div>
  );
}
