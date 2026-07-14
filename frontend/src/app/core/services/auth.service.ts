import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';


export interface UserAuth {

  id: number;

  username: string;

  first_name?: string;

  last_name?: string;

  email?: string;

  telephone?: string;

  role: string;

  role_display?: string;

}



export interface LoginResponse {

  access: string;

  refresh: string;

  user: UserAuth;

}



@Injectable({
  providedIn: 'root'
})
export class AuthService {


  private apiUrl = 'http://127.0.0.1:8000/api/auth';



  private utilisateurSubject =
    new BehaviorSubject<UserAuth | null>(
      this.getUser()
    );



  utilisateur$ =
    this.utilisateurSubject.asObservable();




  constructor(
    private http: HttpClient,
    private router: Router
  ) {}





  login(
    username: string,
    password: string
  ): Observable<LoginResponse> {


    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login/`,
      {
        username,
        password
      }

    ).pipe(


      tap((response)=>{


        localStorage.setItem(
          'access',
          response.access
        );


        localStorage.setItem(
          'refresh',
          response.refresh
        );



        localStorage.setItem(
          'user',
          JSON.stringify(response.user)
        );



        this.utilisateurSubject.next(
          response.user
        );


      })


    );


  }






  logout(): void {


    localStorage.removeItem('access');

    localStorage.removeItem('refresh');

    localStorage.removeItem('user');



    this.utilisateurSubject.next(null);



    this.router.navigate([
      '/login'
    ]);


  }








  getAccessToken(): string | null {


    return localStorage.getItem(
      'access'
    );


  }







  getRefreshToken(): string | null {


    return localStorage.getItem(
      'refresh'
    );


  }








  refreshToken(): Observable<any> {


    return this.http.post(
      `${this.apiUrl}/refresh/`,
      {
        refresh: this.getRefreshToken()
      }

    ).pipe(


      tap((response:any)=>{


        localStorage.setItem(
          'access',
          response.access
        );


      })


    );


  }








  isAuthenticated(): boolean {


    return !!this.getAccessToken();


  }








  /**
   * Utilisé dans les composants :
   *
   * auth.currentUser()?.first_name
   *
   * auth.currentUser()?.role_display
   */
  currentUser(): UserAuth | null {


    return this.utilisateurSubject.value;


  }









  getUser(): UserAuth | null {


    const user =
      localStorage.getItem('user');



    if (!user) {


      return null;


    }





    try {


      return JSON.parse(user) as UserAuth;


    } catch {


      return null;


    }


  }









  hasRole(
    ...roles: string[]
  ): boolean {


    const user =
      this.currentUser();




    if (!user) {


      return false;


    }






    return roles.includes(
      user.role
    );



  }







  getRoleLabel(): string {


    const user =
      this.currentUser();



    if (!user) {


      return '';

    }




    return user.role_display
      || this.traduireRole(user.role);



  }







  private traduireRole(
    role: string
  ): string {


    const roles: Record<string,string> = {


      ADMIN: 'Administrateur système',

      CHEF_IEPP: 'Chef de Circonscription IEPP',

      DIRECTEUR: "Directeur d'école",

      CONSEILLER: 'Conseiller pédagogique',

      INSTITUTEUR: 'Instituteur'


    };



    return roles[role] || role;



  }



}