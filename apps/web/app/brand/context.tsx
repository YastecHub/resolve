import { createContext, useContext, type ComponentType } from 'react';
import { BrandMark, type MarkProps } from '~/components/brand-mark';

export const BrandContext = createContext<ComponentType<MarkProps>>(BrandMark);

export function useMark() {
  return useContext(BrandContext);
}
