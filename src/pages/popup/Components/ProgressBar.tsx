export default function ProgressBar({ perc }: { perc: number }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div className="bg-black h-2.5 rounded-full" style={{
        width: `${Math.trunc(perc*100)}%`
      }}></div>
    </div>
  )
}
