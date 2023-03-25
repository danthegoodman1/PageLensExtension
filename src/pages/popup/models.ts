import { useState } from "react"
import Browser from "webextension-polyfill"
import { APIReq } from "./api"

export const ModelTypes = ["gpt-3.5-turbo", "gpt-4"]
export type ModelType = typeof ModelTypes[number]
export interface ModelDefinition {
  name: string
  image: string,
  ratings: {
    reasoning: number
    speed: number
    conciseness: number
    cost: number
    code: number
    summarization: number
  }
}
export const ModelDefinitions: {[key: ModelType]: ModelDefinition} = {
  "openai_gpt-4": {
    image: "/image/gpt-4.png",
    name: "GPT-4",
    ratings: {
      reasoning: 9,
      speed: 4,
      conciseness: 8,
      cost: 10,
      code: 9,
      summarization: 9
    }
  },
  "openai_gpt-3.5-turbo": {
    image: "/image/gpt-35.png",
    name: "GPT-3.5 Turbo",
    ratings: {
      reasoning: 6,
      speed: 10,
      conciseness: 4,
      cost: 3,
      code: 6,
      summarization: 7
    }
  },
}

export interface Model {
  user_id: string
  instance_id: string
  model_id: string
  name: string
  disabled: boolean
  auth: string
  meta?: Record<string, unknown>
  created_at: Date
  updated_at: Date
}

export async function getModels(): Promise<Model[]> {
  console.log("getting models")
  const models: { models: Model[] } = await (await APIReq("/models", "GET")).json()
  return models.models || []
}

interface PutModelReq {
  id: string
  auth: string
  name: string
}

export async function putModel(model: PutModelReq) {
  await APIReq("/models", "POST", JSON.stringify(model))
}

export async function removeModel(modelName: string) {
  const models: Record<string, Model[]> = {
    "models": (await getModels()).filter((model) => model.name  !== modelName)
  }
  await Browser.storage.local.set(models)
}

export function useModels() {
  const [models, setModels] = useState<Model[] | undefined>()

  return {
    models,
    loadModels: async () => {
      setModels(await getModels())
    },
    addModel: async (model: PutModelReq) => {
      await putModel(model)
      setModels(await getModels())
    },
    removeModel: async (modelName: string) => {
      await removeModel(modelName)
      setModels(await getModels())
    }
  }
}
