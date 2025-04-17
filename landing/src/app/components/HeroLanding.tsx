// src/app/components/Hero.tsx
export default function HeroLanding() {
  return (
    <div className="w-full flex sm:flex-row flex-col pt-24 px-6 gap-6">
      {/* Left Column (3/5 width) */}
      <div className="sm:w-3/5 w-full flex flex-col gap-6">
        {/* Top Block with Image */}
        <div className="rounded-2xl shadow-md p-6 flex-1">
          <div className="relative w-full h-48 mb-4">
            <img
              src="https://i.imgur.com/yMDEaFh.png"
              alt="Compete - Win - Level Up"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
        </div>
        {/* Bottom Block */}
        <div className="bg-neutral-800 rounded-2xl shadow-md p-6 flex-1">
          <h2 className="text-lg font-semibold mb-2">Bottom Left Block</h2>
          <p className="text-sm">More brief content goes here...</p>
        </div>
      </div>

      {/* Right Block (2/5 width) */}
      <div className="sm:w-2/5 w-full flex flex-col gap-6">
        <div className="bg-neutral-800 rounded-2xl shadow-md p-6 flex-1">
          <h2 className="text-lg font-semibold mb-2">Right Block</h2>
          <p className="text-sm">Additional content...</p>
        </div>
      </div>
    </div>
  );
}
