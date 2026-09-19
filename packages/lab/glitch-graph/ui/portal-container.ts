import type { RefObject } from 'react';

import { createContext, createRef, useContext } from 'react';

// Popups render inside the root element so the scoped stylesheet still reaches them
export const PortalContainerContext =
	createContext<RefObject<HTMLDivElement | null>>(createRef<HTMLDivElement>());

export function usePortalContainer() {
	return useContext(PortalContainerContext);
}
