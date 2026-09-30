import { addDays, documentLabel, type VisitDto } from '@kontora/contracts';
import { Link } from 'react-router';
import { usePickups } from '../../api/queries';
import { fmtDay, fmtDayLong, plural, todayIso } from '../../shared/lib/format';
import { useUrlFilters } from '../../shared/lib/hooks';
import { Pager, SearchField, Segmented } from '../../shared/ui/Controls';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { IssuedStamp, StatusPill } from '../../shared/ui/Status';
import { useIssueAction } from './useIssueAction';

const DEFAULTS = { q: '', mode: 'pending' };
const MODES = [
  ['pending', 'Очікують видачі'],
  ['issued', 'Видані'],
  ['all', 'Усі'],
] as const;
const LIMIT = 100;
const OVERDUE = 'overdue';

/** Групи за датою отримання; невидані з минулою датою — окремою групою зверху. */
function groupByPickupDay(items: VisitDto[], today: string) {
  const groups = new Map<string, VisitDto[]>();
  for (const v of items) {
    const key = !v.issuedAt && v.pickupDate < today ? OVERDUE : v.pickupDate;
    groups.set(key, [...(groups.get(key) ?? []), v]);
  }
  return [...groups];
}

const groupTitle = (key: string, today: string) =>
  key === OVERDUE ? 'Не забрали вчасно' : key === today ? 'Сьогодні' : key === addDays(today, 1) ? 'Завтра' : fmtDayLong(key);

export function PickupsPage() {
  const { values, page, update } = useUrlFilters(DEFAULTS);
  const mode = values.mode as (typeof MODES)[number][0];
  const { data, error, isPending, refetch } = usePickups({ mode, q: values.q || undefined, page, limit: LIMIT });
  const issue = useIssueAction();
  const today = todayIso();

  return (
    <section className="panel">
      <div className="panel-b toolbar">
        <SearchField id="pickups-q" value={values.q} onChange={(q) => update({ q })} placeholder="Пошук за клієнтом або номером" />
        <Segmented label="Які документи показати" value={mode} options={MODES} onChange={(m) => update({ mode: m })} />
      </div>

      {isPending ? (
        <div className="panel-b"><Loading height={320} /></div>
      ) : error ? (
        <div className="panel-b"><ErrorBox error={error} onRetry={() => void refetch()} /></div>
      ) : data.items.length === 0 ? (
        <Empty>Немає документів для видачі</Empty>
      ) : (
        <>
          {groupByPickupDay(data.items, today).map(([key, items]) => (
            <div key={key}>
              <h3 className={`group-h${key === OVERDUE ? ' bad' : ''}`}>
                {groupTitle(key, today)}
                <span className="muted">
                  {items.length} {plural(items.length, ['документ', 'документи', 'документів'])}
                </span>
              </h3>
              {items.map((v) => (
                <div className="pk" key={v.id}>
                  <div className="pk-main">
                    <Link className="link" to={`/clients/${v.client.id}`}>{v.client.name}</Link>
                    <span>
                      {documentLabel(v.type)} · <span className="mono">{v.ref}</span>
                    </span>
                    <span className="mono">
                      {v.client.phone}
                      {key === OVERDUE && ` · готово з ${fmtDay(v.pickupDate)}`}
                    </span>
                  </div>
                  {v.issuedAt ? <IssuedStamp date={v.issuedAt} /> : <StatusPill status={v.pickupStatus} />}
                  <div className="pk-actions">
                    {v.issuedAt ? (
                      <button className="btn sm ghost" disabled={issue.pendingId === v.id} onClick={() => void issue.run(v, false)}>
                        Повернути
                      </button>
                    ) : (
                      <button
                        className={`btn sm${v.pickupStatus !== 'waiting' ? ' primary' : ''}`}
                        disabled={issue.pendingId === v.id}
                        onClick={() => void issue.run(v, true)}
                      >
                        Видати
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
          <Pager page={page} limit={LIMIT} total={data.total} onChange={(p) => update({ page: p })} />
        </>
      )}
    </section>
  );
}
