import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Client } from '../../services/client';
import Swal from 'sweetalert2';
import { Abonnement } from '../../services/abonnement';
import { Paiement } from '../../services/paiement';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './clients.html',
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger(
              '50ms',
              animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
            ),
          ],
          { optional: true }
        ),
      ]),
    ]),
    trigger('modalAnim', [
      transition(':enter', [style({ opacity: 0 }), animate('200ms', style({ opacity: 1 }))]),
      transition(':leave', [animate('200ms', style({ opacity: 0 }))]),
    ]),
  ],
})
export class Clients implements OnInit {
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);
  private abonnementService = inject(Abonnement);
  private paiementService = inject(Paiement);

  // État des données (Signals)
  clients = signal<any[]>([]);

  abonnements = signal<any[]>([]);

  // État de l'UI
  selectedClient = signal<any>(null);
  isFormOpen = signal(false);
  isPaiementFormOpen = signal(false);
  isAbonnementFormOpen = signal(false);

  editingClient = signal<any>(null);
  editingPaiement = signal<{ abonnementId: string; paiement: any } | null>(null);
  editingAbonnement = signal<any>(null);

  // Filtres
  filterStatut = signal<'tous' | 'payé' | 'en_attente'>('tous');

  // Formulaires
  clientForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    clientNumber: [null],
    inscriptionDate: [new Date().toISOString().split('T')[0], Validators.required],
  });

  paiementForm = this.fb.group({
    datePaiement: [new Date().toISOString().split('T')[0]],
    montant: [0, [Validators.required, Validators.min(0)]],
    statut: ['en_attente', Validators.required],
  });

  abonnementForm = this.fb.group({
    type: ['', Validators.required],
    prix: [0, Validators.required],
    dureeMois: [1, Validators.required],
    dateDebut: [new Date().toISOString().split('T')[0], Validators.required],
  });

  // Données de configuration
  modesPaiement = ['Carte Bancaire', 'Espèces', 'Virement', 'Chèque'];
  typesAbonnement = [
    { label: 'Mensuel', duree: 12, prixSuggere: 50, frequencePaiement: 1 },
    { label: 'Trimestriel', duree: 12, prixSuggere: 135, frequencePaiement: 3 },
    { label: 'Semestriel', duree: 12, prixSuggere: 250, frequencePaiement: 6 },
    { label: 'Annuel', duree: 12, prixSuggere: 450, frequencePaiement: 12 },
  ];

  // Icônes SVG
  readonly icons: Record<string, SafeHtml> = {
    plus: this.bypass(
      `<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>`
    ),
    trash: this.bypass(
      `<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>`
    ),
    edit: this.bypass(
      `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>`
    ),
    back: this.bypass(
      `<line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>`
    ),
    mail: this.bypass(
      `<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>`
    ),
    calendar: this.bypass(
      `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>`
    ),
    dollar: this.bypass(
      `<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>`
    ),
    check: this.bypass(`<polyline points="20 6 9 17 4 12"></polyline>`),
    alert: this.bypass(
      `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>`
    ),
    phone: this.bypass(
      `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>`
    ),
  };

  constructor(private clientservice: Client) {}

  ngOnInit(): void {
    this.getAllClient();
  }

  getAllClient() {
    this.clientservice.getAll().subscribe({
      next: (res: any) => {
        this.clients.set(res);
      },
    });
  }

  private bypass(svg: string) {
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }

  // --- LOGIQUE MÉTIER ---

  filteredPaiements = computed(() => {
    const allPaiements = this.paiementsDuClient();
    const currentFilter = this.filterStatut();
    if (currentFilter === 'tous') return allPaiements;
    return allPaiements.filter((p: any) => {
      return p.statut === currentFilter;
    });
  });
  // Handlers Clients
  handleClientSubmit() {
    if (this.clientForm.invalid) return;
    const data = this.clientForm.value as any;
    if (this.editingClient()) {
      data.id = this.editingClient().id;
    }
    this.clientservice.save(data).subscribe({
      next: (res: any) => {
        if (data.id) {
          Swal.fire('Modifié', 'Client modifié avec succès', 'success');
        } else {
          Swal.fire('Ajouté', 'Client créé avec succès', 'success');
        }
        this.getAllClient();
      },
    });
    this.closeClientForm();
  }

  async handleDeleteClient(id: string, event: Event) {
    event.stopPropagation();
    this.clientservice.canBeDeleted(id).subscribe({
      next: async (res: any) => {
        if (res) {
          let result = await Swal.fire({
            title: 'Voulez vous supprimer cet client',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Oui',
            cancelButtonText: 'Annuler',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
          });
          if (!result.isConfirmed) return;

          this.clientservice.delete(id).subscribe({
            next: () => {
              this.getAllClient();
            },
          });
        }else{
          Swal.fire('Info','Vous ne pouvez pas supprimer cette client car il possède déjà un abonnement','info');
        }
      },
    });
  }

  // Handlers Abonnements
  handleTypeChange(type: string) {
    const selected = this.typesAbonnement.find((t) => t.label.toUpperCase() === type.toUpperCase());
    if (selected) {
      this.abonnementForm.patchValue({
        prix: selected.prixSuggere,
        dureeMois: selected.duree,
      });
    }
  }

  handleAbonnementSubmit() {
    const client = this.selectedClient();
    if (!client || this.abonnementForm.invalid) return;

    const val = this.abonnementForm.value as any;
    const abonnementData = {
      ...val,
      durreMois: val.dureeMois,
      client: { id: client.id },
    };

    if (this.editingAbonnement()) {
      const id = this.editingAbonnement().id;
      this.abonnementService.save({ ...abonnementData, id: id }).subscribe({
        next: (res) => {
          Swal.fire('Modifié', "L'abonnement a été mis à jour", 'success');
          this.selectClient(client);
          this.isAbonnementFormOpen.set(false);
        },
      });
    } else {
      this.abonnementService.save(abonnementData).subscribe({
        next: (res) => {
          Swal.fire('Ajouté', 'Abonnement créé avec succès', 'success');
          this.selectClient(client);
          this.isAbonnementFormOpen.set(false);
        },
      });
    }
  }
  getAboForClient(clientId: any) {
    return this.abonnements().find((a) => a.client && a.client.id == clientId);
  }

  getTotals(abo: any) {
    if (!abo || !abo.paiements) return { paye: 0, restant: 0 };

    const paiements = abo.paiements || [];

    const paye = paiements
      .filter((p: any) => p && p.statut === 'payé')
      .reduce((s: number, p: any) => s + (p.montant || 0), 0);

    const restant = paiements
      .filter((p: any) => p && p.statut === 'en_attente')
      .reduce((s: number, p: any) => s + (p.montant || 0), 0);

    return { paye, restant };
  }

  // UI Controls
  openClientForm(client?: any) {
    if (client) {
      this.editingClient.set(client);
      this.clientForm.patchValue(client as any);
    } else {
      this.editingClient.set(null);
      this.clientForm.reset({ inscriptionDate: new Date().toISOString().split('T')[0] });
    }
    this.isFormOpen.set(true);
  }

  closeClientForm() {
    this.isFormOpen.set(false);
    this.editingClient.set(null);
  }

  currentAbonnement = signal<any>(null);
  selectClient(client: any) {
    this.selectedClient.set(client);
    this.abonnementService.getAbonnementsByClient(client.id).subscribe({
      next: (data: any) => {
        this.abonnements.set(Array.isArray(data) ? data : [data]);
        if (data) {
          this.currentAbonnement.set(Array.isArray(data) ? data[0] : data);
          const aboId = Array.isArray(data) ? data[0].id : data.id;
          this.paiementService.getByAbonnement(aboId).subscribe((res) => {
            this.paiementsDuClient.set(res);
          });
        }
      },
      error: () => {
        this.abonnements.set([]);
        this.currentAbonnement.set(null);
        this.paiementsDuClient.set([]);
      },
    });
  }
  async handleDeleteAbonnement(id: any, event: Event) {
    event.stopPropagation();

    const result = await Swal.fire({
      title: "Supprimer l'abonnement ?",
      text: 'Cette action est irréversible et supprimera également les paiements associés.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    });

    if (result.isConfirmed) {
      this.abonnementService.delete(id).subscribe({
        next: () => {
          Swal.fire('Supprimé!', "L'abonnement a été supprimé.", 'success');
          this.abonnements.update((list) => list.filter((a) => a.id !== id));
          this.selectClient(this.selectedClient());
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Erreur', "Impossible de supprimer l'abonnement.", 'error');
        },
      });
    }
  }
  openAbonnementForm(abo?: any) {
    if (abo) {
      this.editingAbonnement.set(abo);
      this.abonnementForm.patchValue({
        type: abo.type,
        prix: abo.prix,
        dureeMois: abo.durreMois,
        dateDebut: abo.dateDebut,
      });
    } else {
      this.editingAbonnement.set(null);
      this.abonnementForm.reset({
        dateDebut: new Date().toISOString().split('T')[0],
      });
    }
    this.isAbonnementFormOpen.set(true);
  }

  openPaiementForm(abo: any) {
    this.editingAbonnement.set(abo);
    this.editingPaiement.set(null);
    this.paiementForm.reset({
      datePaiement: new Date().toISOString().split('T')[0],
      montant: 0,
      statut: 'en_attente',
    });
    this.isPaiementFormOpen.set(true);
  }

  openPaiementEdit(p: any) {
    this.editingPaiement.set(p);
    this.paiementForm.patchValue({
      datePaiement: p.datePaiement,
      montant: p.montant,
      statut: p.statut,
    });
    this.isPaiementFormOpen.set(true);
  }
  handlePaiementSubmit() {
    if (this.paiementForm.invalid) return;

    const val = this.paiementForm.value;
    const pData = {
      ...val,
      abonnement: { id: this.currentAbonnement().id },
    };
    if (this.editingPaiement()) {
      const id = (this.editingPaiement() as any).id;

      this.paiementService.savePaiement({ ...pData, id: id }).subscribe({
        next: () => {
          Swal.fire('Modifié', 'Paiement mis à jour', 'success');
          this.isPaiementFormOpen.set(false);
          this.selectClient(this.selectedClient());
        },
      });
    } else {
      this.paiementService.savePaiement(pData).subscribe({
        next: () => {
          Swal.fire('Ajouté', 'Paiement enregistré', 'success');
          this.isPaiementFormOpen.set(false);
          this.selectClient(this.selectedClient());
        },
      });
    }
  }

  paiementsDuClient = signal<any[]>([]);

  protected readonly JSON = JSON;

  async handleDeletePaiement(id: any) {
    const result = await Swal.fire({
      title: 'Supprimer ce paiement ?',
      text: 'Cette action est irréversible !',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    });

    if (result.isConfirmed) {
      this.paiementService.deletePaiement(id).subscribe({
        next: () => {
          Swal.fire('Supprimé!', 'Le paiement a été supprimé.', 'success');
          this.selectClient(this.selectedClient());
        },
        error: (err) => {
          console.error(err);
          Swal.fire('Erreur', 'Impossible de supprimer le paiement.', 'error');
        },
      });
    }
  }
}
