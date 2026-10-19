import type { Metadata } from "next";
import { Header, Footer, CollectionTemplate } from "@/components";

const POPULAR_CATEGORIES = [
  "dresses",
  "tops",
  "bottoms",
  "bags",
  "accessories",
  "jewelry",
  "beauty",
  "footwear",
  "trending",
  "women",
  "sale",
  "new-in",
];

export async function generateStaticParams() {
  return POPULAR_CATEGORIES.map((category) => ({
    category,
  }));
}

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const capitalized = category.charAt(0).toUpperCase() + category.slice(1);
  return {
    title: `${capitalized} Collection | MAISONÉ`,
    description: `Shop luxury ${category} designed with timeless elegance and modern craftsmanship.`,
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const { category } = await params;

  return (
    <>
      <Header />
      <main>
        <CollectionTemplate title={category} category={category} />
      </main>
      <Footer />
    </>
  );
}
