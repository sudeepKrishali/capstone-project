import { Component } from '@angular/core';
import { FlashMessageService } from '../../services/flash-message';

@Component({
  selector: 'app-flash-messages',
  standalone: false,
  templateUrl: './flash-messages.html',
  styleUrl: './flash-messages.css',
})
export class FlashMessagesComponent {
  constructor(public flash: FlashMessageService) {}

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }
}

