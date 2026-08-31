 "use client";

export default function Loader() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
      <div className="bg-white p-5 rounded-xl shadow-lg flex flex-col items-center gap-3">
        
        <div className="w-10 h-10 border-4 border-[#103BB5] border-t-transparent rounded-full animate-spin" />

        <p className="text-sm text-gray-600">Please wait...</p>
      </div>
    </div>
  );
}