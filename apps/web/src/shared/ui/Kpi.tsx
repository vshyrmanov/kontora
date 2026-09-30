import type { ReactNode } from 'react';

interface KpiProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  alert?: boolean;
}

export const Kpi = ({ label, value, sub, alert = false }: KpiProps) => (
  <div className={`kpi${alert ? ' alert' : ''}`}>
    <span className="label">{label}</span>
    <span className="value">{value}</span>
    {sub && <span className="sub">{sub}</span>}
  </div>
);
