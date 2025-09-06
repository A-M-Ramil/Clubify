
"use client";
import { Button } from "@/components/UI/button";
import { useRouter } from "next/navigation";

const JoinUsPage = () => {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center text-center p-4">
            <div className="max-w-2xl">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                    Join the Community
                </h1>
                <p className="mt-6 text-lg text-gray-300">
                    Discover clubs, participate in events, and connect with fellow students. Your university experience starts here.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                    <Button onClick={() => router.push('/sign-up')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg text-lg">
                        Sign Up
                    </Button>
                    <Button onClick={() => router.push('/sign-in')} className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg text-lg">
                        Sign In
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default JoinUsPage;
