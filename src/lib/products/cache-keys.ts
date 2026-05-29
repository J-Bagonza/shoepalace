export const productCacheKeys = {
  list: (query: string) => `products:list:${query}`,
  single: (slug: string) => `products:single:${slug}`,
  featured: () => `products:featured`,
  allListPattern: () => `products:list:*`,
} as const;