import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Client } from '../../services/client';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './clients.html',
  animations: [
    trigger('listAnimation', [
      transition('* <=> *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger('50ms', animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })))
        ], { optional: true })
      ])
    ]),
    trigger('modalAnim', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class Clients implements OnInit{
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);

  // État des données (Signals)
  clients = signal<any[]>([]);

  
    // { id: '1', numeroClient: 'C001', nom: 'Jean Dupont', email: 'jean.dupont@email.com', dateInscription: '2025-01-15' },
    // { id: '2', numeroClient: 'C002', nom: 'Marie Martin', email: 'marie.martin@email.com', dateInscription: '2025-02-01' },
 

  abonnements = signal<any[]>([
    {
      id: '1', clientId: '1', type: 'Mensuel', prix: 50.0, dureeMois: 12, dateDebut: '2025-01-01', dateFin: '2025-12-31',
      paiements: [
        { id: 'p1', datePaiement: '2025-01-05', montant: 50.0, modePaiement: 'Carte Bancaire', statut: 'payé', dateEcheance: '2025-01-01' },
        { id: 'p2', datePaiement: '2025-02-03', montant: 50.0, modePaiement: 'Carte Bancaire', statut: 'payé', dateEcheance: '2025-02-01' },
        { id: 'p3', datePaiement: '', montant: 50.0, modePaiement: '', statut: 'en_attente', dateEcheance: '2025-03-01' },
      ]
    }
  ]);

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
  filterDateDebut = signal('');
  filterDateFin = signal('');

  // Formulaires
  clientForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone:['',Validators.required],
    clientNumber:['',Validators.required],
    inscriptionDate: [new Date().toISOString().split('T')[0], Validators.required]
  });

  paiementForm = this.fb.group({
    datePaiement: [new Date().toISOString().split('T')[0]],
    montant: [0, [Validators.required, Validators.min(0)]],
    modePaiement: [''],
    dateEcheance: [new Date().toISOString().split('T')[0], Validators.required],
    statut: ['en_attente' as 'payé' | 'en_attente', Validators.required]
  });

  abonnementForm = this.fb.group({
    type: ['', Validators.required],
    prix: [0, Validators.required],
    dureeMois: [1, Validators.required],
    dateDebut: [new Date().toISOString().split('T')[0], Validators.required]
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
    plus: this.bypass(`<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>`),
    trash: this.bypass(`<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>`),
    edit: this.bypass(`<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>`),
    back: this.bypass(`<line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>`),
    mail: this.bypass(`<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>`),
    calendar: this.bypass(`<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>`),
    dollar: this.bypass(`<line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>`),
    check: this.bypass(`<polyline points="20 6 9 17 4 12"></polyline>`),
    alert: this.bypass(`<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>`),
     phone: this.bypass(`<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>`)
  };

  constructor(private clientservice:Client){}

  ngOnInit(): void {
    this.getAllClient();
  }

  getAllClient(){
    this.clientservice.getAll().subscribe({
      next:(res:any)=>{
        this.clients.set(res);
      }
    })
  }

  private bypass(svg: string) { return this.sanitizer.bypassSecurityTrustHtml(svg); }

  // --- LOGIQUE MÉTIER ---

  filteredPaiements = computed(() => {
    const selected = this.selectedClient();
    if (!selected) return [];
    const abo = this.abonnements().find(a => a.clientId === selected.id);
    if (!abo) return [];

    return abo.paiements.filter((p:any) => {
      if (this.filterStatut() !== 'tous' && p.statut !== this.filterStatut()) return false;
      const date = p.statut === 'payé' ? p.datePaiement : p.dateEcheance;
      if (this.filterDateDebut() && date < this.filterDateDebut()) return false;
      if (this.filterDateFin() && date > this.filterDateFin()) return false;
      return true;
    });
  });

  // Handlers Clients
  handleClientSubmit() {
    if (this.clientForm.invalid) return;
    const data = this.clientForm.value as any;
    if (this.editingClient()) {
      data.id=this.editingClient().id;
      // this.clients.update(list => list.map(c => c.id === this.editingClient()?.id ? { ...c, ...data } : c));
    }
    this.clientservice.save(data).subscribe({
      next:(res:any)=>{
        this.getAllClient();
      }
    })
    this.closeClientForm();
  }

  async handleDeleteClient(id: string, event: Event) {
    event.stopPropagation();
    let result  = await Swal.fire({
      title: "Voulez vous supprimmer cet client",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Oui",
      cancelButtonText: "Annuler",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });
    if(!result.isConfirmed) return;
    
    this.clientservice.delete(id).subscribe({
      next:()=>{
        this.getAllClient();
      }
    })
    // this.clients.update(list => list.filter(c => c.id !== id));
    // this.abonnements.update(list => list.filter(a => a.clientId !== id));
    // if (this.selectedClient()?.id === id) this.selectedClient.set(null);
  }

  // Handlers Abonnements
  handleTypeChange(type: string) {
    const selected = this.typesAbonnement.find(t => t.label === type);
    if (selected) {
      this.abonnementForm.patchValue({ prix: selected.prixSuggere, dureeMois: selected.duree });
    }
  }

  handleAbonnementSubmit() {
    const client = this.selectedClient();
    if (!client || this.abonnementForm.invalid) return;

    const val = this.abonnementForm.value as any;
    const endDate = new Date(val.dateDebut);
    endDate.setMonth(endDate.getMonth() + val.dureeMois);
    const dateFin = endDate.toISOString().split('T')[0];

    if (this.editingAbonnement()) {
      this.abonnements.update(list => list.map(a => a.id === this.editingAbonnement()?.id ? { ...a, ...val, dateFin } : a));
    } else {
      const newAbo: any = { id: Date.now().toString(), clientId: client.id, ...val, dateFin, paiements: [] };
      this.abonnements.update(list => [...list, newAbo]);
    }
    this.isAbonnementFormOpen.set(false);
  }

  // Helper getters
  getAboForClient(clientId: string) {
    return this.abonnements().find(a => a.clientId === clientId);
  }

  getTotals(abo: any) {
    const paye = abo.paiements.filter((p:any) => p.statut === 'payé').reduce((s:any, p:any) => s + p.montant, 0);
    const restant = abo.paiements.filter((p:any) => p.statut === 'en_attente').reduce((s:any, p:any) => s + p.montant, 0);
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

  closeClientForm() { this.isFormOpen.set(false); this.editingClient.set(null); }
}