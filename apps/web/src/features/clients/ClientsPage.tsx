import { Link } from 'react-router';
import { useClients } from '../../api/queries';
import { dayOf, fmtDay, initials, plural } from '../../shared/lib/format';
import { useUrlFilters } from '../../shared/lib/hooks';
import { Pager, SearchField } from '../../shared/ui/Controls';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';

const DEFAULTS = { q: '' };
const LIMIT = 24;

export function ClientsPage() {
  const { values, page, update } = useUrlFilters(DEFAULTS);
  const { data, error, isPending, refetch } = useClients({ q: values.q || undefined, page, limit: LIMIT });

  return (
    <div className="stack">
      <div className="toolbar">
        <SearchField id="clients-q" value={values.q} onChange={(q) => update({ q })} placeholder="Пошук за іменем, телефоном, email" />
        {data && (
          <span className="count">
            {data.total} {plural(data.total, ['клієнт', 'клієнти', 'клієнтів'])}
          </span>
        )}
      </div>

      {isPending ? (
        <Loading height={320} />
      ) : error ? (
        <ErrorBox error={error} onRetry={() => void refetch()} />
      ) : data.items.length === 0 ? (
        <Empty>Клієнтів не знайдено</Empty>
      ) : (
        <>
          <div className="cards">
            {data.items.map((c) => (
              <Link key={c.id} to={`/clients/${c.id}`} className="ccard">
                <span className="ccard-top">
                  <span className="ava" aria-hidden="true">{initials(c.name)}</span>
                  <span className="ccard-name">
                    <b>{c.name}</b>
                    <span className="mono">{c.phone}</span>
                  </span>
                </span>
                <span className="ccard-stats">
                  <div><b>{c.visitsCount}</b><span>Візитів</span></div>
                  <div><b>{c.pendingCount}</b><span>В роботі</span></div>
                  <div><b style={{ fontSize: 13 }}>{c.lastVisitAt ? fmtDay(dayOf(c.lastVisitAt)) : '—'}</b><span>Останній</span></div>
                </span>
              </Link>
            ))}
          </div>
          <div className="panel">
            <Pager page={page} limit={LIMIT} total={data.total} onChange={(p) => update({ page: p })} />
          </div>
        </>
      )}
    </div>
  );
}
