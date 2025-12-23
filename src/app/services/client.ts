import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const api = environment.api+'clients'

@Injectable({
  providedIn: 'root',
})
export class Client {

  constructor(private http:HttpClient){}

  getAll():Observable<any>{
    return this.http.get(api);
  }

  save(client:any):Observable<any>{
    return this.http.post(api,client)
  }

  delete(clientId:any):Observable<any>{
    return this.http.delete(api+'/'+clientId)
  }
  canBeDeleted(clientId:any):Observable<any>{
    return this.http.get(api+"/canDelete/"+clientId);
  }
  
}
