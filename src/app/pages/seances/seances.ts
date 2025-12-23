import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { trigger, transition, style, animate } from '@angular/animations';

import { Client as ClientService } from '../../services/client';
import { Coach as CoachService } from '../../services/coach';
import { Seance as SeanceService } from '../../services/seance';
import Sweet from 'sweetalert2';
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
export class Seances implements OnInit {
  private sanitizer = inject(DomSanitizer);
  private clientService = inject(ClientService);
  private coachService = inject(CoachService);
  private seanceService = inject(SeanceService);

  seances = signal<any[]>([]);
  clients = signal<any[]>([]);
  coachs = signal<any[]>([]);

  // Enumération basée sur votre diagramme UML
  typeSeanceEnum = ['MUSCULATION', 'YOGA', 'AEROBIC', 'CARDIO'];

  currentDate = signal(new Date());
  selectedDate = signal<string | null>(new Date().toISOString().split('T')[0]);
  isFormOpen = signal(false);
  editingSeance = signal<any>(null);

  // Synchronisé avec les champs du formulaire Figma
  formData = {
    date: '',
    heure: '10:00',
    typeSeance: '',
    coachId: '',
    clientIds: [] as any[]
  };

  readonly icons: Record<string, SafeHtml> = {
    plus: this.bypass(`<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>`),
    chevronLeft: this.bypass(`<polyline points="15 18 9 12 15 6"></polyline>`),
    chevronRight: this.bypass(`<polyline points="9 18 15 12 9 6"></polyline>`),
    edit: this.bypass(`<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>`),
    trash: this.bypass(`<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>`),
    clock: this.bypass(`<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>`),
    user: this.bypass(`<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>`),
    users: this.bypass(`<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>`),
  };

  ngOnInit() {
    this.refreshData();
  }

  refreshData() {
    this.seanceService.getAll().subscribe(data => this.seances.set(data));
    this.clientService.getAll().subscribe(data => this.clients.set(data));
    this.coachService.getAll().subscribe(data => this.coachs.set(data));
  }

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
    return this.seances().filter(s => s.date === dateStr);
  }

  handleDateClick(day: number) {
    const { year, month } = this.calendarData();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    this.selectedDate.set(dateStr);
  }

  toggleClientSelection(clientId: any) {
    const index = this.formData.clientIds.indexOf(clientId);
    if (index > -1) this.formData.clientIds.splice(index, 1);
    else this.formData.clientIds.push(clientId);
  }

  openForm(seance?: any, dateStr?: string) {
    if (seance) {
      this.editingSeance.set(seance);
      this.formData = {
        date: seance.date,
        heure: seance.heure,
        typeSeance: seance.typeSeance,
        coachId: seance.coach?.id,
        clientIds: seance.participants?.map((p: any) => p.id) || []
      };
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
    const payload = {
      id: this.editingSeance()?.id,
      date: this.formData.date,
      heure: this.formData.heure,
      typeSeance: this.formData.typeSeance,
      coach: { id: this.formData.coachId },
      participants: this.formData.clientIds.map(id => ({ id: id }))
    };

    this.seanceService.save(payload).subscribe({
      next: () => {
        this.refreshData();
        this.closeForm();

        Sweet.fire({
          title: 'Succès !',
          text: 'La séance a été enregistrée avec succès.',
          icon: 'success',
          confirmButtonColor: '#2563eb',
          timer: 2000
        });
      },
      error: (err) => {
        Sweet.fire('Erreur', "Impossible d'enregistrer la séance", 'error');
      }
    });
  }

  handleDelete(id: any) {
    Sweet.fire({
      title: 'Êtes-vous sûr ?',
      text: "",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb', // Bleu comme ton bouton "Ajouter"
      cancelButtonColor: '#94a3b8',  // Gris ardoise
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      reverseButtons: true // Met l'annulation à gauche
    }).then((result) => {
      if (result.isConfirmed) {
        this.seanceService.delete(id).subscribe({
          next: () => {
            this.refreshData();
            // Notification de succès après suppression
            Sweet.fire({
              title: 'Supprimé !',
              text: 'La séance a été supprimée.',
              icon: 'success',
              confirmButtonColor: '#2563eb',
              timer: 1500
            });
          },
          error: (err) => {
            Sweet.fire('Erreur', 'Impossible de supprimer la séance', 'error');
          }
        });
      }
    });
  }

  closeForm() { this.isFormOpen.set(false); }

  changeMonth(delta: number) {
    const next = new Date(this.currentDate());
    next.setMonth(next.getMonth() + delta);
    this.currentDate.set(next);
  }

  private bypass(svg: string) { return this.sanitizer.bypassSecurityTrustHtml(svg); }
}
