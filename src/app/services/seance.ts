import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class Seance {
  private http = inject(HttpClient);
  private api = environment.api + 'seances';

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.api);
  }

  save(seance: any): Observable<any> {
    return this.http.post(this.api, seance);
  }

  delete(id: number | string): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }
}
