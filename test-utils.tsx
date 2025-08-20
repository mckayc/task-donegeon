import '@testing-library/jest-dom';

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NotificationsProvider } from './context/NotificationsContext';
import { AuthProvider } from './context/AuthContext';
import { DeveloperProvider } from './context/DeveloperContext';
import { DataProvider } from './context/DataProvider';
import { UIProvider } from './context/UIContext';
import { ActionsProvider } from './context/ActionsContext';

const AllTheProviders: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <NotificationsProvider>
      <AuthProvider>
        <DataProvider>
          <UIProvider>
            <ActionsProvider>
              <DeveloperProvider>
                {children}
              </DeveloperProvider>
            </ActionsProvider>
          </UIProvider>
        </DataProvider>
      </AuthProvider>
    </NotificationsProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };