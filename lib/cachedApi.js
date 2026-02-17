import { cache } from 'react';
import {
  getPageFieldsByName as getPageFieldsOriginal,
  getPostBySlug as getPostBySlugOriginal
} from '@/lib/api';

// React caching! uses the same function call if arguments are the same
// within the same SSR request
export const getPageFieldsByName = cache(async (name, revalidateTime = 3600) => {
  return await getPageFieldsOriginal(name, revalidateTime);
});

export const getPostBySlug = cache(async (slug, revalidateTime = 3600) => {
  return await getPostBySlugOriginal(slug, revalidateTime);
});
