import { Component, OnDestroy, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from '../../services/message';
import { UserService } from '../../services/user';
import { AuthService } from '../../services/auth';
import { ConversationSummary, Message, User } from '../../models';
import { MessageRealtimeService } from '../../services/message-realtime';
import { Subscription } from 'rxjs';
import { environment } from '../../../environment';
import { FlashMessageService } from '../../services/flash-message';

@Component({
  selector: 'app-messages',
  standalone: false,
  templateUrl: './messages.html',
  styleUrl: './messages.css',
})
export class MessagesComponent implements OnInit, OnDestroy {
  conversations: ConversationSummary[] = [];
  conversationsLoading = false;

  otherUser: User | null = null;
  messages: Message[] = [];
  newMessage = '';
  loadingChat = false;
  chatUserId: number | null = null;
  messageError: string | null = null;

  imageBaseUrl = environment.apiUrl.replace('/api', '');

  private realtimeSub?: Subscription;

  @ViewChild('messagesList') messagesList?: ElementRef<HTMLDivElement>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private messageRealtimeService: MessageRealtimeService,
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private flash: FlashMessageService
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
      .catch((err) => {
        console.error('[MessagesComponent] SignalR connect failed', err);
        this.flash.warning('Realtime messaging connection failed. Messages may not update instantly.');
      });

    this.realtimeSub = this.messageRealtimeService.incomingMessages$().subscribe((msg) => {
      const currentId = this.currentUserId;
      if (currentId == null) return;

      this.applyIncomingToConversations(msg, currentId);

      if (this.chatUserId == null) {
        this.cdr.detectChanges();
        return;
      }

      const belongsToCurrentChat =
        (msg.senderId === currentId && msg.receiverId === this.chatUserId) ||
        (msg.senderId === this.chatUserId && msg.receiverId === currentId);

      if (!belongsToCurrentChat) {
        this.cdr.detectChanges();
        return;
      }

      if (this.messages.some((m) => m.messageId === msg.messageId)) {
        this.cdr.detectChanges();
        return;
      }

      this.messages = [...this.messages, msg];

      this.cdr.detectChanges();
      this.scrollToBottom();
    });

    this.route.paramMap.subscribe((params) => {
      const userIdParam = params.get('userId');
      if (this.currentUserId != null) {
        this.loadConversations();
      }
      if (userIdParam) {
        const userId = +userIdParam;
        this.chatUserId = userId;
        this.messageError = null;
        this.loadChat(userId);
      } else {
        this.chatUserId = null;
        this.otherUser = null;
        this.messages = [];
        this.loadingChat = false;
        this.messageError = null;
        this.cdr.detectChanges();
      }
    });
  }

  private syncUnreadForPeer(otherUserId: number): void {
    const idx = this.conversations.findIndex((c) => c.otherUserId === otherUserId);
    if (idx < 0) return;
    const next = [...this.conversations];
    next[idx] = { ...next[idx], unreadCount: 0 };
    this.conversations = next;
  }

  private applyIncomingToConversations(msg: Message, currentId: number): void {
    const otherId = msg.senderId === currentId ? msg.receiverId : msg.senderId;
    const idx = this.conversations.findIndex((c) => c.otherUserId === otherId);
    const time =
      typeof msg.timeStamp === 'string'
        ? msg.timeStamp
        : new Date(msg.timeStamp as unknown as string).toISOString();
    const iAmReceiver = msg.receiverId === currentId;
    const viewingThisChat = this.chatUserId === otherId;

    if (idx >= 0) {
      const c = { ...this.conversations[idx] };
      c.lastMessagePreview = msg.messageContent;
      c.lastMessageTime = time;
      if (iAmReceiver) {
        if (viewingThisChat) {
          c.unreadCount = 0;
        } else {
          c.unreadCount = (c.unreadCount ?? 0) + 1;
        }
      }
      let next = [...this.conversations];
      next[idx] = c;
      next = next.sort(
        (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
      this.conversations = next;

      if (iAmReceiver && viewingThisChat) {
        this.messageService.markConversationRead(currentId, otherId).subscribe({ error: () => {} });
      }
    } else {
      this.loadConversations();
    }
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
    this.messageRealtimeService
      .disconnect()
      .catch((err) => console.error('[MessagesComponent] SignalR disconnect failed', err));
  }

  loadConversations(): void {
    const currentId = this.currentUserId;
    if (currentId == null) return;
    this.conversationsLoading = true;
    this.messageService.getConversations(currentId).subscribe({
      next: (list) => {
        this.conversations = list;
        this.conversationsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.conversations = [];
        this.conversationsLoading = false;
        this.flash.error('Failed to load conversations.');
        this.cdr.detectChanges();
      },
    });
  }

  loadChat(otherUserId: number): void {
    const currentId = this.currentUserId;
    if (currentId == null) return;
    this.loadingChat = true;

    this.userService.getUser(otherUserId).subscribe({
      next: (user) => {
        this.otherUser = user;
        this.messageService.getChat(currentId, otherUserId).subscribe({
          next: (msgs) => {
            this.messages = msgs;
            this.loadingChat = false;
            this.messageService.markConversationRead(currentId, otherUserId).subscribe({
              next: () => {
                this.syncUnreadForPeer(otherUserId);
                this.cdr.detectChanges();
              },
              error: () => {
                this.cdr.detectChanges();
              },
            });
            this.cdr.detectChanges();
            this.scrollToBottom();
          },
          error: () => {
            this.messages = [];
            this.loadingChat = false;
            this.flash.error('Failed to load chat messages.');
            this.cdr.detectChanges();
          },
        });
      },
      error: () => {
        this.otherUser = null;
        this.messages = [];
        this.loadingChat = false;
        this.flash.error('Failed to load chat.');
        this.cdr.detectChanges();
      },
    });
  }

  sendMessage(): void {
    const text = this.newMessage.trim();
    const currentId = this.currentUserId;
    this.messageError = null;
    if (!text) {
      this.messageError = 'Message is required.';
      this.cdr.detectChanges();
      return;
    }
    if (!this.otherUser || currentId == null) {
      this.messageError = 'Please select a conversation first.';
      this.cdr.detectChanges();
      return;
    }
    this.messageService.sendMessage(currentId, this.otherUser.userId, text).subscribe({
      next: (msg) => {
        if (!this.messages.some((m) => m.messageId === msg.messageId)) {
          this.messages = [...this.messages, msg];
        }
        this.newMessage = '';
        this.messageError = null;
        this.applyOutgoingToConversationPreview(msg, currentId);
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: () => {
        this.flash.error('Failed to send message.');
        this.cdr.detectChanges();
      },
    });
  }

  onMessageInputChange(): void {
    if (this.messageError) {
      this.messageError = null;
    }
  }

  private applyOutgoingToConversationPreview(msg: Message, currentId: number): void {
    const otherId = msg.receiverId;
    const idx = this.conversations.findIndex((c) => c.otherUserId === otherId);
    const time =
      typeof msg.timeStamp === 'string'
        ? msg.timeStamp
        : new Date(msg.timeStamp as unknown as string).toISOString();
    if (idx >= 0) {
      const c = { ...this.conversations[idx] };
      c.lastMessagePreview = msg.messageContent;
      c.lastMessageTime = time;
      let next = [...this.conversations];
      next[idx] = c;
      next = next.sort(
        (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );
      this.conversations = next;
    } else {
      this.loadConversations();
    }
  }

  goToSearch(): void {
    this.router.navigate(['/search-users']);
  }

  backToInbox(): void {
    this.router.navigate(['/messages']);
  }
}
