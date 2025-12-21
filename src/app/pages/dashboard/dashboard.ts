import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeInLeft', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ])
    ])
  ]
})
export class Dashboard {
  private sanitizer = inject(DomSanitizer);

  @Input() clients: any[] = [];
  @Input() coachs: any[] = [];
  @Input() seances: any[] = [];
  @Input() abonnements: any[] = [];

  // Chemins SVG bruts
  private readonly rawIcons = {
    users: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>`,
    userCheck: `<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>`,
    calendar: `<rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>`,
    dollarSign: `<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>`,
    trendingUp: `<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>`,
    trendingDown: `<polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/>`
  };

  // Helper pour sécuriser le SVG
  private bypass(svg: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  // Signaux calculés
  stats = computed(() => {
    const totalCA = this.calculateCA();
    const moisCA = this.calculateCAMois();
    const seancesSemaine = this.calculateSeancesSemaine();

    return [
      { title: 'Clients', value: this.clients.length, icon: this.bypass(this.rawIcons.users), color: 'blue', bgColor: 'bg-blue-50', iconBg: 'bg-blue-500', textColor: 'text-blue-600' },
      { title: 'Coachs', value: this.coachs.length, icon: this.bypass(this.rawIcons.userCheck), color: 'purple', bgColor: 'bg-purple-50', iconBg: 'bg-purple-500', textColor: 'text-purple-600' },
      { title: 'Séances cette semaine', value: seancesSemaine, icon: this.bypass(this.rawIcons.calendar), color: 'green', bgColor: 'bg-green-50', iconBg: 'bg-green-500', textColor: 'text-green-600' },
      { title: 'Chiffre d\'affaires total', value: `${totalCA.toFixed(2)} €`, icon: this.bypass(this.rawIcons.dollarSign), color: 'orange', bgColor: 'bg-orange-50', iconBg: 'bg-orange-500', textColor: 'text-orange-600', subValue: `${moisCA.toFixed(2)} € ce mois`, subValueColor: 'text-orange-500' },
    ];
  });

  chiffreAffairesTotal = computed(() => this.calculateCA());
  paiementsEnAttente = computed(() => this.abonnements.reduce((t:any, a:any) => t + a.paiements.filter((p:any) => p.statut === 'en_attente').reduce((s:any, p:any) => s + p.montant, 0), 0));
  
  iconTrendingUp = computed(() => this.bypass(this.rawIcons.trendingUp));
  iconTrendingDown = computed(() => this.bypass(this.rawIcons.trendingDown));

  // Logique métier
  private calculateCA(): number {
    return this.abonnements.reduce((t:any, a:any) => t + a.paiements.filter((p:any) => p.statut === 'payé').reduce((s:any, p:any) => s + p.montant, 0), 0);
  }

  private calculateCAMois(): number {
    const today = new Date();
    return this.abonnements.reduce((t, a) => t + a.paiements.filter((p:any) => {
      if (p.statut !== 'payé' || !p.datePaiement) return false;
      const d = new Date(p.datePaiement);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    }).reduce((s:any, p:any) => s + p.montant, 0), 0);
  }

  private calculateSeancesSemaine(): number {
    const today = new Date();
    const start = new Date(today.setDate(today.getDate() - today.getDay() + 1));
    const end = new Date(today.setDate(start.getDate() + 6));
    return this.seances.filter(s => {
      const d = new Date(s.date);
      return d >= start && d <= end;
    }).length;
  }
}