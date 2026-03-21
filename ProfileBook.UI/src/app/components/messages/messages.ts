import { Component, OnDestroy, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from '../../services/message';
import { UserService } from '../../services/user';
import { AuthService } from '../../services/auth';
import { Message, User } from '../../models';
import { MessageRealtimeService } from '../../services/message-realtime';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-messages',
  standalone: false,
  templateUrl: './messages.html',
  styleUrl: './messages.css',
})
export class MessagesComponent implements OnInit, OnDestroy {
  otherUser: User | null = null;
  messages: Message[] = [];
  newMessage = '';
  loading = false;
  chatUserId: number | null = null;
  private realtimeSub?: Subscription;

  @ViewChild('messagesList') messagesList?: ElementRef<HTMLDivElement>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private messageRealtimeService: MessageRealtimeService,
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  get currentUserId(): number | null {
    return this.authService.getUserId();
  }

  private scrollToBottom(): void {
    if (!this.messagesList) return;
    try {
      const el = this.messagesList.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {
      // ignore
    }
  }

  ngOnInit(): void {
    const token = this.authService.getToken();
    this.messageRealtimeService
      .connect(token)
      .then(async () => {
        const currentId = this.currentUserId;
        if (currentId != null) {
          await this.messageRealtimeService.joinUserChannel(currentId);
        }
      })
      .catch((err) => console.error('[MessagesComponent] SignalR connect failed', err));

    this.realtimeSub = this.messageRealtimeService.incomingMessages$().subscribe((msg) => {
      const currentId = this.currentUserId;
      if (currentId == null || this.chatUserId == null) return;

      const belongsToCurrentChat =
        (msg.senderId === currentId && msg.receiverId === this.chatUserId) ||
        (msg.senderId === this.chatUserId && msg.receiverId === currentId);

      if (!belongsToCurrentChat) return;

      if (this.messages.some((m) => m.messageId === msg.messageId)) return;

      this.messages = [...this.messages, msg];
      this.cdr.detectChanges();
      this.scrollToBottom();
    });

    this.route.paramMap.subscribe((params) => {
      const userIdParam = params.get('userId');
      if (userIdParam) {
        const userId = +userIdParam;
        console.log('[MessagesComponent] Route userId param =', userId);
        this.chatUserId = userId;
        this.loadChat(userId);
      } else {
        console.log('[MessagesComponent] No userId param in route');
        this.chatUserId = null;
        this.otherUser = null;
        this.messages = [];
      }
    });
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
    this.messageRealtimeService
      .disconnect()
      .catch((err) => console.error('[MessagesComponent] SignalR disconnect failed', err));
  }

  loadChat(otherUserId: number): void {
    const currentId = this.currentUserId;
    console.log('[MessagesComponent] loadChat called with otherUserId =', otherUserId, 'currentUserId =', currentId);
    if (currentId == null) return;
    this.loading = true;

    this.userService.getUser(otherUserId).subscribe({
      next: (user) => {
        console.log('[MessagesComponent] Loaded other user', user);
        this.otherUser = user;
        this.messageService.getChat(currentId, otherUserId).subscribe({
          next: (msgs) => {
            console.log('[MessagesComponent] Loaded messages, count =', msgs.length);
            console.log('[MessagesComponent] messages: ', msgs);
            this.messages = msgs;
            this.loading = false;
            this.cdr.detectChanges();
            this.scrollToBottom();
          },
          error: (err) => {
            console.error('[MessagesComponent] Error loading messages', err);
            this.messages = [];
            this.loading = false;
            this.cdr.detectChanges();
          },
        });
      },
      error: (err) => {
        console.error('[MessagesComponent] Error loading user for chat', err);
        this.otherUser = null;
        this.messages = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  sendMessage(): void {
    const text = this.newMessage.trim();
    const currentId = this.currentUserId;
    if (!text || !this.otherUser || currentId == null) return;
    console.log('[MessagesComponent] sendMessage', { from: currentId, to: this.otherUser.userId, text });
    this.messageService.sendMessage(currentId, this.otherUser.userId, text).subscribe({
      next: (msg) => {
        // SignalR may deliver this message before HTTP response returns.
        // Guard against adding the same message twice in sender chat.
        if (!this.messages.some((m) => m.messageId === msg.messageId)) {
          this.messages = [...this.messages, msg];
        }
        this.newMessage = '';
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to send message.');
      },
    });
  }

  goToSearch(): void {
    this.router.navigate(['/search-users']);
  }
}
