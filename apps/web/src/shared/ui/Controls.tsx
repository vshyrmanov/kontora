import { DOCUMENT_TYPE_KEYS, DOCUMENT_TYPES, type DocumentType } from '@kontora/contracts';
import { useEffect, useState } from 'react';
import { useDebouncedValue } from '../lib/hooks';
import { Icon } from './Icon';

interface SegmentedProps<T extends string> {
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
  label: string;
}

export function Segmented<T extends string>({ value, options, onChange, label }: SegmentedProps<T>) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button key={v} type="button" aria-pressed={v === value} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}

interface SearchFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

/** Поле пошуку з локальним станом і debounce, щоб не смикати API на кожен символ. */
export function SearchField({ id, value, onChange, placeholder }: SearchFieldProps) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebouncedValue(draft);
  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  return (
    <div className="field">
      <Icon name="search" />
      <input
        id={id}
        className="input"
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}

interface DocumentTypeSelectProps {
  id: string;
  value: DocumentType | '';
  onChange: (value: DocumentType | '') => void;
  allLabel?: string;
}

export const DocumentTypeSelect = ({ id, value, onChange, allLabel = 'Усі документи' }: DocumentTypeSelectProps) => (
  <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value as DocumentType | '')} aria-label="Тип документа">
    <option value="">{allLabel}</option>
    {DOCUMENT_TYPE_KEYS.map((key) => (
      <option key={key} value={key}>
        {DOCUMENT_TYPES[key].label}
      </option>
    ))}
  </select>
);

interface PagerProps {
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pager({ page, limit, total, onChange }: PagerProps) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <nav className="pager" aria-label="Сторінки">
      <span>
        Сторінка {page} з {pages} · {total} записів
      </span>
      <div>
        <button className="btn sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Назад
        </button>
        <button className="btn sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Далі
        </button>
      </div>
    </nav>
  );
}
