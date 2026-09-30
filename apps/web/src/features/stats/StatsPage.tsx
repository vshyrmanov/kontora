import { addDays, documentLabel, type DocumentType, type SeriesUnit, type StatsDto } from '@kontora/contracts';
import { useStats } from '../../api/queries';
import { fmtDay, fmtMonth, todayIso } from '../../shared/lib/format';
import { useUrlFilters } from '../../shared/lib/hooks';
import { ColumnChart, HBarChart } from '../../shared/ui/Charts';
import { DocumentTypeSelect, Segmented } from '../../shared/ui/Controls';
import { ErrorBox, Loading } from '../../shared/ui/Feedback';
import { Kpi } from '../../shared/ui/Kpi';

const DEFAULTS = { period: '30', type: '' };
const PERIODS = [
  ['7', '7 днів'],
  ['30', '30 днів'],
  ['90', '90 днів'],
  ['365', 'Рік'],
] as const;
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const UNIT_LABEL: Record<SeriesUnit, string> = { day: 'по днях', week: 'по тижнях', month: 'по місяцях' };

const seriesLabel = (key: string, unit: SeriesUnit) => (unit === 'month' ? fmtMonth(key) : fmtDay(key));

export function StatsPage() {
  const { values, update } = useUrlFilters(DEFAULTS);
  const period = values.period as (typeof PERIODS)[number][0];
  const to = todayIso();
  const from = addDays(to, -(Number(period) - 1));
  const { data, error, isPending, isFetching, refetch } = useStats({
    from,
    to,
    type: (values.type || undefined) as DocumentType | undefined,
  });

  return (
    <div className="stack">
      <div className="toolbar">
        <Segmented label="Період" value={period} options={PERIODS} onChange={(p) => update({ period: p })} />
        <DocumentTypeSelect id="stats-type" value={values.type as DocumentType | ''} onChange={(type) => update({ type })} />
      </div>
      {isPending ? (
        <Loading height={480} />
      ) : error ? (
        <ErrorBox error={error} onRetry={() => void refetch()} />
      ) : (
        <div className="stack" style={{ opacity: isFetching ? 0.6 : 1, transition: 'opacity .15s' }}>
          <StatsBody stats={data} />
        </div>
      )}
    </div>
  );
}

function StatsBody({ stats }: { stats: StatsDto }) {
  const { totals, range, unit } = stats;
  const onTime = totals.due ? Math.round((totals.pickedUpOnTime / totals.due) * 100) : 0;
  return (
    <>
      <section className="kpis">
        <Kpi label="Візитів" value={totals.visits} sub={`з ${fmtDay(range.from)} по ${fmtDay(range.to)}`} />
        <Kpi
          label="Унікальних клієнтів"
          value={totals.clients}
          sub={`${totals.clients ? (totals.visits / totals.clients).toFixed(1) : 0} візиту на клієнта`}
        />
        <Kpi label="Строк оформлення" value={totals.avgProcessingDays.toFixed(1)} sub="днів у середньому" />
        <Kpi label="Забрали вчасно" value={`${onTime}%`} sub={`${totals.pickedUpOnTime} з ${totals.due} готових`} />
      </section>

      <div className="chart-grid">
        <section className="panel wide">
          <div className="panel-h">
            <h2>Динаміка відвідувань</h2>
            <span className="muted">{UNIT_LABEL[unit]}</span>
          </div>
          <div className="panel-b">
            <ColumnChart
              label="Динаміка відвідувань"
              data={stats.series.map((p) => ({
                label: seriesLabel(p.key, unit),
                title: unit === 'week' ? `Тиждень з ${fmtDay(p.key)}` : seriesLabel(p.key, unit),
                value: p.value,
              }))}
            />
          </div>
        </section>
        <section className="panel">
          <div className="panel-h"><h2>За метою візиту</h2></div>
          <div className="panel-b">
            <HBarChart data={stats.byType.map((t) => ({ label: documentLabel(t.type), value: t.value }))} />
          </div>
        </section>
        <section className="panel">
          <div className="panel-h"><h2>За днями тижня</h2></div>
          <div className="panel-b">
            <ColumnChart small label="Візити за днями тижня" data={stats.byWeekday.map((value, i) => ({ label: WEEKDAYS[i]!, value }))} />
          </div>
        </section>
        <section className="panel wide">
          <div className="panel-h">
            <h2>Навантаження за годинами</h2>
            <span className="muted">початок візиту</span>
          </div>
          <div className="panel-b">
            <ColumnChart small label="Візити за годинами" data={stats.byHour.map((h) => ({ label: `${h.hour}:00`, value: h.value }))} />
          </div>
        </section>
      </div>
    </>
  );
}
