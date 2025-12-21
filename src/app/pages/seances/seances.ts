import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-seances-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seances.html',
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class Seances {
  private sanitizer = inject(DomSanitizer);

  // Données
  seances = signal<any[]>([
    { id: '1', date: '2025-12-19', heure: '10:00', typeSeance: 'Yoga', coachId: '1', clientIds: ['1', '2'] },
    { id: '2', date: '2025-12-19', heure: '14:00', typeSeance: 'Musculation', coachId: '2', clientIds: ['1'] },
    { id: '3', date: '2025-12-20', heure: '09:00', typeSeance: 'Cardio', coachId: '1', clientIds: ['2'] },
  ]);

  clients = signal<any[]>([
    { id: '1', numeroClient: 'C001', nom: 'Jean Dupont', email: 'jean@email.com', dateInscription: '2025-01-15' },
    { id: '2', numeroClient: 'C002', nom: 'Marie Martin', email: 'marie@email.com', dateInscription: '2025-02-01' },
  ]);

  coachs = signal<any[]>([
    { id: '1', nom: 'Sophie Laurent', email: 'sophie@gym.com', specialite: 'Yoga' },
    { id: '2', nom: 'Marc Dubois', email: 'marc@gym.com', specialite: 'Musculation' },
  ]);

  // État du Calendrier
  currentDate = signal(new Date());
  selectedDate = signal<string | null>(null);
  isFormOpen = signal(false);
  editingSeance = signal<any>(null);

  // Formulaire (Modèle simple)
  formData = {
    date: new Date().toISOString().split('T')[0],
    heure: '10:00',
    typeSeance: '',
    coachId: '',
    clientIds: [] as string[]
  };

  // Icônes SVG
  readonly icons: Record<string, SafeHtml> = {
    plus: this.bypass(`<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>`),
    chevronLeft: this.bypass(`<polyline points="15 18 9 12 15 6"></polyline>`),
    chevronRight: this.bypass(`<polyline points="9 18 15 12 9 6"></polyline>`),
    clock: this.bypass(`<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>`),
    edit: this.bypass(`<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>`),
    trash: this.bypass(`<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>`),
    award: this.bypass(`<circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>`),
    users: this.bypass(`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`)
  };

  // --- Logique Calendrier ---
  calendarData = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    
    return { days, year, month };
  });

  monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  getSeancesForDate(dateStr: string) {
    return this.seances().filter(s => s.date === dateStr).sort((a, b) => a.heure.localeCompare(b.heure));
  }

  changeMonth(delta: number) {
    const next = new Date(this.currentDate());
    next.setMonth(next.getMonth() + delta);
    this.currentDate.set(next);
  }

  // --- Handlers ---
  handleDateClick(day: number) {
    const { year, month } = this.calendarData();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    this.selectedDate.set(dateStr);
  }

  openForm(seance?: any, dateStr?: string) {
    if (seance) {
      this.editingSeance.set(seance);
      this.formData = { ...seance };
    } else {
      this.editingSeance.set(null);
      this.formData = {
        date: dateStr || new Date().toISOString().split('T')[0],
        heure: '10:00',
        typeSeance: '',
        coachId: '',
        clientIds: []
      };
    }
    this.isFormOpen.set(true);
  }

  handleSubmit() {
    if (this.editingSeance()) {
      this.seances.update(list => list.map(s => s.id === this.editingSeance()?.id ? { ...this.formData, id: s.id } : s));
    } else {
      this.seances.update(list => [...list, { ...this.formData, id: Date.now().toString() }]);
    }
    this.closeForm();
  }

  handleDelete(id: string) {
    this.seances.update(list => list.filter(s => s.id !== id));
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.editingSeance.set(null);
  }

  getCoachName(id: string) { return this.coachs().find(c => c.id === id)?.nom || 'N/A'; }

  getClientNames(ids: string[]) {
    return this.clients().filter(c => ids.includes(c.id)).map(c => c.nom).join(', ');
  }

  private bypass(svg: string) { return this.sanitizer.bypassSecurityTrustHtml(svg); }
}