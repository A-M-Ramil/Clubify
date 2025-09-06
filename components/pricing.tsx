"use client";
import React from "react";
import Card from "@/components/UI/pricing_card";

function Pricing() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 text-light">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end md:px-8">
        <h2 className="max-w-lg text-4xl font-bold md:text-5xl">
          Simple pricing for all
          <span className="text-white"> in one solution</span>
        </h2>
      </div>
      <div className="flex justify-center gap-4">
        <Card />
        <Card />
        <Card />
      </div>
    </main>
  );
}

export default Pricing;
