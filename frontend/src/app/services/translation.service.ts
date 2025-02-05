import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, EMPTY } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { isPlatformBrowser } from '@angular/common';

export interface Language {
  code: string;
  name: string;
  isActive: boolean;
}

export interface TranslationData {
  [key: string]: string;
}

export interface TranslationResponse {
  [lang: string]: {
    [key: string]: string;
  };
}

export interface TranslationMap {
  [key: string]: {
    [lang: string]: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private apiUrl = environment.apiUrl;
  private currentLangSubject: BehaviorSubject<string>;
  private translationsSubject = new BehaviorSubject<TranslationMap>({});
  private languagesSubject = new BehaviorSubject<Language[]>([
    { code: 'tr', name: 'Türkçe', isActive: true },
    { code: 'en', name: 'English', isActive: true }
  ]);

  currentLang$: Observable<string>;
  translations$ = this.translationsSubject.asObservable();
  languages$ = this.languagesSubject.asObservable();

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    let initialLang = 'tr';
    if (isPlatformBrowser(this.platformId)) {
      const savedLang = localStorage.getItem('currentLang');
      if (savedLang) {
        initialLang = savedLang;
      }
    }

    this.currentLangSubject = new BehaviorSubject<string>(initialLang);
    this.currentLang$ = this.currentLangSubject.asObservable();

    this.loadLanguages().subscribe(() => {
      this.loadTranslations();
    });
  }

  loadLanguages(): Observable<Language[]> {
    console.log('Loading languages...');
    return new Observable(observer => {
      this.http.get<Language[]>(`${this.apiUrl}/languages`).subscribe({
        next: (languages) => {
          console.log('Service received languages:', languages);
          this.languagesSubject.next(languages);
          observer.next(languages);
          observer.complete();
        },
        error: (error) => {
          console.error('Error loading languages:', error);
          observer.error(error);
        }
      });
    });
  }

  loadTranslations() {
    const currentLang = this.currentLangSubject.value;
    this.http.get<TranslationData>(`${this.apiUrl}/translations/${currentLang}`)
      .subscribe({
        next: (response) => {
          const formattedTranslations: TranslationMap = {};
          Object.keys(response).forEach(key => {
            formattedTranslations[key] = {
              [currentLang]: response[key]
            };
          });
          this.translationsSubject.next(formattedTranslations);
        },
        error: (error) => console.error('Error loading translations:', error)
      });
  }

  setLanguage(lang: string) {
    console.log('Setting language to:', lang);
    this.currentLangSubject.next(lang);
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('currentLang', lang);
    }
    
    this.loadTranslations();
  }

  getCurrentLanguage(): string {
    return this.currentLangSubject.value;
  }

  translate(key: string): string {
    const translations = this.translationsSubject.value;
    const currentLang = this.currentLangSubject.value;
    
    if (translations[key] && translations[key][currentLang]) {
      return translations[key][currentLang];
    }
    
    return key; // Çeviri bulunamazsa key'i göster
  }

  getCurrentLanguageName(): string {
    const currentLang = this.currentLangSubject.value;
    const languages = this.languagesSubject.value;
    const language = languages.find(l => l.code === currentLang);
    return language?.name || 'Dil Seçin';
  }

  // API İşlemleri
  addTranslation(key: string, translations: TranslationMap): Observable<any> {
    return this.http.post(`${this.apiUrl}/translations`, { key, translations });
  }

  updateTranslation(lang: string, translations: { [key: string]: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/translations/${lang}`, translations)
      .pipe(
        catchError(error => {
          console.error(`Error updating translations for ${lang}:`, error);
          return EMPTY;
        })
      );
  }

  deleteTranslation(lang: string, key: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/translations/${lang}/${key}`);
  }

  addLanguage(language: { code: string; name: string }): Observable<Language> {
    return this.http.post<Language>(`${this.apiUrl}/languages`, language);
  }

  updateLanguage(language: Language): Observable<Language> {
    return this.http.put<Language>(`${this.apiUrl}/languages/${language.code}`, language);
  }

  deleteLanguage(code: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/languages/${code}`);
  }

  getLanguages(): Observable<Language[]> {
    return this.http.get<Language[]>(`${this.apiUrl}/languages`);
  }

  getAllTranslations(): Observable<TranslationResponse> {
    return this.http.get<TranslationResponse>(`${this.apiUrl}/translations`);
  }

  getAllTranslationsFormatted(): Observable<TranslationMap> {
    return this.getAllTranslations().pipe(
      map((response: TranslationResponse) => {
        const formattedTranslations: TranslationMap = {};
        
        Object.keys(response).forEach(lang => {
          Object.keys(response[lang]).forEach(key => {
            if (!formattedTranslations[key]) {
              formattedTranslations[key] = {};
            }
            formattedTranslations[key][lang] = response[lang][key];
          });
        });
        
        return formattedTranslations;
      })
    );
  }

  addNewTranslation(key: string, translations: { [lang: string]: string }) {
    // Mevcut çevirileri kopyala
    const currentTranslations = { ...this.translationsSubject.value };
    
    // Her dil için çeviriyi güncelle
    Object.keys(translations).forEach(lang => {
      // O dil için mevcut çevirileri al
      const existingTranslations = this.translationsSubject.value[lang] || {};
      
      // Yeni çeviriyi ekle
      const updatedTranslations = {
        ...existingTranslations,
        [key]: translations[lang]
      };

      // Backend'e gönder
      this.http.post(`${this.apiUrl}/translations/${lang}`, updatedTranslations)
        .pipe(
          catchError(error => {
            console.error(`Error updating translations for ${lang}:`, error);
            return EMPTY;
          })
        )
        .subscribe(response => {
          // State'i güncelle
          if (!currentTranslations[key]) {
            currentTranslations[key] = {};
          }
          currentTranslations[key][lang] = translations[lang];
          this.translationsSubject.next(currentTranslations);
        });
    });
  }

  updateTranslationForKey(key: string, lang: string, value: string) {
    const currentTranslations = { ...this.translationsSubject.value };
    if (!currentTranslations[key]) {
      currentTranslations[key] = {};
    }
    currentTranslations[key][lang] = value;
    
    const langTranslations = {
      [key]: value
    };
    
    this.updateTranslation(lang, langTranslations).subscribe(() => {
      this.translationsSubject.next(currentTranslations);
    });
  }
} 