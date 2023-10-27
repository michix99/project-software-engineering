import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { DxAccordionModule } from 'devextreme-angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {}

@NgModule({
  imports: [CommonModule, DxAccordionModule],
  declarations: [HomeComponent],
  exports: [HomeComponent],
})
export class HomeModule {}
