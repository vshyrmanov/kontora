import { documentLabel } from '@kontora/contracts';
import { Link } from 'react-router';
import { useDashboard } from '../../api/queries';
import { fmtDay, fmtTime, plural } from '../../shared/lib/format';
import { ColumnChart } from '../../shared/ui/Charts';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { Kpi } from '../../shared/ui/Kpi';
import { VisitStatus } from '../../shared/ui/Status';
import { useIssueAction } from '../pickups/useIssueAction';

export function OverviewPage() {
  const { data, error, isPending, refetch } = useDashboard();
  const issue = useIssueAction();

  if (isPending) return <Loading height={400} />;
  if (error) return <ErrorBox error={error} onRetry={() => void refetch()} />;

  const { counts, todayVisits, upcomingPickups, last14Days, today } = data;
  const done = todayVisits.filter((v) => new Date(v.date) <= new Date()).length;

  return (
    <div className="stack">
      <section className="kpis">
        <Kpi label="Візити сьогодні" value={counts.todayVisits} sub={`${done} прийнято, ${counts.todayVisits - done} очікується`} />
        <Kpi label="Видача сьогодні" value={counts.pickupsToday} sub={plural(counts.pickupsToday, ['документ готовий', 'документи готові', 'документів готові'])} />
        <Kpi label="Не забрали вчасно" value={counts.overdue} sub="варто зателефонувати" alert={counts.overdue > 0} />
        <Kpi label="Клієнтів у базі" value={counts.clients} sub={`${counts.inProgress} документів в роботі`} />
      </section>

      <div className="grid-2">
        <section className="panel">
          <div className="panel-h">
            <h2>Прийом сьогодні</h2>
            <Link className="text-link" to="/visits">Усі візити</Link>
          </div>
          <div className="panel-b">
            {todayVisits.length ? (
              <ul className="list">
                {todayVisits.map((v) => (
                  <li key={v.id}>
                    <span className="when">{fmtTime(v.date)}</span>
                    <span className="who">
                      <Link className="link" to={`/clients/${v.client.id}`}>{v.client.name}</Link>
                      <span>{documentLabel(v.type)}</span>
                    </span>
                    <VisitStatus visit={v} />
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>Сьогодні записів немає</Empty>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel-h">
            <h2>Найближчі видачі</h2>
            <Link className="text-link" to="/pickups">Графік видачі</Link>
          </div>
          <div className="panel-b">
            {upcomingPickups.length ? (
              <ul className="list">
                {upcomingPickups.map((v) => (
                  <li key={v.id}>
                    <span className="when">{v.pickupDate === today ? 'Сьогодні' : fmtDay(v.pickupDate)}</span>
                    <span className="who">
                      <Link className="link" to={`/clients/${v.client.id}`}>{v.client.name}</Link>
                      <span>{documentLabel(v.type)}</span>
                    </span>
                    <button className="btn sm" disabled={issue.pendingId === v.id} onClick={() => void issue.run(v, true)}>
                      Видати
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty>На тиждень видач не заплановано</Empty>
            )}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-h">
          <h2>Відвідуваність за 14 днів</h2>
          <Link className="text-link" to="/stats">Детальна статистика</Link>
        </div>
        <div className="panel-b">
          <ColumnChart small label="Візити по днях за останні 14 днів" data={last14Days.map((p) => ({ label: fmtDay(p.key), value: p.value }))} />
        </div>
      </section>
    </div>
  );
}
