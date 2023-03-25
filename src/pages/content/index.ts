import { Browser } from "webextension-polyfill";

declare var chrome: Browser

export interface PageRequest {
  type: "selection" | "page content"
}

export interface PageResponse {
  selection?: string
  pageContent?: string
}

try {
  console.log("content script loaded")
  chrome.runtime.onMessage.addListener((req: PageRequest, sender: any, resp: (r: PageResponse) => void) => {
    switch (req.type) {
      case "page content":
        resp({
          pageContent: document.body.innerText
        })
        return
      case "selection":
        // Check selection
        resp({
          selection: window.getSelection()?.toString()
        })
        return
    }
  })
} catch (e) {
  console.error(e);
}
