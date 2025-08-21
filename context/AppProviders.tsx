import React from 'react';
import { NotificationsProvider } from './NotificationsContext';
import { AuthProvider } from './AuthContext';
import { DeveloperProvider } from './DeveloperContext';
import { UIProvider } from './UIContext';
import { QuestsProvider } from './QuestsContext';
import { EconomyProvider } from './EconomyContext';
import { ProgressionProvider } from './ProgressionContext';
import { CommunityProvider } from './CommunityContext';
import { SystemProvider } from './SystemContext';
import { DataProvider } from './DataProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <NotificationsProvider>
      <UIProvider>
        <AuthProvider>
          <ProgressionProvider>
            <CommunityProvider>
              <SystemProvider>
                <QuestsProvider>
                  <EconomyProvider>
                    <DeveloperProvider>
                      <DataProvider>
                        {children}
                      </DataProvider>
                    </DeveloperProvider>
                  </EconomyProvider>
                </QuestsProvider>
              </SystemProvider>
            </CommunityProvider>
          </ProgressionProvider>
        </AuthProvider>
      </UIProvider>
    </NotificationsProvider>
  );
};

export default AppProviders;
