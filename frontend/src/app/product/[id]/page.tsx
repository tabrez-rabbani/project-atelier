import type { Metadata } from "next";
import { Header, Footer, ProductDetail } from "@/components";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const formattedTitle = id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    title: `${formattedTitle} | MAISONÉ`,
    description: `Discover ${formattedTitle} at MAISONÉ. Handcrafted with luxury silhouettes and modern elegance.`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <>
      <Header />
      <main>
        <ProductDetail slug={id} />
      </main>
      <Footer />
    </>
  );
}
