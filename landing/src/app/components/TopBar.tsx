export default function TopBar() {
  return (
    <header className="w-full h-16 text-white flex justify-between items-center px-6 fixed top-0 left-0 z-10">
      <div className="text-3xl font-bold tracking-widest">
        Retro eSports
      </div>
      <div>
        <button className="px-4 py-2 rounded-md border border-gray-600 bg-gray-900 hover:bg-gray-800 hover:border-pink-500 transition-all text-sm tracking-wide">
          Log in
        </button>
      </div>
    </header>
  );
}
