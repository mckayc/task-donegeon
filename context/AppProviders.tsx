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

export default AppProviders;
