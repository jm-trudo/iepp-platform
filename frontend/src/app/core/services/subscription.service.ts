import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Subscription } from '../models/subscription.model';
import { PaginatedResponse } from '../models/school.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionService {
  private readonly baseUrl = `${environment.apiUrl}/subscriptions`;

  constructor(private http: HttpClient) {}

  liste(): Observable<PaginatedResponse<Subscription>> {
    return this.http.get<PaginatedResponse<Subscription>>(`${this.baseUrl}/`);
  }

  monStatut(): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.baseUrl}/mon-statut/`);
  }

  creer(donnees: Partial<Subscription>): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.baseUrl}/`, donnees);
  }

  modifier(id: number, donnees: Partial<Subscription>): Observable<Subscription> {
    return this.http.patch<Subscription>(`${this.baseUrl}/${id}/`, donnees);
  }
}