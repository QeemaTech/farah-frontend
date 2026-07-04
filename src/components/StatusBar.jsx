function StatusBar() {
  return (
    <div className="h-[46px] relative shrink-0 w-[390px]">
      <div className="absolute inset-0 rounded-[24px]"></div>
      {/* Time */}
      <div className="absolute inset-[36.74%_81.34%_38.04%_10.83%]">
        <div className="text-xs text-gray-700 font-medium">9:41</div>
      </div>
      {/* Battery, WiFi, Signal icons would be positioned here */}
    </div>
  )
}

export default StatusBar
