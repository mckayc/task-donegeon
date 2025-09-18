export interface ThemeStyle {
  '--font-display': string;
  '--font-body': string;
  '--font-label': string;
  '--font-span'?: string;
  '--font-button'?: string;
  '--font-size-h1': string;
  '--font-size-h2': string;
  '--font-size-h3': string;
  '--font-size-body': string;
  '--font-size-label': string;
  '--font-size-span'?: string;
  '--color-h1'?: string;
  '--color-h2'?: string;
  '--color-h3'?: string;
  '--color-body'?: string;
  '--color-label'?: string;
  '--color-span'?: string;
  '--color-bg-primary-hsl': string;
  '--color-bg-secondary-hsl': string;
  '--color-bg-tertiary-hsl': string;
  '--color-text-primary-hsl': string;
  '--color-text-secondary-hsl': string;
  '--color-border-hsl': string;
  '--color-primary-hue': string;
  '--color-primary-saturation': string;
  '--color-primary-lightness': string;
  '--color-accent-hue': string;
  '--color-accent-saturation': string;
  '--color-accent-lightness': string;
  '--color-accent-light-hue': string;
  '--color-accent-light-saturation': string;
  '--color-accent-light-lightness': string;
  // New properties for Theme Editor
  '--color-text-muted-hsl'?: string;
  '--input-bg-hsl'?: string;
  '--button-radius'?: string;
}

export interface ThemeDefinition {
  id: string;
  name: string;
  isCustom: boolean;
  styles: ThemeStyle;
  createdAt?: string;
  updatedAt?: string;
}

export type Theme = ThemeDefinition;