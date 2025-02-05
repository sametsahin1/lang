import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslationService, Language } from '../../services/translation.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit, OnDestroy {
  languages: Language[] = [
    { code: 'tr', name: 'Türkçe', isActive: true },
    { code: 'en', name: 'English', isActive: true }
  ];
  currentLang: string = 'tr';
  private subscriptions: Subscription[] = [];

  constructor(public translationService: TranslationService) {}

  ngOnInit() {
    // Dilleri yükle
    this.subscriptions.push(
      this.translationService.languages$.subscribe(
        languages => {
          console.log('Header received languages:', languages);
          if (languages && languages.length > 0) {
            this.languages = languages;
          }
        }
      )
    );

    // Aktif dili takip et
    this.subscriptions.push(
      this.translationService.currentLang$.subscribe(
        lang => {
          console.log('Header current language changed:', lang);
          this.currentLang = lang;
        }
      )
    );
  }

  ngOnDestroy() {
    // Subscription'ları temizle
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  changeLang(lang: string) {
    console.log('Changing language to:', lang);
    this.translationService.setLanguage(lang);
  }
} 