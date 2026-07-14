import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardData } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private http: HttpClient) {}

  obtenir(anneeScolaire?: string): Observable<DashboardData> {
    let params = new HttpParams();

    if (anneeScolaire) {
      params = params.set('annee_scolaire', anneeScolaire);
    }

    return this.http.get<DashboardData>(
      `${environment.apiUrl}/reports/dashboard/`,
      { params }
    );
  }
}