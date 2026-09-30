import {
  addDays,
  clientInputSchema,
  DOCUMENT_TYPE_KEYS,
  DOCUMENT_TYPES,
  visitCreateSchema,
  type DocumentType,
} from '@kontora/contracts';
import { useState, type FormEvent } from 'react';
import { ApiError } from '../../api/http';
import { useClient, useClients, useCreateVisit } from '../../api/queries';
import { useDebouncedValue } from '../../shared/lib/hooks';
import { dayOf, localInputToIso, nextSlotLocalInput, plural } from '../../shared/lib/format';
import { Segmented } from '../../shared/ui/Controls';
import { Dialog } from '../../shared/ui/Dialog';
import { useToast } from '../../shared/ui/Feedback';

interface Props {
  open: boolean;
  initialClientId?: string;
  onClose: () => void;
}

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'clientId' | 'date' | 'pickupDate' | 'form', string>>;

const suggestedPickup = (localDateTime: string, type: DocumentType) =>
  localDateTime ? addDays(localDateTime.slice(0, 10), DOCUMENT_TYPES[type].processingDays) : '';

export function VisitFormDialog({ open, initialClientId, onClose }: Props) {
  const toast = useToast();
  const createVisit = useCreateVisit();

  const [mode, setMode] = useState<'new' | 'existing'>(initialClientId ? 'existing' : 'new');
  const [client, setClient] = useState({ name: '', phone: '', email: '' });
  const [clientId, setClientId] = useState(initialClientId ?? '');
  const [clientSearch, setClientSearch] = useState('');
  const [date, setDate] = useState(nextSlotLocalInput);
  const [type, setType] = useState<DocumentType>('id_card');
  const [pickupDate, setPickupDate] = useState(() => suggestedPickup(nextSlotLocalInput(), 'id_card'));
  const [pickupTouched, setPickupTouched] = useState(false);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Errors>({});

  const search = useDebouncedValue(clientSearch.trim());
  const clientsQuery = useClients({ q: search || undefined, limit: 8 }, open && mode === 'existing');
  const selectedClient = useClient(mode === 'existing' && clientId ? clientId : undefined);

  // автопідстановка дати отримання, доки користувач не змінив її вручну
  const updateSchedule = (nextDate: string, nextType: DocumentType) => {
    setDate(nextDate);
    setType(nextType);
    if (!pickupTouched) setPickupDate(suggestedPickup(nextDate, nextType));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    const newClient = mode === 'new' ? clientInputSchema.safeParse(client) : null;
    if (newClient && !newClient.success) {
      const f = newClient.error.flatten().fieldErrors;
      Object.assign(next, { name: f.name?.[0], phone: f.phone?.[0], email: f.email?.[0] });
    }
    if (mode === 'existing' && !clientId) next.clientId = 'Оберіть клієнта зі списку';
    if (!date) next.date = 'Вкажіть дату й час візиту';
    if (!pickupDate) next.pickupDate = 'Вкажіть дату отримання';
    else if (date && pickupDate < dayOf(localInputToIso(date))) next.pickupDate = 'Дата отримання не може бути раніше за візит';
    if (Object.values(next).some(Boolean)) return setErrors(next);

    const payload = visitCreateSchema.safeParse({
      ...(newClient?.success ? { newClient: newClient.data } : { clientId }),
      date: localInputToIso(date),
      type,
      pickupDate,
      note,
    });
    if (!payload.success) return setErrors({ form: payload.error.issues[0]?.message });

    try {
      const { visit, clientCreated } = await createVisit.mutateAsync(payload.data);
      toast(`Візит ${visit.ref} записано${mode === 'new' && !clientCreated ? ' до наявного клієнта з цим телефоном' : ''}`);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors({ form: error.message, pickupDate: error.fieldError('pickupDate'), date: error.fieldError('date') });
      } else setErrors({ form: 'Не вдалося зберегти візит' });
    }
  };

  const days = DOCUMENT_TYPES[type].processingDays;
  const invalid = (field: keyof Errors) => (errors[field] ? { 'aria-invalid': true as const, 'aria-describedby': `err-${field}` } : {});
  const fieldError = (field: keyof Errors) =>
    errors[field] && (
      <span className="err" id={`err-${field}`}>
        {errors[field]}
      </span>
    );

  return (
    <Dialog open={open} title="Новий візит" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="dlg-b">
          {errors.form && <div className="form-error" role="alert">{errors.form}</div>}

          <div className="section-title">Клієнт</div>
          <Segmented
            label="Тип клієнта"
            value={mode}
            onChange={(m) => {
              setMode(m);
              setErrors({});
            }}
            options={[
              ['new', 'Новий клієнт'],
              ['existing', 'Із бази'],
            ]}
          />

          {mode === 'new' ? (
            <div className="form-grid">
              <div className="f full">
                <label htmlFor="f-name">ПІБ *</label>
                <input id="f-name" className="input" autoComplete="off" placeholder="Прізвище Ім'я По батькові" value={client.name} onChange={(e) => setClient({ ...client, name: e.target.value })} {...invalid('name')} />
                {fieldError('name')}
              </div>
              <div className="f">
                <label htmlFor="f-phone">Телефон *</label>
                <input id="f-phone" className="input" type="tel" inputMode="tel" placeholder="+380 67 123 45 67" value={client.phone} onChange={(e) => setClient({ ...client, phone: e.target.value })} {...invalid('phone')} />
                {fieldError('phone')}
              </div>
              <div className="f">
                <label htmlFor="f-email">Email</label>
                <input id="f-email" className="input" type="email" placeholder="name@ukr.net" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} {...invalid('email')} />
                {fieldError('email')}
              </div>
            </div>
          ) : (
            <div className="f">
              <label htmlFor="f-client-search">Пошук клієнта *</label>
              <input id="f-client-search" className="input" type="search" placeholder="Ім'я або телефон" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} {...invalid('clientId')} />
              <div className="picker" role="listbox" aria-label="Клієнти">
                {selectedClient.data && !clientsQuery.data?.items.some((c) => c.id === clientId) && (
                  <button type="button" aria-pressed="true">
                    {selectedClient.data.name}
                    <small>{selectedClient.data.phone}</small>
                  </button>
                )}
                {clientsQuery.data?.items.map((c) => (
                  <button key={c.id} type="button" aria-pressed={c.id === clientId} onClick={() => setClientId(c.id)}>
                    {c.name}
                    <small>{c.phone}</small>
                  </button>
                ))}
                {clientsQuery.data?.items.length === 0 && <div className="empty">Нікого не знайдено</div>}
              </div>
              {fieldError('clientId')}
            </div>
          )}

          <div className="section-title">Візит і документ</div>
          <div className="form-grid">
            <div className="f">
              <label htmlFor="f-date">Дата й час візиту *</label>
              <input id="f-date" className="input" type="datetime-local" value={date} onChange={(e) => updateSchedule(e.target.value, type)} {...invalid('date')} />
              {fieldError('date')}
            </div>
            <div className="f">
              <label htmlFor="f-type">Мета — оформлення документа *</label>
              <select id="f-type" className="select" value={type} onChange={(e) => updateSchedule(date, e.target.value as DocumentType)}>
                {DOCUMENT_TYPE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {DOCUMENT_TYPES[key].label}
                  </option>
                ))}
              </select>
            </div>
            <div className="f">
              <label htmlFor="f-pickup">Дата отримання *</label>
              <input
                id="f-pickup"
                className="input"
                type="date"
                min={date.slice(0, 10)}
                value={pickupDate}
                onChange={(e) => {
                  setPickupTouched(true);
                  setPickupDate(e.target.value);
                }}
                {...invalid('pickupDate')}
              />
              {fieldError('pickupDate') ?? (
                <span className="hint">
                  Стандартний строк — {days} {plural(days, ['день', 'дні', 'днів'])}
                </span>
              )}
            </div>
            <div className="f full">
              <label htmlFor="f-note">Примітка</label>
              <textarea id="f-note" className="textarea" placeholder="Необхідні документи, побажання клієнта" value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="dlg-f">
          <button type="button" className="btn" onClick={onClose}>
            Скасувати
          </button>
          <button type="submit" className="btn primary" disabled={createVisit.isPending}>
            {createVisit.isPending ? 'Збереження…' : 'Записати візит'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
