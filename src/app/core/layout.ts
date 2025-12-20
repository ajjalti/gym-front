import { Component } from '@angular/core';
import { Header } from "./header/header";
import { RouterOutlet } from '@angular/router';
@Component({
  selector: 'app-layout',
  imports: [Header, RouterOutlet],
  template: `
<div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
  
  <app-header>
  </app-header>

  <main class="max-w-7xl mx-auto px-4 py-8">
    <router-outlet></router-outlet>
  </main>
</div>
  `,
  styles: ``,
})
export class Layout {


}
