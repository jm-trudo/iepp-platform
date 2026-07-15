import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="banniere-accueil">
      <div class="contenu-texte">
        <p class="date-du-jour">{{ dateFormatee }}</p>
        <h1>{{ titre }}</h1>
        <p class="sous-titre">{{ sousTitre }}</p>
      </div>

      <svg class="illustration-ecole" viewBox="0 0 400 260">
        <rect width="400" height="260" fill="#FFF3E0" rx="16"/>
        <circle cx="340" cy="45" r="24" fill="#FFB74D"/>

        <rect x="60" y="120" width="180" height="100"
              fill="#FFFFFF"
              stroke="#E07B00"
              stroke-width="3"/>

        <polygon points="50,120 150,70 250,120"
                 fill="#E07B00"/>

        <rect x="135" y="170"
              width="30"
              height="50"
              fill="#2E7D32"/>
      </svg>
    </div>
  `,
  styles: [`
    .banniere-accueil {
      display:flex;
      align-items:center;
      justify-content:space-between;
      background:white;
      border-radius:12px;
      padding:28px 32px;
      margin-bottom:20px;
      box-shadow:0 1px 4px rgba(0,0,0,.08);
    }

    .contenu-texte {
      flex:1;
    }

    .date-du-jour {
      color:#2E7D32;
      font-size:.85em;
      font-weight:600;
    }

    h1 {
      color:#E07B00;
      margin:0;
    }

    .sous-titre {
      color:#757575;
    }

    .illustration-ecole {
      width:280px;
    }

    @media(max-width:700px){
      .banniere-accueil {
        flex-direction:column;
      }
    }
  `]
})
export class HeroBannerComponent {

  @Input() titre = 'Bienvenue';
  @Input() sousTitre = '';

  dateFormatee = new Date().toLocaleDateString('fr-FR', {
    weekday:'long',
    day:'numeric',
    month:'long',
    year:'numeric'
  });

}