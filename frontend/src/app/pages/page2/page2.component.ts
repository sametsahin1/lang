import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-page2',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './page2.component.html'
})
export class Page2Component {
  constructor(public languageService: LanguageService) {}

  get texts() {
    return this.languageService.lang;
  }
} 