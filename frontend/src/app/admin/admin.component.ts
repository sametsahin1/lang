import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { TranslationService, Language, TranslationData } from '../services/translation.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  languages: Language[] = [];
  translations: { lang: string; translations: TranslationData }[] = [];
  newLanguage = { code: '', name: '' };
  newTranslation = {
    key: '',
    value: '',
    translations: {} as TranslationData
  };
  apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    // Dilleri yükle
    this.http.get<Language[]>(`${this.apiUrl}/languages`).subscribe({
      next: (data) => {
        console.log('Loaded languages:', data); // Debug için
        this.languages = data;
      },
      error: (error) => console.error('Error loading languages:', error)
    });

    // Çevirileri yükle
    this.http.get<{ lang: string; translations: TranslationData }[]>(`${this.apiUrl}/translations`).subscribe({
      next: (data) => {
        console.log('Loaded translations:', data); // Debug için
        this.translations = data;
      },
      error: (error) => console.error('Error loading translations:', error)
    });
  }

  addLanguage() {
    if (this.newLanguage.code && this.newLanguage.name) {
      console.log('Adding language:', this.newLanguage); // Debug için log ekleyelim
      this.http.post<Language>(`${this.apiUrl}/languages`, this.newLanguage).subscribe({
        next: (response) => {
          console.log('Language added:', response); // Debug için log ekleyelim
          this.loadData();
          this.newLanguage = { code: '', name: '' };
        },
        error: (error) => {
          console.error('Error adding language:', error);
          // Hata mesajını kullanıcıya gösterelim
          alert('Dil eklenirken hata oluştu: ' + error.message);
        }
      });
    }
  }

  deleteLanguage(code: string) {
    this.http.delete(`${this.apiUrl}/languages/${code}`).subscribe({
      next: () => this.loadData(),
      error: (error) => console.error('Error deleting language:', error)
    });
  }

  addTranslation() {
    if (this.newTranslation.key) {
      const translations: TranslationData = {};
      this.languages.forEach(lang => {
        translations[lang.code] = this.newTranslation.translations[lang.code] || '';
      });

      this.translationService.addNewTranslation(
        this.newTranslation.key,
        translations
      );

      this.newTranslation = { key: '', value: '', translations: {} };
    }
  }

  getAllKeys(): string[] {
    const keySet = new Set<string>();
    this.translations.forEach(translation => {
      Object.keys(translation.translations || {}).forEach(key => keySet.add(key));
    });
    return Array.from(keySet);
  }

  deleteTranslationKey(key: string) {
    this.languages.forEach(lang => {
      const translation = this.translations.find(t => t.lang === lang.code);
      if (translation) {
        const updatedTranslations = { ...translation.translations };
        delete updatedTranslations[key];
        
        this.http.post(`${this.apiUrl}/translations/${lang.code}`, updatedTranslations).subscribe({
          next: () => this.loadData(),
          error: (error) => console.error('Error deleting translation:', error)
        });
      }
    });
  }

  updateTranslation(key: string, lang: string, value: string) {
    this.translationService.updateTranslationForKey(key, lang, value);
  }
} 