import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const api = environment.api+'coachs'

@Injectable({
  providedIn: 'root',
})
export class Coach {
    constructor(private http:HttpClient){}

  getAll():Observable<any>{
    return this.http.get(api);
  }

  save(coach:any):Observable<any>{
    return this.http.post(api,coach)
  }

  delete(coachId:any):Observable<any>{
    return this.http.delete(api+'/'+coachId)
  }
}
