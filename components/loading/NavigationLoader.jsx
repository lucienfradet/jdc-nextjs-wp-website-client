"use client";

import { useNavigation } from '@/context/NavigationContext';
import Loading from './Loading'; // Your existing Loading component

export default function NavigationLoader() {
  const { isNavigating } = useNavigation();
  
  if (!isNavigating) return null;
  
  return <Loading />;
}
