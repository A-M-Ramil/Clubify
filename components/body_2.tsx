"use client";
import React, { ReactNode } from "react";
import { motion } from "framer-motion";

export default function Body2() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 text-light">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end md:px-8">
        <h2 className="max-w-lg text-4xl font-bold md:text-5xl">
          Grow faster with our
          <span className="text-white"> all in one solution</span>
        </h2>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="whitespace-nowrap rounded-lg bg-purple-900 px-4 py-2 font-medium text-white shadow-xl transition-colors hover:bg-slate-700"
        >
          Learn more
        </motion.button>
      </div>
      <div className="mb-4 grid grid-cols-12 gap-4">
        <BounceCard className="text-gray-200 col-span-12 md:col-span-4">
          <CardTitle>Full Club Management</CardTitle>
          <div
            className="absolute bottom-0 left-4 right-4 top-32 translate-y-8 
      rounded-t-2xl bg-gradient-to-br from-violet-400 to-indigo-400 p-6 
      transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]"
          >
            <span className="block text-center text-2xl font-semibold text-indigo-50 md:text-2xl">
              Track members, roles, and activities
            </span>
          </div>
        </BounceCard>

        <BounceCard className="text-gray-200 col-span-12 md:col-span-8">
          <CardTitle>Smart Event Planning</CardTitle>
          <div
            className="absolute bottom-0 left-4 right-4 top-32 translate-y-8 
      rounded-t-2xl bg-gradient-to-br from-amber-400 to-orange-400 p-6 
      transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]"
          >
            <span className="block text-center text-lg font-semibold text-orange-50 md:text-2xl">
              Create events, manage signups, and notify members instantly.
            </span>
          </div>
        </BounceCard>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <BounceCard className="text-gray-200 col-span-12 md:col-span-8">
          <CardTitle>Role-Based Access</CardTitle>
          <div
            className="absolute bottom-0 left-4 right-4 top-32 translate-y-8 
      rounded-t-2xl bg-gradient-to-br from-green-400 to-emerald-400 p-6 
      transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]"
          >
            <span className="block text-center text-lg font-semibold text-black md:text-2xl">
              Assign permissions for presidents, treasurers, and sponsors.
            </span>
          </div>
        </BounceCard>

        <BounceCard className="text-gray-200 col-span-12 md:col-span-4">
          <CardTitle>Sponsorship Tools</CardTitle>
          <div
            className="absolute bottom-0 left-4 right-4 top-32 translate-y-8 
      rounded-t-2xl bg-gradient-to-br from-pink-400 to-red-400 p-6 
      transition-transform duration-[250ms] group-hover:translate-y-4 group-hover:rotate-[2deg]"
          >
            <span className="block text-center text-lg font-semibold text-red-50 md:text-2xl">
              Connect with sponsors and manage funding opportunities.
            </span>
          </div>
        </BounceCard>
      </div>
    </section>
  );
}

const BounceCard = ({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 0.95, rotate: "-1deg" }}
      className={`group relative min-h-[300px] cursor-pointer overflow-hidden rounded-2xl border border-secondary bg-primary p-8 ${className}`}
    >
      {children}
    </motion.div>
  );
};

const CardTitle = ({ children }: { children: ReactNode }) => {
  return (
    <h3 className="mx-auto text-center text-3xl font-semibold">{children}</h3>
  );
};
