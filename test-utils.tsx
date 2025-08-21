import '@testing-library/jest-dom';

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NotificationsProvider } from './context/NotificationsContext';
import { AuthProvider } from './context/AuthContext';
import { DeveloperProvider } from './context/DeveloperContext';
import { DataProvider } from './context/DataProvider';
import { UIProvider } from './context/UIContext';
import { QuestsProvider } from './context/QuestsContext';
import { EconomyProvider } from './context/EconomyContext';
import { ProgressionProvider } from './context/ProgressionContext';
import { CommunityProvider } from './context/CommunityContext';
import { SystemProvider } from './context/SystemContext';

const AllTheProviders: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <NotificationsProvider>
      <AuthProvider>
        <SystemProvider>
          <QuestsProvider>
            <EconomyProvider>
              <ProgressionProvider>
                <CommunityProvider>
                  <DataProvider>
                    <UIProvider>
                      <DeveloperProvider>
                        {children}
                      </DeveloperProvider>
                    </UIProvider>
                  </DataProvider>
                </CommunityProvider>
              </ProgressionProvider>
            </EconomyProvider>
          </QuestsProvider>
        </SystemProvider>
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
