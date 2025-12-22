import { Injectable } from '@angular/core';
import {environment} from '../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';


const api = environment.api + 'paiements';
@Injectable({
  providedIn: 'root',
})
export class Paiement {

  constructor(private http: HttpClient) {}

  getAllPaiement(): Observable<any[]> {
    return this.http.get<any[]>(api);
  }

  savePaiement(paiement: any): Observable<any> {
    return this.http.post(api, paiement);
  }

  deletePaiement(id: any): Observable<any> {
    return this.http.delete(`${api}/${id}`);
  }

  getByIdPaiement(id: any): Observable<any> {
    return this.http.get(`${api}/${id}`);
  }

  getByAbonnement(aboId: any): Observable<any[]> {
    // Kan-3aytou l-API jdid dyal l-backend: /api/paiements/abonnement/{id}
    return this.http.get<any[]>(`${api}/abonnement/${aboId}`);
  }
}
