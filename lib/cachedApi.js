import { cache } from 'react';
import {
  getPageFieldsByName as getPageFieldsOriginal,
  getPostBySlug as getPostBySlugOriginal
} from '@/lib/api';

export const getPageFieldsByName = cache(async (name) => {
  const result = await getPageFieldsOriginal(name);
  if (!result) throw new Error(`Failed to fetch page: ${name}`);
  return result;
});

export const getPostBySlug = cache(async (slug) => {
  const result = await getPostBySlugOriginal(slug);
  if (!result) throw new Error(`Failed to fetch post: ${slug}`);
  return result;
});
