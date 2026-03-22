import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Group, GroupMessage } from '../../models';
import { GroupService } from '../../services/group';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-user-group',
  standalone: false,
  templateUrl: './user-group.html',
  styleUrl: './user-group.css',
})
export class UserGroupComponent implements OnInit {
  group: Group | null = null;
  loading = false;
  error: string | null = null;
  groupMessages: GroupMessage[] = [];
  newGroupMessage = '';
  currentUserId: number | null = null;

  @ViewChild('groupMessagesList') groupMessagesList?: ElementRef<HTMLDivElement>;

  constructor(
    private groupService: GroupService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.loadMyGroup();
    this.loadMyGroupMessages();
  }

  loadMyGroup(): void {
    this.loading = true;
    this.groupService.getMyGroup().subscribe({
      next: (group) => {
        this.group = group;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load your group.';
        this.loading = false;
      },
    });
  }

  messageMember(userId: number): void {
    this.router.navigate(['/messages', 'chat', userId]);
  }

  loadMyGroupMessages(): void {
    this.groupService.getMyGroupMessages().subscribe({
      next: (msgs) => {
        this.groupMessages = msgs;
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: () => {
        this.groupMessages = [];
      },
    });
  }

  sendGroupMessage(): void {
    const text = this.newGroupMessage.trim();
    if (!text) {
      return;
    }
    this.groupService.sendMyGroupMessage(text).subscribe({
      next: (msg) => {
        this.groupMessages = [...this.groupMessages, msg];
        this.newGroupMessage = '';
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: () => {
        alert('Failed to send group message.');
      },
    });
  }

  private scrollToBottom(): void {
    if (!this.groupMessagesList) return;
    try {
      const el = this.groupMessagesList.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch {
      // ignore
    }
  }
}

