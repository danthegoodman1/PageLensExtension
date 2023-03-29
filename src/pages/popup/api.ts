import Browser from "webextension-polyfill"

const apiURL = import.meta.env.VITE_API_URL

export async function APIReq(path: string, method: "GET" | "POST" | "DELETE" | "PUT", body?: string) {
  const r = await Browser.storage.local.get("email") // TODO: REMOVE ME WHEN WE GET TOKENS
  const email = r["email"]
  if (!email) {
    throw new Error("missing email")
  }
  const init: RequestInit = {
    headers: {
      "content-type": "application/json",
      "x-email": email,
      "x-version": __APP_VERSION__
    },
    method
  }
  if (body) {
    init.body = body
  }
  const res = await fetch(apiURL + path, init)
  if (res.status >= 300) {
    throw new Error(`Request high status code '${res.status}': ${await res.text()}`)
  }
  return res
}

export async function getCurrentVersion() {
  const r = await APIReq("/extension/version", "GET")
  return (await r.json()).current
}
