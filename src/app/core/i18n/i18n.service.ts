import { DOCUMENT } from '@angular/common';
import { Injectable, Signal, computed, inject, signal } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import en from '../../../assets/i18n/en.json';
import de from '../../../assets/i18n/de.json';
import { AppLanguage, TranslationTree } from '../../shared/models/app.model';

const LANGUAGE_STORAGE_KEY = 'trip-pilot-language';

function flattenTranslations(tree: TranslationTree, prefix = ''): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(tree)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      flat[fullKey] = value;
    } else {
      Object.assign(flat, flattenTranslations(value, fullKey));
    }
  }
  return flat;
}

const TRANSLATIONS: Record<AppLanguage, Record<string, string>> = {
  en: flattenTranslations(en),
  de: flattenTranslations(de),
};

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly document = inject(DOCUMENT);
  private readonly dateAdapter = inject<DateAdapter<Date>>(DateAdapter);
  private readonly selectedLanguage = signal<AppLanguage>(this.readStoredLanguage());

  readonly language: Signal<AppLanguage> = this.selectedLanguage.asReadonly();
  readonly locale = computed(() => (this.language() === 'de' ? 'de-DE' : 'en-GB'));

  constructor() {
    this.applyLanguage(this.language());
  }

  setLanguage(language: AppLanguage): void {
    this.selectedLanguage.set(language);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    this.applyLanguage(language);
  }

  t(key: string, params: Record<string, string | number> = {}): string {
    const template = TRANSLATIONS[this.language()][key] ?? TRANSLATIONS.en[key] ?? key;
    return template.replace(/\{(\w+)\}/g, (_, parameter: string) =>
      String(params[parameter] ?? ''),
    );
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat(this.locale(), { style: 'currency', currency: 'EUR' }).format(
      amount,
    );
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat(this.locale()).format(value);
  }

  formatDate(
    value: string | Date,
    options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
  ): string {
    return new Intl.DateTimeFormat(this.locale(), options).format(new Date(value));
  }

  formatTime(value: string | Date): string {
    return this.formatDate(value, { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  private readStoredLanguage(): AppLanguage {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'de' ? 'de' : 'en';
  }

  private applyLanguage(language: AppLanguage): void {
    this.document.documentElement.lang = language;
    this.dateAdapter.setLocale(language === 'de' ? 'de-DE' : 'en-GB');
  }
}
