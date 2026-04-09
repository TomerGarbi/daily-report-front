interface DailyReportLogoProps {
  className?: string;
}

export default function DailyReportLogo({ className = "" }: DailyReportLogoProps) {
  return (
    <div className={`flex items-center space-x-3 lg:space-x-4 ${className}`}>
      {/* Calendar Icon */}
      <div className="relative">
        <div className="w-10 h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg shadow-lg">
          <div className="w-full h-2 lg:h-3 xl:h-3 bg-gray-800 rounded-t-lg"></div>
          <div className="absolute -top-1 left-2 w-1 h-3 lg:h-4 xl:h-5 bg-gray-700 rounded-full"></div>
          <div className="absolute -top-1 right-2 w-1 h-3 lg:h-4 xl:h-5 bg-gray-700 rounded-full"></div>
          <div className="flex flex-col items-center justify-center h-full pt-1">
            <div className="grid grid-cols-3 gap-0.5 lg:gap-1">
              <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-white rounded-sm opacity-70"></div>
              <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-white rounded-sm opacity-70"></div>
              <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-white rounded-sm opacity-70"></div>
              <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-white rounded-sm"></div>
              <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-orange-200 rounded-sm"></div>
              <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 bg-white rounded-sm opacity-70"></div>
            </div>
            <div className="mt-0.5 lg:mt-1">
              <div className="text-xs lg:text-sm xl:text-base font-bold text-white">
                {new Date().getDate()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logo Text */}
      <div className="flex flex-col">
        <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 whitespace-nowrap leading-tight">
          דוח יומי
        </h1>
        <div className="flex items-center space-x-1">
          <div className="w-4 lg:w-6 xl:w-8 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></div>
          <div className="w-2 lg:w-3 xl:w-4 h-0.5 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
