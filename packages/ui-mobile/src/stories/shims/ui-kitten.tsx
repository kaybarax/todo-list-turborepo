import React from 'react';

/**
 * Lightweight shim for @ui-kitten/components ApplicationProvider in web Storybook.
 * The real library currently triggers a CJS/ESM interop issue under Vite ("exports is not defined").
 * Replace this shim with the real provider once Storybook is configured with a compatible builder
 * (e.g., forcing webpack) or the dependency publishes an ESM-friendly bundle.
 */

export const ApplicationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

export default { ApplicationProvider };
