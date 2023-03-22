import { Browser } from "webextension-polyfill";

declare var chrome: Browser


try {
  chrome.runtime.onMessage.addListener((req: any, sender: any, resp: any) => {
    console.log("content script got message", req, " from ", sender)
    resp("hey :)")
  })
  console.log('content script loaded', chrome.runtime.onMessage);
} catch (e) {
  console.error(e);
}
