import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Users, Calendar, UserCheck, Menu, X, LayoutDashboard } from 'lucide-angular';
import { LucideAngularModule } from 'lucide-angular/src/icons';

@Component({
  selector: 'app-header',
  imports: [LucideAngularModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
  standalone:true
})
export class Header {
activeTab: string = 'dashboard';
tabChange = new EventEmitter<any>();

  isMobileMenuOpen = false;

  readonly icons = {
    dashboard: LayoutDashboard,
    clients: Users,
    coachs: UserCheck,
    seances: Calendar,
    menu: Menu,
    close: X
  };

  tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: this.icons.dashboard },
    { id: 'clients', label: 'Clients', icon: this.icons.clients },
    { id: 'coachs', label: 'Coachs', icon: this.icons.coachs },
    { id: 'seances', label: 'Séances', icon: this.icons.seances },
  ];

  selectTab(tabId: string) {
    this.activeTab=tabId;
    this.tabChange.emit(tabId);
    this.isMobileMenuOpen = false;
  }

  toggleMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}
