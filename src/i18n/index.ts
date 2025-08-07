import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translations
import en from './translations/en.json';
import af from './translations/af.json';

class InternationalizationService {
  private i18n: I18n;
  private static LANGUAGE_KEY = 'selected_language';
  
  constructor() {
    this.i18n = new I18n({
      en,
      af,
    });
    
    // Set default configuration
    this.i18n.enableFallback = true;
    this.i18n.defaultLocale = 'en';
    
    this.initializeLanguage();
  }
  
  private async initializeLanguage(): Promise<void> {
    try {
      // Check for stored language preference
      const storedLanguage = await AsyncStorage.getItem(InternationalizationService.LANGUAGE_KEY);
      
      if (storedLanguage) {
        this.i18n.locale = storedLanguage;
      } else {
        // Use device locale if supported, otherwise default to English
        const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';
        const supportedLocale = deviceLocale.startsWith('af') ? 'af' : 'en';
        this.i18n.locale = supportedLocale;
        await this.setLanguage(supportedLocale);
      }
    } catch (error) {
      console.error('Initialize language error:', error);
      this.i18n.locale = 'en'; // Fallback to English
    }
  }
  
  async setLanguage(locale: 'en' | 'af'): Promise<void> {
    try {
      this.i18n.locale = locale;
      await AsyncStorage.setItem(InternationalizationService.LANGUAGE_KEY, locale);
    } catch (error) {
      console.error('Set language error:', error);
    }
  }
  
  getCurrentLanguage(): 'en' | 'af' {
    return this.i18n.locale as 'en' | 'af';
  }
  
  translate(key: string, options?: any): string {
    return this.i18n.t(key, options);
  }
  
  // Convenience method for common translations
  t = (key: string, options?: any): string => {
    return this.translate(key, options);
  }
  
  // Get available languages
  getAvailableLanguages(): Array<{ code: 'en' | 'af'; name: string; nativeName: string }> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
    ];
  }
  
  // Format dates according to locale
  formatDate(date: Date, format: 'short' | 'medium' | 'long' = 'medium'): string {
    const locale = this.getCurrentLanguage() === 'af' ? 'af-ZA' : 'en-ZA';
    
    const formatOptions = {
      short: { day: '2-digit' as const, month: '2-digit' as const, year: 'numeric' as const },
      medium: { day: '2-digit' as const, month: 'short' as const, year: 'numeric' as const },
      long: { weekday: 'long' as const, day: '2-digit' as const, month: 'long' as const, year: 'numeric' as const },
    };
    const options: Intl.DateTimeFormatOptions = formatOptions[format];
    
    return new Intl.DateTimeFormat(locale, options).format(date);
  }
  
  // Format time according to locale
  formatTime(date: Date, format: '12h' | '24h' = '24h'): string {
    const locale = this.getCurrentLanguage() === 'af' ? 'af-ZA' : 'en-ZA';
    
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: format === '12h',
    }).format(date);
  }
  
  // Format numbers according to locale
  formatNumber(number: number): string {
    const locale = this.getCurrentLanguage() === 'af' ? 'af-ZA' : 'en-ZA';
    return new Intl.NumberFormat(locale).format(number);
  }
  
  // Get plural form for medication counting
  getPluralForm(count: number, singular: string, plural?: string): string {
    if (count === 1) {
      return this.t(singular);
    } else {
      return this.t(plural || `${singular}_plural`, { count });
    }
  }
}

export default new InternationalizationService();
