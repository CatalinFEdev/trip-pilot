import { TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { Home } from './home';
import { I18nService } from '../../core/i18n/i18n.service';

describe('Home', () => {
  it('renders translated feature and step content', async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [I18nService, provideNativeDateAdapter(), provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Plan it once.');
    expect(fixture.nativeElement.textContent).toContain('Compare travel options');
  });
});
