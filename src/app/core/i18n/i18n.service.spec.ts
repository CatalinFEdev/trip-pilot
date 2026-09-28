import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { afterEach, describe, expect, it } from 'vitest';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  afterEach(() => localStorage.removeItem('trip-pilot-language'));

  it('switches to German and persists the visitor preference', () => {
    TestBed.configureTestingModule({ providers: [provideNativeDateAdapter()] });
    const service = TestBed.inject(I18nService);

    service.setLanguage('de');

    expect(service.language()).toBe('de');
    expect(service.t('nav.flights')).toBe('Flüge');
    expect(localStorage.getItem('trip-pilot-language')).toBe('de');
    expect(TestBed.inject(DOCUMENT).documentElement.lang).toBe('de');
  });
});
