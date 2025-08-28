import Image from "next/image";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import Body1 from "@/components/body_1";
import Pricing from "@/components/pricing";
import Body2 from "@/components/body_2";
import Footer from "@/components/footer";
import Faq from "@/components/faq";

export default function Home() {
  return (
    <main className="">
      <Navbar />
      <Hero />
      <Body1 />
      <Body2 />
      <Pricing />
      <Faq />
      <Footer />
    </main>
  );
}
