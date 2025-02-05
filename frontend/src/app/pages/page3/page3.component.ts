import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-page3',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page3.component.html'
})
export class Page3Component {
  constructor(public languageService: LanguageService) {}

  get texts() {
    return this.languageService.lang;
  }
} 