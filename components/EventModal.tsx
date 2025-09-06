
"use client";
import React, { Dispatch, SetStateAction } from "react";
import useMeasure from "react-use-measure";
import {
  useDragControls,
  useMotionValue,
  useAnimate,
  motion,
} from "framer-motion";
import Countdown from "@/components/UI/countdown";
import { Button } from "./UI/button";

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  event: {
    id: string;
    title: string;
    description: string | null;
    startDate: string;
    location: string | null;
    club: {
      name: string;
      university: string;
      coverImage: string | null;
    };
    images: {
        url: string;
    }[];
  };
  globalRole: string | null;
}

const EventModal = ({ open, setOpen, event, globalRole }: Props) => {
  const [scope, animate] = useAnimate();
  const [drawerRef, { height }] = useMeasure();

  const y = useMotionValue(0);
  const controls = useDragControls();

  const handleClose = async () => {
    animate(scope.current, { opacity: [1, 0] });
    const yStart = typeof y.get() === "number" ? y.get() : 0;
    await animate("#drawer", { y: [yStart, height] });
    setOpen(false);
  };

  return (
    <>
      {open && (
        <motion.div
          ref={scope}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleClose}
          className="fixed inset-0 z-50 bg-neutral-950/70"
        >
          <motion.div
            id="drawer"
            ref={drawerRef}
            onClick={(e) => e.stopPropagation()}
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            transition={{ ease: "easeInOut" }}
            className="absolute bottom-0 h-[75vh] w-full overflow-hidden rounded-t-3xl bg-black"
            style={{ y }}
            drag="y"
            dragControls={controls}
            onDragEnd={() => {
              if (y.get() >= 100) {
                handleClose();
              }
            }}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
          >
            <div className="absolute left-0 right-0 top-0 z-10 flex justify-center bg-black p-4">
              <button
                onPointerDown={(e) => {
                  controls.start(e);
                }}
                className="h-2 w-14 cursor-grab touch-none rounded-full bg-neutral-700 active:cursor-grabbing"
              ></button>
            </div>

            <div className="relative z-0 h-full p-4 pt-12">
              <Countdown deadline={new Date(event.startDate).toISOString()} />

              <div className="flex gap-x-6 flex-col h-[30vh] !overflow-y-auto  no-scrollbar lg:flex-row lg:w-full lg:max-w-5xl mx-auto lg:mx-[20.3vw]">
                <div className="lg:w-1/2 p-4">
                  <h2 className="text-3xl font-bold text-white">
                    {event.title}
                  </h2>
                  <p className="text-neutral-400 mt-2  ">
                    {event.description}
                  </p>
                </div>
                <div className="pt-[4rem] lg:w-1/2 p-4 flex justify-center">
                  <img
                    src={event.images[0]?.url || event.club.coverImage || "/W.png"}
                    alt={event.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              </div>

                <div className="flex flex-row mt-3 justify-around md:justify-center gap-x-10 lg:mt-6 lg:w-full lg:max-w-5xl lg:mx-[20.3vw]  lg:space-y-0 lg:space-x-12 p-6 bg-zinc-900 rounded-xl shadow-md">
                    <div className="flex flex-col items-center lg:items-start space-y-4">
                        <div className="text-center lg:text-left">
                            <p className="text-zinc-400 text-sm font-medium">Club</p>
                            <p className="text-white text-lg font-bold">
                                {event.club.name}
                            </p>
                        </div>
                        <div className="text-center lg:text-left">
                            <p className="text-zinc-400 text-sm font-medium">University</p>
                            <p className="text-white text-lg font-bold">
                                {event.club.university}
                            </p>
                        </div>
                        {globalRole === "SPONSOR" && (
                            <Button>Sponsor Event</Button>
                        )}
                    </div>
                </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default EventModal;
