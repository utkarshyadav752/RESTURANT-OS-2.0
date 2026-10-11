import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { LoginPage } from './components/auth/LoginPage.tsx';
import { RegisterWizard } from './components/auth/RegisterWizard.tsx';
import { InvitePage } from './components/auth/InvitePage.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { RoleDashboard } from './components/dashboards/RoleDashboard.tsx';
import { InteractiveOnboardingWizard } from './components/wizard/InteractiveOnboardingWizard.tsx';
import { POSView } from './components/pos/POSView.tsx';
import { KDSView } from './components/kitchen/KDSView.tsx';
import { TablesView } from './components/tables/TablesView.tsx';
import { OrdersBillingView } from './components/orders/OrdersBillingView.tsx';
import { InventoryLedgerView } from './components/inventory/InventoryLedgerView.tsx';
import { RecipeBOMView } from './components/recipes/RecipeBOMView.tsx';
import { WastageCenterView } from './components/wastage/WastageCenterView.tsx';
import { PurchasingView } from './components/purchases/PurchasingView.tsx';
import { MenuEngineeringView } from './components/menu/MenuEngineeringView.tsx';
import { ForecastView } from './components/forecast/ForecastView.tsx';
import { RestaurantSettingsView } from './components/settings/RestaurantSettingsView.tsx';
import { CustomersView } from './components/crm/CustomersView.tsx';
import { TeamProgressTracker } from './components/analytics/TeamProgressTracker.tsx';
import { DailyHuddleSummary } from './components/analytics/DailyHuddleSummary.tsx';
import { SmartSchedulingView } from './components/scheduling/SmartSchedulingView.tsx';

function MainRouter() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Unauthenticated routing state
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER' | 'INVITE'>('LOGIN');
  const [inviteToken, setInviteToken] = useState<string>('inv_token_tandoor_lead_998');

  // Authenticated active view tab: defaults to the role's dashboard
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Omnipresent AI Copilot drawer state
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  // Interactive Onboarding Wizard state (activates immediately after registration)
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);

  // Check URL pathname on mount
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/register') {
      setAuthView('REGISTER');
    } else if (path.startsWith('/invite/')) {
      const token = path.replace('/invite/', '');
      setInviteToken(token);
      setAuthView('INVITE');
    } else {
      setAuthView('LOGIN');
    }
  }, []);

  // When user logs in or switches role, always route to their customized role dashboard
  useEffect(() => {
    if (user) {
      setActiveTab('dashboard');
    }
  }, [user?.role]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
        <span className="text-sm font-bold tracking-tight">Initializing RestaurantOS Kernel...</span>
      </div>
    );
  }

  // Unauthenticated screen
  if (!isAuthenticated) {
    if (authView === 'REGISTER') {
      return (
        <RegisterWizard
          onNavigateLogin={() => setAuthView('LOGIN')}
          onComplete={() => {
            // Activate the restaurant onboarding wizard immediately after registration!
            setShowOnboardingWizard(true);
            setAuthView('LOGIN');
            setActiveTab('dashboard');
          }}
        />
      );
    }

    if (authView === 'INVITE') {
      return (
        <InvitePage
          token={inviteToken}
          onActivated={() => {
            setAuthView('LOGIN');
            setActiveTab('dashboard');
          }}
          onCancel={() => setAuthView('LOGIN')}
        />
      );
    }

    return (
      <LoginPage
        onNavigateRegister={() => setAuthView('REGISTER')}
      />
    );
  }

  // Authenticated App with Sidebar & Modules
  return (
    <>
      <AppLayout 
        activeTab={activeTab} 
        onSelectTab={setActiveTab}
        isCopilotOpen={isCopilotOpen}
        setIsCopilotOpen={setIsCopilotOpen}
      >
        {/* Role-Specific Dashboard (Owner, Manager, Cashier, Waiter, Kitchen, Inventory, Accountant) */}
        {activeTab === 'dashboard' && (
          <RoleDashboard
            onNavigateTab={setActiveTab}
            onOpenCopilot={() => setIsCopilotOpen(true)}
          />
        )}

        {activeTab === 'huddle' && (
          <div className="p-6 max-w-7xl mx-auto">
            <DailyHuddleSummary
              onNavigateTab={setActiveTab}
              onOpenCopilot={() => setIsCopilotOpen(true)}
            />
          </div>
        )}

        {activeTab === 'team' && (
          <div className="p-6 max-w-7xl mx-auto">
            <TeamProgressTracker />
          </div>
        )}

        {activeTab === 'pos' && <POSView />}

        {activeTab === 'tables' && (
          <TablesView
            onOpenTablePOS={(tbl) => {
              setActiveTab('pos');
            }}
          />
        )}

        {activeTab === 'kitchen' && <KDSView />}

        {activeTab === 'orders' && <OrdersBillingView />}

        {activeTab === 'menu' && <RecipeBOMView />}

        {activeTab === 'inventory' && <InventoryLedgerView />}

        {activeTab === 'purchases' && <PurchasingView />}

        {activeTab === 'wastage' && <WastageCenterView />}

        {activeTab === 'customers' && <CustomersView />}

        {activeTab === 'profit' && <MenuEngineeringView />}

        {activeTab === 'forecast' && (
          <ForecastView onNavigateTab={setActiveTab} />
        )}

        {activeTab === 'scheduling' && (
          <SmartSchedulingView />
        )}

        {activeTab === 'settings' && <RestaurantSettingsView />}
      </AppLayout>

      {/* Onboarding Wizard Modal: Activates immediately after registration or manually */}
      <InteractiveOnboardingWizard
        isOpen={showOnboardingWizard}
        onComplete={() => setShowOnboardingWizard(false)}
        onSkip={() => setShowOnboardingWizard(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
