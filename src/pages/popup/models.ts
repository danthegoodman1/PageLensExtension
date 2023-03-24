import { useState } from "react"
import Browser from "webextension-polyfill"

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
  "gpt-4": {
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
  "gpt-3.5-turbo": {
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

export interface StoredModel {
  type: ModelType
  name: string
  created: number
  auth: string
  id: string
}

export async function getModels(): Promise<StoredModel[]> {
  const models: StoredModel[] = (await Browser.storage.local.get("models") as Record<string, StoredModel[]>)["models"]
  return models || []
}

export async function putModel(model: StoredModel) {
  const models: Record<string, StoredModel[]> = {
    "models": [...await getModels(), model]
  }
  await Browser.storage.local.set(models)
}

export async function removeModel(modelName: string) {
  const models: Record<string, StoredModel[]> = {
    "models": (await getModels()).filter((model) => model.name  !== modelName)
  }
  await Browser.storage.local.set(models)
}

export function useModels() {
  const [models, setModels] = useState<StoredModel[] | undefined>()

  return {
    models,
    loadModels: async () => {
      setModels(await getModels())
    },
    addModel: async (model: StoredModel) => {
      await putModel(model)
      setModels(await getModels())
    },
    removeModel: async (modelName: string) => {
      await removeModel(modelName)
      setModels(await getModels())
    }
  }
}
