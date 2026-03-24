import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type FlashMessageType = 'success' | 'danger' | 'warning' | 'info';

export interface FlashMessage {
  id: string;
  type: FlashMessageType;
  text: string;
  dismissible: boolean;
}

@Injectable({ providedIn: 'root' })
export class FlashMessageService {
  private readonly messagesSubject = new BehaviorSubject<FlashMessage[]>([]);
  readonly messages$ = this.messagesSubject.asObservable();

  show(
    type: FlashMessageType,
    text: string,
    opts?: { autoDismissMs?: number; dismissible?: boolean }
  ): void {
    const id = this.newId();
    const dismissible = opts?.dismissible ?? true;
    const msg: FlashMessage = { id, type, text, dismissible };

    this.messagesSubject.next([...this.messagesSubject.value, msg]);

    const autoDismissMs = opts?.autoDismissMs ?? 3000;
    if (autoDismissMs > 0) {
      window.setTimeout(() => this.dismiss(id), autoDismissMs);
    }
  }

  success(text: string, autoDismissMs = 3000): void {
    this.show('success', text, { autoDismissMs });
  }

  error(text: string, autoDismissMs = 3500): void {
    this.show('danger', text, { autoDismissMs });
  }

  info(text: string, autoDismissMs = 3000): void {
    this.show('info', text, { autoDismissMs });
  }

  warning(text: string, autoDismissMs = 3500): void {
    this.show('warning', text, { autoDismissMs });
  }

  dismiss(id: string): void {
    this.messagesSubject.next(this.messagesSubject.value.filter((m) => m.id !== id));
  }

  clear(): void {
    this.messagesSubject.next([]);
  }

  private newId(): string {
    // Unique enough for UI message ids, no crypto needed.
    return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}

