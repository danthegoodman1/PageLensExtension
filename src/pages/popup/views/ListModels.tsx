import { ArrowLeft } from "react-feather"

export default function ListModels() {
  return (
    <div className="border-solid border-2 border-red-500 w-full flex flex-col p-1">
      <div className="flex flex-row">
        <div className="cursor-pointer flex items-center">
          <ArrowLeft size={20} fontWeight={900} />
          <p className="font-semibold text-lg text-[14px]">Go back</p>
        </div>
      </div>
      <p>hey</p>
    </div>
  )
}
