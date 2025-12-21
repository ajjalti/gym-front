import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { Coach } from '../../services/coach';
import Swal from 'sweetalert2';


@Component({
  selector: 'app-coachs-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './coachs.html',
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
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class Coachs implements OnInit{
  private fb = inject(FormBuilder);
  private sanitizer = inject(DomSanitizer);

  // État des données
  coachs = signal<any[]>([]);
      // { id: '1', nom: 'Sophie Laurent', email: 'sophie.laurent@gym.com', specialite: 'Yoga' },
    // { id: '2', nom: 'Marc Dubois', email: 'marc.dubois@gym.com', specialite: 'Musculation' },

  // État de l'UI
  isFormOpen = signal(false);
  editingCoach = signal<any>(null);

  // Formulaire réactif
  coachForm = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone:['',Validators.required],
    speciality: ['', Validators.required],
    salary:['', Validators.required]
  });

  // Icônes SVG sécurisées
  readonly icons: Record<string, SafeHtml> = {
    plus: this.bypass(`<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>`),
    trash: this.bypass(`<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>`),
    edit: this.bypass(`<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>`),
    mail: this.bypass(`<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>`),
    award: this.bypass(`<circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>`),
    phone: this.bypass(`<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>`),
    salary: this.bypass(`<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>`),
  };

  constructor(private coachService:Coach){}

  ngOnInit(): void {
    this.getAllCoachs();
  }

  getAllCoachs(){
    this.coachService.getAll().subscribe({
      next:(res:any)=>{
        this.coachs.set(res);
      }
    })
  }

  private bypass(svg: string) { return this.sanitizer.bypassSecurityTrustHtml(svg); }

  // Handlers
  openForm(coach?: any) {
    if (coach) {
      this.editingCoach.set(coach);
      this.coachForm.patchValue(coach);
    } else {
      this.editingCoach.set(null);
      this.coachForm.reset();
    }
    this.isFormOpen.set(true);
  }

  closeForm() {
    this.isFormOpen.set(false);
    this.editingCoach.set(null);
  }

  handleSubmit() {
    if (this.coachForm.invalid) return;
    const data = this.coachForm.value as any;

    if (this.editingCoach()) {
      data.id = this.editingCoach().id;
    }
    this.coachService.save(data).subscribe({
      next:(res:any)=>{
        this.getAllCoachs();
      }
    })
    this.closeForm();
  }

  async handleDelete(id: string) {
        let result  = await Swal.fire({
          title: "Voulez vous supprimmer cet entraineur",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Oui",
          cancelButtonText: "Annuler",
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
        });
        if(!result.isConfirmed) return;

        this.coachService.delete(id).subscribe({
          next:(res:any)=>{
            this.getAllCoachs();
          }
        })

    // this.coachs.update(list => list.filter(c => c.id !== id));
  }
}