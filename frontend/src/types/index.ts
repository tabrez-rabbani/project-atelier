export interface Price {
  amount: number;
  currency: string;
}

export interface ProductColor {
  name: string;
  hex: string;
  images: string[];
}

export interface Product {
  _id: string;
  title: string;
  slug: string;
  price: Price;
  originalPrice?: Price;
  description: string;
  material?: string;
  deliveryInfo?: string;
  category: string;
  colors: ProductColor[];
  sizes: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isNewIn?: boolean;
  isFeatured?: boolean;
  admin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  image?: string;
}

export interface NavLink {
  label: string;
  href: string;
  children?: NavLink[];
}
