import { NavLink, Outlet, useLocation } from 'react-router';
import { useDashboard } from '../api/queries';
import { useAuth } from '../auth/AuthProvider';
import { useVisitDialog } from '../features/visits/VisitDialogContext';
import { fmtToday, todayIso } from '../shared/lib/format';
import { useTheme } from '../shared/lib/theme';
import { Icon, type IconName } from '../shared/ui/Icon';

export const NAV: { to: string; title: string; icon: IconName }[] = [
  { to: '/', title: 'Огляд', icon: 'home' },
  { to: '/visits', title: 'Візити', icon: 'calendar' },
  { to: '/pickups', title: 'Видача', icon: 'document' },
  { to: '/clients', title: 'Клієнти', icon: 'users' },
  { to: '/stats', title: 'Статистика', icon: 'chart' },
];

const ROLE_LABELS = { admin: 'Адміністратор', registrar: 'Реєстратор' } as const;

export function Layout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { openVisitDialog } = useVisitDialog();
  const dashboard = useDashboard();
  const attention = dashboard.data ? dashboard.data.counts.pickupsToday + dashboard.data.counts.overdue : 0;
  const current = NAV.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to)));

  return (
    <div className="app">
      <aside className="side">
        <NavLink to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">К</span>
          <span>
            <span className="brand-name">Контора</span>
            <small>Прийом і видача</small>
          </span>
        </NavLink>
        <nav className="nav" aria-label="Розділи">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              <Icon name={item.icon} />
              <span>{item.title}</span>
              {item.to === '/pickups' && attention > 0 && (
                <span className="badge" aria-label={`${attention} потребують уваги`}>
                  {attention}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className="side-user">
            <div>
              <b>{user.name}</b>
              <span>{ROLE_LABELS[user.role]}</span>
            </div>
            <button className="btn sm ghost" onClick={logout}>
              <Icon name="logout" />
              Вийти
            </button>
          </div>
        )}
      </aside>

      <main className="main">
        <header className="top">
          <h1>{current?.title ?? 'Контора'}</h1>
          <span className="date">{fmtToday(todayIso())}</span>
          <button className="btn icon" onClick={toggle} aria-label={theme === 'dark' ? 'Світла тема' : 'Темна тема'} title={theme === 'dark' ? 'Світла тема' : 'Темна тема'}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <button className="btn primary" onClick={() => openVisitDialog()} aria-label="Новий візит">
            <Icon name="plus" />
            <span className="btn-label">Новий візит</span>
          </button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
