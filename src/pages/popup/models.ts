import { useState } from "react";
import Browser from "webextension-polyfill";

export type ModelType = "gpt-3.5-turbo" | "gpt-4"

export interface StoredModel {
  type: ModelType
  name: string
  created: Date
  [key: string]: any
}

export async function getModels(): Promise<StoredModel[]> {
  console.log(Browser.storage)
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
