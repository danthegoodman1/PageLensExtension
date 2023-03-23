import { ArrowLeft } from "react-feather"

export default function ListModels() {
  return (
    <div className="w-full flex flex-col p-1">
      <div className="flex flex-row">
        <div className="cursor-pointer flex items-center">
          <ArrowLeft size={20} fontWeight={900} />
          <p className="font-semibold text-lg text-[14px]">Go back</p>
        </div>
      </div>
      <div className="w-full flex grow shrink-0 flex-col px-2 py-1 justify-between">
        <div>
          <div className="flex flex-row mb-4">
            <h1 className="text-2xl font-bold">List Models</h1>
          </div>
        </div>
      </div>
    </div>
  )
}
