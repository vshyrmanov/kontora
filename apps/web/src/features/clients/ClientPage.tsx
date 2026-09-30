import { documentLabel } from '@kontora/contracts';
import { Link, useParams } from 'react-router';
import { useClient } from '../../api/queries';
import { dayOf, fmtDay, fmtTime, initials } from '../../shared/lib/format';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { Icon } from '../../shared/ui/Icon';
import { VisitStatus } from '../../shared/ui/Status';
import { useIssueAction } from '../pickups/useIssueAction';
import { useVisitDialog } from '../visits/VisitDialogContext';

export function ClientPage() {
  const { id } = useParams<{ id: string }>();
  const { data: client, error, isPending, refetch } = useClient(id);
  const { openVisitDialog } = useVisitDialog();
  const issue = useIssueAction();

  if (isPending) return <Loading height={400} />;
  if (error) return <ErrorBox error={error} onRetry={() => void refetch()} />;

  const issued = client.visits.filter((v) => v.issuedAt).length;

  return (
    <div className="stack">
      <Link to="/clients" className="back">
        <Icon name="back" /> Усі клієнти
      </Link>

      <section className="panel">
        <div className="panel-b stack">
          <div className="profile-head">
            <span className="ava lg" aria-hidden="true">{initials(client.name)}</span>
            <span className="cell-stack">
              <b>{client.name}</b>
              <span className="contacts">
                <span className="mono">{client.phone}</span>
                {client.email && <span>{client.email}</span>}
                <span>у базі з {fmtDay(dayOf(client.createdAt))}</span>
              </span>
            </span>
            <button className="btn primary" onClick={() => openVisitDialog({ clientId: client.id })}>
              <Icon name="plus" /> Записати на візит
            </button>
          </div>
          {client.note && <p className="muted" style={{ margin: 0 }}>{client.note}</p>}
          <div className="mini-kpis">
            <div><b>{client.visits.length}</b><span>Візитів</span></div>
            <div><b>{issued}</b><span>Видано</span></div>
            <div><b>{client.visits.length - issued}</b><span>В роботі</span></div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-h"><h2>Історія візитів</h2></div>
        <div className="panel-b">
          {client.visits.length ? (
            <ul className="history">
              {client.visits.map((v) => (
                <li key={v.id}>
                  <span className="cell-stack">
                    <b>{documentLabel(v.type)}</b>
                    <small>
                      <span className="mono">{v.ref}</span> · візит {fmtDay(dayOf(v.date))} о {fmtTime(v.date)} · отримання {fmtDay(v.pickupDate)}
                    </small>
                    {v.note && <small>{v.note}</small>}
                  </span>
                  <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <VisitStatus visit={v} />
                    {!v.issuedAt && v.pickupStatus !== 'waiting' && (
                      <button className="btn sm primary" disabled={issue.pendingId === v.id} onClick={() => void issue.run(v, true)}>
                        Видати
                      </button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Візитів ще не було</Empty>
          )}
        </div>
      </section>
    </div>
  );
}
