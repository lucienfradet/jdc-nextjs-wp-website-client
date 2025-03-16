import { cache } from 'react';
import { getPageFieldsByName as getPageFieldsOriginal, getPostBySlug as getPostBySlugOriginal } from '@/lib/api';

// Cached version of getPageFieldsByName 
export const getPageFieldsByName = cache(async (name) => {
  return await getPageFieldsOriginal(name);
});

export const getPostBySlug = cache(async (slug) => {
  return await getPostBySlugOriginal(slug);
});
