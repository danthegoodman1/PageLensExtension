const apiURL = "http://localhost:8080"

export async function APIReq(path: string, method: "GET" | "POST" | "DELETE" | "PUT", body?: string) {
  const init: RequestInit = {
    headers: {
      "content-type": "application/json"
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
