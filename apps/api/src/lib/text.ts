export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Регулярний вираз для пошуку підрядка без урахування регістру. */
export const containsRegex = (value: string) => new RegExp(escapeRegex(value), 'i');

export const phoneDigits = (phone: string) => phone.replace(/\D/g, '');
