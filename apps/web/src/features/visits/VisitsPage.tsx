import { documentLabel, type DocumentType } from '@kontora/contracts';
import { Link } from 'react-router';
import { useVisits } from '../../api/queries';
import { dayOf, fmtDay, fmtTime } from '../../shared/lib/format';
import { useUrlFilters } from '../../shared/lib/hooks';
import { DocumentTypeSelect, Pager, SearchField, Segmented } from '../../shared/ui/Controls';
import { Empty, ErrorBox, Loading } from '../../shared/ui/Feedback';
import { VisitStatus } from '../../shared/ui/Status';

const DEFAULTS = { q: '', type: '', status: 'all' };
const STATUS_OPTIONS = [
  ['all', 'Усі'],
  ['planned', 'Заплановані'],
  ['done', 'Відбулися'],
] as const;
const LIMIT = 25;

export function VisitsPage() {
  const { values, page, update } = useUrlFilters(DEFAULTS);
  const status = values.status as (typeof STATUS_OPTIONS)[number][0];
  const { data, error, isPending, refetch } = useVisits({
    q: values.q || undefined,
    type: (values.type || undefined) as DocumentType | undefined,
    status,
    page,
    limit: LIMIT,
  });

  return (
    <section className="panel">
      <div className="panel-b toolbar">
        <SearchField id="visits-q" value={values.q} onChange={(q) => update({ q })} placeholder="Пошук за клієнтом, телефоном або номером" />
        <DocumentTypeSelect id="visits-type" value={values.type as DocumentType | ''} onChange={(type) => update({ type })} />
        <Segmented label="Статус візиту" value={status} options={STATUS_OPTIONS} onChange={(s) => update({ status: s })} />
      </div>

      {isPending ? (
        <div className="panel-b"><Loading height={320} /></div>
      ) : error ? (
        <div className="panel-b"><ErrorBox error={error} onRetry={() => void refetch()} /></div>
      ) : data.items.length === 0 ? (
        <Empty>Візитів за цими умовами не знайдено</Empty>
      ) : (
        <>
          <div className="table" role="table" aria-label="Візити">
            <div className="tr th" role="row">
              <span role="columnheader">Візит</span>
              <span role="columnheader">Клієнт</span>
              <span role="columnheader">Мета візиту</span>
              <span role="columnheader" className="c-pick">Отримання</span>
              <span role="columnheader">Статус</span>
            </div>
            {data.items.map((v) => (
              <div className="tr" role="row" key={v.id}>
                <span className="cell-stack c-date" role="cell">
                  <b>{fmtDay(dayOf(v.date))}</b>
                  <span className="mono muted">{fmtTime(v.date)}</span>
                </span>
                <span className="cell-stack c-client" role="cell">
                  <Link className="link" to={`/clients/${v.client.id}`}>{v.client.name}</Link>
                  <small className="mono">{v.client.phone}</small>
                </span>
                <span className="cell-stack c-doc" role="cell">
                  {documentLabel(v.type)}
                  <small className="mono">{v.ref} · видача {fmtDay(v.pickupDate)}</small>
                </span>
                <span className="c-pick mono" role="cell">{fmtDay(v.pickupDate)}</span>
                <span className="c-status" role="cell"><VisitStatus visit={v} /></span>
              </div>
            ))}
          </div>
          <Pager page={page} limit={LIMIT} total={data.total} onChange={(p) => update({ page: p })} />
        </>
      )}
    </section>
  );
}
