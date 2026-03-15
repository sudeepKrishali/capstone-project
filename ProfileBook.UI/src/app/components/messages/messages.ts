import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from '../../services/message';
import { UserService } from '../../services/user';
import { AuthService } from '../../services/auth';
import { Message, User } from '../../models';

@Component({
  selector: 'app-messages',
  standalone: false,
  templateUrl: './messages.html',
  styleUrl: './messages.css',
})
export class MessagesComponent implements OnInit {
  otherUser: User | null = null;
  messages: Message[] = [];
  newMessage = '';
  loading = false;
  chatUserId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private messageService: MessageService,
    private userService: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  get currentUserId(): number | null {
    return this.authService.getUserId();
  }

  ngOnInit(): void {
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
        this.messages = [...this.messages, msg];
        this.newMessage = '';
        this.cdr.detectChanges();
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
