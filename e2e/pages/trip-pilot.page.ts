import { expect, type Page } from '@playwright/test';

export class TripPilotPage {
  constructor(readonly page: Page) {}

  async visit(path = '/'): Promise<void> {
    await this.page.goto(path);
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  async navigate(name: string): Promise<void> {
    await this.page.getByRole('navigation').getByRole('link', { name }).click();
  }

  async choose(label: string, option: string): Promise<void> {
    await this.page.getByRole('combobox', { name: label }).click();
    await this.page.getByRole('option', { name: option, exact: true }).click();
  }

  async search(): Promise<void> {
    await this.page.getByRole('button', { name: 'Search', exact: true }).click();
  }

  async openAssistant(): Promise<void> {
    if (!(await this.page.getByRole('textbox', { name: 'Message the assistant' }).isVisible())) {
      await this.page.getByRole('button', { name: 'Assistant' }).click();
    }
  }
}
