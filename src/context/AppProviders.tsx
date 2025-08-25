import React from 'react';
import { NotificationsProvider } from 'context/NotificationsContext';
import { AuthProvider } from 'context/AuthContext';
import { DeveloperProvider } from 'context/DeveloperContext';
import { UIProvider } from 'context/UIContext';
import { QuestsProvider } from 'context/QuestsContext';
import { EconomyProvider } from 'context/EconomyContext';
import { ProgressionProvider } from 'context/ProgressionContext';
import { CommunityProvider } from 'context/CommunityContext';
import { SystemProvider } from 'context/SystemContext';
import { DataProvider } from 'context/DataProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <NotificationsProvider>
      <UIProvider>
        <AuthProvider>
          <SystemProvider>
            <ProgressionProvider>
              <CommunityProvider>
                <QuestsProvider>
                  <EconomyProvider>
                    <DeveloperProvider>
                      <DataProvider>
                        {children}
                      </DataProvider>
                    </DeveloperProvider>
                  </EconomyProvider>
                </QuestsProvider>
              </CommunityProvider>
            </ProgressionProvider>
          </SystemProvider>
        </AuthProvider>
      </UIProvider>
    </NotificationsProvider>
  );
};

export default AppProviders;