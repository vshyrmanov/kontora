import { addDays, DOCUMENT_TYPES, DOCUMENT_TYPE_KEYS, isoWeekday, type DocumentType, type IsoDate } from '@kontora/contracts';

const PEOPLE: [string, string][] = [
  ['Олена Коваль', 'olena.koval'], ['Андрій Мельник', 'a.melnyk'], ['Ірина Шевченко', ''], ['Тарас Бондаренко', 'taras.b'],
  ['Марія Ткаченко', ''], ['Дмитро Кравченко', 'kravchenko.d'], ['Наталія Олійник', ''], ['Сергій Лисенко', 's.lysenko'],
  ['Оксана Руденко', ''], ['Богдан Савченко', 'bohdan.sav'], ['Юлія Павленко', ''], ['Віктор Гончаренко', 'v.honcharenko'],
  ['Анна Мороз', 'anna.moroz'], ['Максим Поліщук', ''], ['Катерина Литвиненко', 'kate.lytv'], ['Остап Климченко', ''],
  ['Софія Марченко', 'sofiia.m'], ['Роман Захарченко', ''],
];
const WEIGHTS: Record<DocumentType, number> = {
  id_card: 5, foreign_passport: 4, criminal_record: 3, property_extract: 3, power_of_attorney: 2, marriage_certificate: 1,
};

const mulberry32 = (seed: number) => () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export interface DemoVisit {
  clientIndex: number;
  day: IsoDate;
  hour: number;
  minute: number;
  type: DocumentType;
  pickupDate: IsoDate;
  issuedAt: IsoDate | null;
}

/** Детерміновані демо-дані відносно `today`: ~4 місяці історії та кілька днів наперед. */
export function generateDemo(today: IsoDate, seed = 20260930) {
  const rnd = mulberry32(seed);
  const pick = <T>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)]!;
  const totalWeight = DOCUMENT_TYPE_KEYS.reduce((s, k) => s + WEIGHTS[k], 0);
  const pickType = (): DocumentType => {
    let r = rnd() * totalWeight;
    return DOCUMENT_TYPE_KEYS.find((k) => (r -= WEIGHTS[k]) < 0) ?? 'id_card';
  };
  const two = () => String(Math.floor(rnd() * 100)).padStart(2, '0');

  const clients = PEOPLE.map(([name, mail]) => ({
    name,
    phone: `+380 ${pick(['67', '50', '63', '93', '97', '68'])} ${100 + Math.floor(rnd() * 900)} ${two()} ${two()}`,
    email: mail ? `${mail}@ukr.net` : undefined,
  }));

  const visits: DemoVisit[] = [];
  for (let offset = -120; offset <= 5; offset++) {
    const day = addDays(today, offset);
    const weekday = isoWeekday(day);
    if (weekday === 7) continue;
    const count = weekday === 6 ? (rnd() < 0.4 ? 1 : 0) : Math.floor(rnd() * 4) + (offset > -45 ? 1 : 0);
    for (let k = 0; k < count; k++) {
      const type = pickType();
      const pickupDate = addDays(day, DOCUMENT_TYPES[type].processingDays + Math.floor(rnd() * 3));
      const late = pickupDate < today ? Math.round((Date.parse(today) - Date.parse(pickupDate)) / 864e5) : 0;
      const issuedAt = late > 0 && rnd() < 0.9 ? addDays(pickupDate, Math.min(late, Math.floor(rnd() * rnd() * 6))) : null;
      visits.push({
        clientIndex: Math.floor(rnd() * clients.length),
        day,
        hour: 9 + Math.floor(rnd() * 8),
        minute: pick([0, 15, 30, 45]),
        type,
        pickupDate,
        issuedAt,
      });
    }
  }
  const key = (v: DemoVisit) => `${v.day}T${String(v.hour).padStart(2, '0')}:${String(v.minute).padStart(2, '0')}`;
  visits.sort((a, b) => key(a).localeCompare(key(b)));
  return { clients, visits };
}
