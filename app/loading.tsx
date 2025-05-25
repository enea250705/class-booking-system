export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-[100]">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20 opacity-75"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-primary/10 animate-pulse"></div>
        </div>
      </div>
      <h3 className="mt-6 text-base font-medium text-foreground/70">
        <span className="inline-block animate-pulse">Loading</span>
        <span className="inline-block ml-1 animate-[pulse_1.4s_0.2s_infinite]">.</span>
        <span className="inline-block animate-[pulse_1.4s_0.4s_infinite]">.</span>
        <span className="inline-block animate-[pulse_1.4s_0.6s_infinite]">.</span>
      </h3>
    </div>
  )
} 