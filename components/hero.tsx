"use client";
import Beams from "./UI/beams";

export default function Hero() {
  return (
    <main className="relative w-screen h-screen flex items-center justify-center text-center overflow-hidden">
      {/* Background beams */}
      <div className="absolute inset-0 -z-10">
        <Beams
          beamWidth={2.5}
          beamHeight={20}
          beamNumber={12}
          lightColor="#ffffff"
          speed={2}
          noiseIntensity={1.75}
          scale={0.2}
          rotation={30}
        />
      </div>

      {/* Foreground content */}
      <div className="flex flex-col gap-4 items-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white">
          Your Club, Organized Smarter
        </h1>
        <p className="text-lg md:text-xl text-gray-200 max-w-2xl">
          Say goodbye to endless spreadsheets, messy chats, and missed updates.
        </p>
        <div className="flex gap-4 mt-6">
          <a href="/sign-up">
            <button className="px-6 py-3  rounded-2xl bg-white/90 text-black font-medium hover:bg-primary hover:text-white">
              Join Us as a Member
            </button>
          </a>
          <a href="/sign-up/sponsor">
            <button className="px-6 py-3 rounded-2xl bg-black/50 text-white font-medium hover:bg-light/70">
              Join Us as a Sponsor
            </button>
          </a>
        </div>
      </div>
    </main>
  );
}
