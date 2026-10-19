import type { NavLink } from "@/types";

export const navLinks: NavLink[] = [
  { label: "New In", href: "/collection/new-in" },
  {
    label: "Women",
    href: "/collection/women",
    children: [
      { label: "Dresses", href: "/collection/dresses" },
      { label: "Tops", href: "/collection/tops" },
      { label: "Bottoms", href: "/collection/bottoms" },
    ],
  },
  { label: "Bags", href: "/collection/bags" },
  { label: "Accessories", href: "/collection/accessories" },
  { label: "Sale", href: "/collection/sale" },
];
