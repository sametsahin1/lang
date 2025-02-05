import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-page1',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page1.component.html'
})
export class Page1Component {
  constructor(public translationService: TranslationService) {}

  translate(key: string): string {
    return this.translationService.translate(key);
  }

  getFeatureIcon(index: number): string {
    const icons = [
      'bi-translate',
      'bi-arrow-repeat',
      'bi-person-check',
      'bi-laptop'
    ];
    return icons[index] || 'bi-star';
  }
} 