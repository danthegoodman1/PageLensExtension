import React, { useEffect } from 'react';
import logo from '@assets/img/logo.svg';
import Browser from 'webextension-polyfill';
import ListChats from './views/ListChats';

export default function Popup(): JSX.Element {

  const sendMsg = async () => {
    let queryOptions = { active: true, currentWindow: true };
    let tab = await Browser.tabs.query(queryOptions);
    console.log("tab", tab)
    const res = await Browser.tabs.sendMessage(tab[0].id!, "sent from popup")
    console.log("got response", res)
  }

  return (
    <div className="flex grow w-screen h-screen">
      <ListChats />
    </div>
  );
}
