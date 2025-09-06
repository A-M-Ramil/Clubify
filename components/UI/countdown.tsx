import { useAnimate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

type Units = "Day" | "Hour" | "Minute" | "Second";

interface ShiftingCountdownProps {
  deadline: string; // Accept deadline as a prop
}

const ShiftingCountdown = ({ deadline }: ShiftingCountdownProps) => {
  return (
    <div className="bg-black">
      <div className="mx-auto flex w-full max-w-5xl items-center bg-black">
        <CountdownItem unit="Day" text="days" deadline={deadline} />
        <CountdownItem unit="Hour" text="hours" deadline={deadline} />
        <CountdownItem unit="Minute" text="minutes" deadline={deadline} />
        <CountdownItem unit="Second" text="seconds" deadline={deadline} />
      </div>
    </div>
  );
};

const CountdownItem = ({
  unit,
  text,
  deadline,
}: {
  unit: Units;
  text: string;
  deadline: string;
}) => {
  const { ref, time } = useTimer(unit, deadline);

  return (
    <div className="flex h-24 w-1/4 flex-col items-center justify-center gap-1 border-r-[1px] border-neutral-700 font-mono md:h-36 md:gap-2">
      <div className="relative w-full overflow-hidden text-center">
        <span
          ref={ref}
          className="block text-2xl font-medium text-white md:text-4xl lg:text-6xl xl:text-7xl"
        >
          {time}
        </span>
      </div>
      <span className="text-xs font-light text-neutral-500 md:text-sm lg:text-base">
        {text}
      </span>
    </div>
  );
};

export default ShiftingCountdown;

const useTimer = (unit: Units, deadline: string) => {
  const [ref, animate] = useAnimate();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeRef = useRef(0);

  const [time, setTime] = useState(0);

  useEffect(() => {
    intervalRef.current = setInterval(handleCountdown, 1000);

    return () => clearInterval(intervalRef.current || undefined);
  }, [deadline]); // Dependency on deadline

  const handleCountdown = async () => {
    const end = new Date(deadline);
    const now = new Date();
    const distance = +end - +now;

    let newTime = 0;

    if (unit === "Day") {
      newTime = Math.floor(distance / DAY);
    } else if (unit === "Hour") {
      newTime = Math.floor((distance % DAY) / HOUR);
    } else if (unit === "Minute") {
      newTime = Math.floor((distance % HOUR) / MINUTE);
    } else {
      newTime = Math.floor((distance % MINUTE) / SECOND);
    }

    if (newTime !== timeRef.current) {
      // Exit animation
      await animate(
        ref.current,
        { y: ["0%", "-50%"], opacity: [1, 0] },
        { duration: 0.35 }
      );

      timeRef.current = newTime;
      setTime(newTime);

      // Enter animation
      await animate(
        ref.current,
        { y: ["50%", "0%"], opacity: [0, 1] },
        { duration: 0.35 }
      );
    }
  };

  return { ref, time };
};
