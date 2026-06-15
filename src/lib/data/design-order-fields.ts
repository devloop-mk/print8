import type { DesignCategory } from "@/lib/data/catalog";

export type DesignOrderFieldId =
  | "fullName"
  | "companyName"
  | "jobTitle"
  | "phone"
  | "email"
  | "website"
  | "address"
  | "coupleNames"
  | "eventDate"
  | "venue"
  | "celebrantName"
  | "restaurantName"
  | "additionalInfo"
  | "frontHeadline"
  | "backHeadline";

export const categoryOrderFields: Record<
  DesignCategory,
  DesignOrderFieldId[]
> = {
  "business-cards": [
    "fullName",
    "companyName",
    "jobTitle",
    "phone",
    "email",
    "website",
    "address",
  ],
  wedding: [
    "coupleNames",
    "eventDate",
    "venue",
    "phone",
    "email",
    "additionalInfo",
  ],
  birthday: [
    "celebrantName",
    "eventDate",
    "venue",
    "phone",
    "additionalInfo",
  ],
  menus: [
    "restaurantName",
    "phone",
    "address",
    "website",
    "email",
    "additionalInfo",
  ],
  general: ["fullName", "phone", "email", "additionalInfo"],
};

export const requiredOrderFields: Record<
  DesignCategory,
  DesignOrderFieldId[]
> = {
  "business-cards": ["fullName", "phone"],
  wedding: ["coupleNames", "eventDate", "phone"],
  birthday: ["celebrantName", "eventDate", "phone"],
  menus: ["restaurantName", "phone"],
  general: ["fullName", "phone"],
};

export const designCategoryPrices: Record<DesignCategory, number> = {
  "business-cards": 500,
  wedding: 1500,
  birthday: 800,
  menus: 800,
  general: 500,
};
