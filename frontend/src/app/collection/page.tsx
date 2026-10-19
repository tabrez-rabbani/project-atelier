import { Header, Footer, CollectionTemplate } from "@/components";

export const metadata = {
  title: "All Collections | MAISONÉ",
  description: "Explore our complete collection of luxury apparel, bags, accessories, and jewelry.",
};

export default function CollectionIndexPage() {
  return (
    <>
      <Header />
      <main>
        <CollectionTemplate title="All Products" category="all" />
      </main>
      <Footer />
    </>
  );
}
