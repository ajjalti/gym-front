import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const api = environment.api+'dashboard'

@Injectable({
  providedIn: 'root',
})
export class DashboardS {
      constructor(private http:HttpClient){}

  getAll():Observable<any>{
    return this.http.get(api);
  }
}
