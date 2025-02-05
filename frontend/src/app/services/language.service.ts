import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface LanguageData {
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private apiUrl = 'http://localhost:3000/api';
  private currentLanguage = new BehaviorSubject<string>('tr');
  private languageData = new BehaviorSubject<LanguageData>({});
  
  public currentLang = 'tr';
  public lang: LanguageData = {};

  constructor(private http: HttpClient) {
    this.loadLanguage(this.currentLang);
  }

  setLanguage(lang: string) {
    this.currentLang = lang;
    this.currentLanguage.next(lang);
    this.loadLanguage(lang);
  }

  private loadLanguage(lang: string) {
    this.http.get<LanguageData>(`${this.apiUrl}/translations/${lang}`).pipe(
      tap(data => {
        this.lang = data;
        this.languageData.next(data);
      })
    ).subscribe();
  }

  getCurrentLanguage(): Observable<LanguageData> {
    return this.languageData.asObservable();
  }
} 