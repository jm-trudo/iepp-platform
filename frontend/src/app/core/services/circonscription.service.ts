import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Circonscription } from '../models/circonscription.model';

@Injectable({ providedIn: 'root' })
export class CirconscriptionService {
  private readonly baseUrl = `${environment.apiUrl}/circonscriptions`;

  constructor(private http: HttpClient) {}

  maCirconscription(): Observable<Circonscription> {
    return this.http.get<Circonscription>(`${this.baseUrl}/ma-circonscription/`);
  }

  televerserLogo(id: number, fichier: File): Observable<Circonscription> {
    const formData = new FormData();
    formData.append('logo', fichier);
    return this.http.patch<Circonscription>(`${this.baseUrl}/${id}/`, formData);
  }

  modifierNom(id: number, nom: string): Observable<Circonscription> {
    return this.http.patch<Circonscription>(`${this.baseUrl}/${id}/`, { nom });
  }
}