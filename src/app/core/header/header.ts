import { Component, signal, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.html'
})
export class Header {
  private sanitizer = inject(DomSanitizer);
  // État local réactif
  isMobileMenuOpen = signal(false);
  activeTab = signal('dashboard');
  constructor(private router:Router){}
  // Événement pour informer le composant parent du changement d'onglet
  @Output() tabChange = new EventEmitter<string>();

  // Chemins SVG pour éviter les bugs de bibliothèques tierces
  readonly iconPaths = {
    dashboard: this.bypass(`<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>`),
    clients: this.bypass(`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`),
    coachs: this.bypass(`<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>`),
    seances: this.bypass(`<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>`),
    menu: this.bypass(`<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>`),
    close: this.bypass(`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`)
  };

  tabs = [
    { id: 'dashboard', label: 'Tableau De Bord', icon: this.iconPaths.dashboard },
    { id: 'clients', label: 'Clients', icon: this.iconPaths.clients },
    { id: 'coachs', label: 'Entraineurs', icon: this.iconPaths.coachs },
    { id: 'seances', label: 'Séances', icon: this.iconPaths.seances },
  ];

  private bypass(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  toggleMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  selectTab(tabId: string) {
    this.activeTab.set(tabId);
    this.router.navigateByUrl(tabId);
    this.isMobileMenuOpen.set(false);
  }
}