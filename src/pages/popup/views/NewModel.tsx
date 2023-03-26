import * as Tooltip from "@radix-ui/react-tooltip"
import { useState } from "react"
import { ArrowLeft, Info } from "react-feather"
import ProgressBar from "../Components/ProgressBar"
import { ViewType } from "../Context"
import { ModelDefinitions, ModelType, putModel, Model } from "../models"

export interface NewModelProps {
  onSetView: (view: ViewType) => void
  models: Model[]
}

export default function NewModel({ onSetView, models }: NewModelProps) {

  const [addingModel, setAddingModel] = useState<ModelType | undefined>()

  function onAddModel() {
    onSetView("list chats")
  }

  return (
    <div className="w-full flex flex-col p-2">

      {!addingModel && <AvailableModelsList onSetView={onSetView} onModelClick={(modelType) => {
        setAddingModel(modelType)
      }} models={models} />}
      {!!addingModel && addingModel.startsWith("openai") && <AddOpenAIModel onAdded={() => onAddModel()} onBack={() => setAddingModel(undefined)} modelType={addingModel} />}
      {!!addingModel && addingModel.startsWith("anthropic") && <AddAnthropicModel onAdded={() => onAddModel()} onBack={() => setAddingModel(undefined)} modelType={addingModel} />}

    </div>
  )
}

function AvailableModelsList({ models, onModelClick, onSetView }: { models: Model[], onModelClick: (modelType: ModelType) => void, onSetView: (view: ViewType) => void }) {

  return (
    <>
      <div className="flex flex-row">
        <div onClick={() => onSetView("list chats")} className="cursor-pointer flex items-center">
          <ArrowLeft size={20} fontWeight={900} />
          <p className="font-semibold text-lg text-[14px]">Go back</p>
        </div>
      </div>

      <div className="w-full flex flex-col justify-between">
        <div>
          <div className="flex flex-row mb-4">
            <h1 className="text-2xl font-bold">New Model</h1>
          </div>
        </div>
      </div>
      <div className="flex flex-col mb-4 gap-1">
        {Array.from(Object.entries(ModelDefinitions)).map(([id, info], ind) => {
          return (
            <div onClick={() => onModelClick(id)} key={ind} className="cursor-pointer flex flex-row mb-2 border-solid border-black border-2 rounded-md px-2 py-3 justify-between items-start gap-2">
              <div className="flex flex-row items-center">
                <img src={info.image} className="h-[42px] w-[42px] rounded-md" />
                <div className="ml-2 flex flex-col shrink min-w-0 justify-self-start self-start">
                  <p className="text-lg text-black truncate font-bold w-full">
                    {info.name}
                  </p>
                </div>
              </div>

              <div className="flex flex-col h-full w-20 justify-start items-start">
                <div className="flex flex-row justify-start items-center align-middle gap-1">
                  <p className="font-medium">Capability</p>
                  <Tooltip.Provider delayDuration={300}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <Info color="black" size={12} strokeWidth={2} />
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content className="TooltipContent border-solid border-2 border-black bg-white rounded-md p-1" sideOffset={5}>
                          <div>
                            <p className="font-medium">Reasoning</p>
                            <ProgressBar perc={info.ratings.reasoning / 10} />
                            <p className="font-medium">Code</p>
                            <ProgressBar perc={info.ratings.code / 10} />
                            <p className="font-medium">Summarization</p>
                            <ProgressBar perc={info.ratings.summarization / 10} />
                            <p className="font-medium">Conciseness</p>
                            <ProgressBar perc={info.ratings.conciseness / 10} />
                          </div>
                          <Tooltip.Arrow className="TooltipArrow fill-black" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                </div>
                <ProgressBar perc={(info.ratings.code + info.ratings.summarization + info.ratings.reasoning + info.ratings.conciseness) / 40} />
                <p className="font-medium">Speed</p>
                <ProgressBar perc={info.ratings.speed / 10} />
                <p className="font-medium">Cost</p>
                <ProgressBar perc={info.ratings.cost / 10} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  )

}

function AddOpenAIModel(props: { modelType: ModelType, onBack: () => void, onAdded: () => void }) {
  const modelDef = ModelDefinitions[props.modelType]
  const [auth, setAuth] = useState("")
  const [name, setName] = useState("")

  async function handleAdd() {
    await putModel({
      auth,
      name,
      id: props.modelType
    })
    props.onAdded()
  }

  return (
    <>
      <div className="flex flex-row">
        <div onClick={() => props.onBack()} className="cursor-pointer flex items-center">
          <ArrowLeft size={20} fontWeight={900} />
          <p className="font-semibold text-lg text-[14px]">Go back</p>
        </div>
      </div>

      <div className="w-full flex flex-col justify-between">
        <div>
          <div className="flex flex-row mb-1">
            <h1 className="text-2xl font-bold">Add {modelDef.name}</h1>
          </div>
        </div>
      </div>
      <div className="flex flex-col mb-1 gap-2 items-start">
        <p className="text-base text-black truncate w-full font-medium">
          Nickname
        </p>
        <input value={name} onChange={(e) => {
            setName(e.target.value)
          }} type="text" id="table-search" className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block w-full p-2" placeholder="Skynet v0.0.1" />
        <p className="text-base text-black truncate w-full font-medium">
          OpenAI API Key
        </p>
        <input value={auth} onChange={(e) => {
            setAuth(e.target.value)
          }} type="password" id="table-search" className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block w-full p-2" placeholder="Your API Key" />
        <button onClick={() => handleAdd()} className="text-sm py-2 px-5 bg-black text-white font-semibold rounded-lg">
          Add
        </button>
      </div>
    </>
  )
}

function AddAnthropicModel(props: { modelType: ModelType, onBack: () => void, onAdded: () => void }) {
  const modelDef = ModelDefinitions[props.modelType]
  const [auth, setAuth] = useState("")
  const [name, setName] = useState("")

  async function handleAdd() {
    await putModel({
      auth,
      name,
      id: props.modelType
    })
    props.onAdded()
  }

  return (
    <>
      <div className="flex flex-row">
        <div onClick={() => props.onBack()} className="cursor-pointer flex items-center">
          <ArrowLeft size={20} fontWeight={900} />
          <p className="font-semibold text-lg text-[14px]">Go back</p>
        </div>
      </div>

      <div className="w-full flex flex-col justify-between">
        <div>
          <div className="flex flex-row mb-1">
            <h1 className="text-2xl font-bold">Add {modelDef.name}</h1>
          </div>
        </div>
      </div>
      <div className="flex flex-col mb-1 gap-2 items-start">
        <p className="text-base text-black truncate w-full font-medium">
          Nickname
        </p>
        <input value={name} onChange={(e) => {
            setName(e.target.value)
          }} type="text" id="table-search" className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block w-full p-2" placeholder="Skynet v0.0.1" />
        <p className="text-base text-black truncate w-full font-medium">
          Anthropic API Key
        </p>
        <input value={auth} onChange={(e) => {
            setAuth(e.target.value)
          }} type="password" id="table-search" className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block w-full p-2" placeholder="Your API Key" />
        <button onClick={() => handleAdd()} className="text-sm py-2 px-5 bg-black text-white font-semibold rounded-lg">
          Add
        </button>
      </div>
    </>
  )
}
