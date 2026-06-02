import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { PerfilPage } from './perfil.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: 'feed',
        loadChildren: () => import('../feed-amigos/feed-amigos.module').then(m => m.FeedAmigosPageModule)
      },
      { path: '', component: PerfilPage }
    ])
  ],
  declarations: [PerfilPage]
})
export class PerfilPageModule {}
