import '@testing-library/jest-dom';

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { NotificationsProvider } from 'src/context/NotificationsContext';
import { AuthProvider } from 'src/context/AuthContext';
import { DeveloperProvider } from 'src/context/DeveloperContext';
import { DataProvider } from 'src/context/DataProvider';
import { UIProvider } from 'src/context/UIContext';
import { QuestsProvider } from 'src/context/QuestsContext';
import { EconomyProvider } from 'src/context/EconomyContext';
import { ProgressionProvider } from 'src/context/ProgressionContext';
import { CommunityProvider } from 'src/context/CommunityContext';
import { SystemProvider } from 'src/context/SystemContext';

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
