import { ArrowLeft } from "react-feather"
import { ViewType } from "../Context"

export interface NewModelProps {
  onSetView: (view: ViewType) => void
}

export default function NewModel({ onSetView }: NewModelProps) {
  return (
    <div className="w-full flex flex-col p-2">
      <div className="flex flex-row">
        <div onClick={() => onSetView("list chats")} className="cursor-pointer flex items-center">
          <ArrowLeft size={20} fontWeight={900} />
          <p className="font-semibold text-lg text-[14px]">Go back</p>
        </div>
      </div>
      <div className="w-full flex grow shrink-0 flex-col justify-between">
        <div>
          <div className="flex flex-row mb-4">
            <h1 className="text-2xl font-bold">New Model</h1>
          </div>
        </div>
      </div>
    </div>
  )
}
