import type { CSSProperties } from 'react';

export interface ChartDatum {
  label: string;
  value: number;
  /** Повний підпис для підказки при наведенні. */
  title?: string;
}

/** «Кругла» верхня межа шкали: половина теж ціле число, тож підписи осі завжди точні. */
export const niceMax = (max: number) => {
  if (max <= 10) return Math.max(2, max + (max % 2));
  const p = 10 ** Math.floor(Math.log10(max));
  return ([1.2, 1.6, 2, 3, 4, 5, 6, 8, 10].find((c) => max / p <= c) ?? 10) * p;
};

export function ColumnChart({ data, small = false, label }: { data: ChartDatum[]; small?: boolean; label: string }) {
  if (!data.length) return <div className="empty">Немає даних за обраний період</div>;
  const max = niceMax(Math.max(1, ...data.map((d) => d.value)));
  const step = Math.ceil(data.length / 7);
  const n = data.length;
  const style = { '--n': n } as CSSProperties;
  return (
    <figure className={`cols${small ? ' sm' : ''}${n <= 12 ? ' values' : ''}`} aria-label={label} style={{ margin: 0 }}>
      <div className="cols-axis" aria-hidden="true">
        <span>{max}</span>
        <span>{max / 2}</span>
        <span>0</span>
      </div>
      <div className="cols-plot" style={style}>
        {data.map((d, i) => (
          <div key={`${d.label}-${i}`} className={`col${i === n - 1 ? ' last' : ''}`} title={`${d.title ?? d.label}: ${d.value}`}>
            <i style={{ height: `${(d.value / max) * 100}%` }}>
              <b>{d.value}</b>
            </i>
          </div>
        ))}
      </div>
      <div className="cols-labels" style={style} aria-hidden="true">
        {data.map((d, i) => (
          <span key={`${d.label}-${i}`}>{i % step === 0 ? d.label : ''}</span>
        ))}
      </div>
    </figure>
  );
}

export function HBarChart({ data }: { data: ChartDatum[] }) {
  if (!data.length) return <div className="empty">Немає даних за обраний період</div>;
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="hbars">
      {data.map((d) => (
        <li key={d.label}>
          <span className="hb-label">{d.label}</span>
          <span className="hb-val">{d.value}</span>
          <span className="hb-track">
            <i style={{ width: `${(d.value / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
