import { Header, Hero, Footer } from "@/components";
import HomeSections from "@/components/home/HomeSections/HomeSections";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HomeSections />
      </main>
      <Footer />
    </>
  );
}