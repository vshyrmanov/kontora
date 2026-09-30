import { createBrowserRouter } from 'react-router';
import { RequireAuth } from '../auth/RequireAuth';
import { LoginPage } from '../features/auth/LoginPage';
import { ClientPage } from '../features/clients/ClientPage';
import { ClientsPage } from '../features/clients/ClientsPage';
import { OverviewPage } from '../features/overview/OverviewPage';
import { PickupsPage } from '../features/pickups/PickupsPage';
import { StatsPage } from '../features/stats/StatsPage';
import { VisitDialogProvider } from '../features/visits/VisitDialogContext';
import { VisitsPage } from '../features/visits/VisitsPage';
import { Empty } from '../shared/ui/Feedback';
import { Layout } from './Layout';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <VisitDialogProvider>
          <Layout />
        </VisitDialogProvider>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <OverviewPage /> },
      { path: 'visits', element: <VisitsPage /> },
      { path: 'pickups', element: <PickupsPage /> },
      { path: 'clients', element: <ClientsPage /> },
      { path: 'clients/:id', element: <ClientPage /> },
      { path: 'stats', element: <StatsPage /> },
      { path: '*', element: <Empty>Сторінку не знайдено</Empty> },
    ],
  },
]);
