import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FeedAmigosPageRoutingModule } from './feed-amigos-routing.module';
import { FeedAmigosPage } from './feed-amigos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FeedAmigosPageRoutingModule
  ],
  declarations: [FeedAmigosPage]
})
export class FeedAmigosPageModule {}
