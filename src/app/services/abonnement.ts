import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';


const api = environment.api + 'abonnements';
@Injectable({
  providedIn: 'root',
})
export class Abonnement {
  constructor(private http: HttpClient) {}

  getAllAbonnement(): Observable<any> {
    return this.http.get(api);
  }

  save(abonnement: any): Observable<any> {
    return this.http.post(api, abonnement);
  }

  delete(abonnementId: any): Observable<any> {
    return this.http.delete(`${api}/${abonnementId}`);
  }


  getById(id: any): Observable<any> {
    return this.http.get(`${api}/${id}`);
  }

  getAbonnementsByClient(clientId: any): Observable<any[]> {
    return this.http.get<any[]>(`${api}/client/${clientId}`);
  }

}
