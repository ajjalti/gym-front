import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Clients } from './pages/clients/clients';
import { Coachs } from './pages/coachs/coachs';
import { Seances } from './pages/seances/seances';

export const routes: Routes = [
    {path:"",component:Dashboard},
    {path:"clients",component:Clients},
    {path:"coachs",component:Coachs},
    {path:"seances",component:Seances},
    {path:"**",component:Dashboard}
];
