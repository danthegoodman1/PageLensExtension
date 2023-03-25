import { ArrowLeft } from "react-feather"
import { useApp } from "../Context"

export default function ListModels() {

  const { view, setView, models, activeChat, setActiveChat } = useApp()

  return (
    <div className="w-full flex flex-col p-1">
      <div className="flex flex-row">
        <div className="cursor-pointer flex items-center">
          <ArrowLeft size={20} fontWeight={900} />
          <p className="font-semibold text-lg text-[14px]">Go home</p>
        </div>
      </div>
      <div className="w-full flex grow shrink-0 flex-col px-2 py-1 justify-between">
        <div>
          <div className="flex flex-row mb-4">
            <h1 className="text-2xl font-bold">Chat with</h1>
          </div>
        </div>
      </div>
    </div>
  )
}
