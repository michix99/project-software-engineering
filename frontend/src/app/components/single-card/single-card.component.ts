import { Component, NgModule, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxScrollViewModule } from 'devextreme-angular/ui/scroll-view';

@Component({
  selector: 'app-single-card',
  templateUrl: './single-card.component.html',
  styleUrls: ['./single-card.component.scss'],
})
export class SingleCardComponent {
  /** The title shown on the cards. */
  @Input()
  title!: string;

  /** The description shown below the title. */
  @Input()
  description!: string;
}

@NgModule({
  imports: [CommonModule, DxScrollViewModule],
  exports: [SingleCardComponent],
  declarations: [SingleCardComponent],
})
export class SingleCardModule {}
