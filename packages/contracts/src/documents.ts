/** Типи документів, які оформлює установа. Ключі стабільні й зберігаються в БД, підписи — лише для UI. */
export const DOCUMENT_TYPES = {
  id_card: { label: 'ID-картка', processingDays: 14 },
  foreign_passport: { label: 'Закордонний паспорт', processingDays: 20 },
  criminal_record: { label: 'Довідка про несудимість', processingDays: 10 },
  property_extract: { label: 'Витяг з реєстру нерухомості', processingDays: 3 },
  power_of_attorney: { label: 'Нотаріальна довіреність', processingDays: 1 },
  marriage_certificate: { label: 'Свідоцтво про шлюб', processingDays: 7 },
} as const satisfies Record<string, { label: string; processingDays: number }>;

export type DocumentType = keyof typeof DOCUMENT_TYPES;

export const DOCUMENT_TYPE_KEYS = Object.keys(DOCUMENT_TYPES) as [DocumentType, ...DocumentType[]];

export const documentLabel = (type: DocumentType): string => DOCUMENT_TYPES[type].label;
