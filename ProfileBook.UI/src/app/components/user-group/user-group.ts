import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { Group, GroupMessage } from '../../models';
import { GroupService } from '../../services/group';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { finalize, take } from 'rxjs';
import { FlashMessageService } from '../../services/flash-message';

@Component({
  selector: 'app-user-group',
  standalone: false,
  templateUrl: './user-group.html',
  styleUrl: './user-group.css',
})
export class UserGroupComponent implements OnInit {
  groups: Group[] = [];
  selectedGroupId: number | null = null;
  loading = false;
  groupMessages: GroupMessage[] = [];
  newGroupMessage = '';
  groupMessageError: string | null = null;
  currentUserId: number | null = null;

  @ViewChild('groupMessagesList') groupMessagesList?: ElementRef<HTMLDivElement>;

  constructor(
    private groupService: GroupService,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private flash: FlashMessageService
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.loadMyGroups();
  }

  loadMyGroups(): void {
    this.loading = true;
    this.groupService
      .getMyGroups()
      .pipe(
        take(1),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (groups) => {
          this.groups = groups;
          this.selectedGroupId = groups.length > 0 ? groups[0].groupId : null;
          this.loadMyGroupMessages();
        },
        error: () => {
          this.groups = [];
          this.selectedGroupId = null;
          this.groupMessages = [];
          this.flash.error('Failed to load your groups.');
        },
      });
  }

  messageMember(userId: number): void {
    this.router.navigate(['/messages', 'chat', userId]);
  }

  loadMyGroupMessages(): void {
    if (this.selectedGroupId == null) {
      this.groupMessages = [];
      return;
    }

    this.groupService.getMyGroupMessages(this.selectedGroupId).subscribe({
      next: (msgs) => {
        this.groupMessages = msgs;
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: () => {
        this.groupMessages = [];
        this.flash.error('Failed to load group messages.');
      },
    });
  }

  sendGroupMessage(): void {
    const text = this.newGroupMessage.trim();
    this.groupMessageError = null;
    if (!text) {
      this.groupMessageError = 'Message is required.';
      return;
    }

    if (this.selectedGroupId == null) {
      this.groupMessageError = 'Select a group first.';
      return;
    }

    this.groupService.sendMyGroupMessage(this.selectedGroupId, text).subscribe({
      next: (msg) => {
        this.groupMessages = [...this.groupMessages, msg];
        this.newGroupMessage = '';
        this.groupMessageError = null;
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: () => {
        this.flash.error('Failed to send group message.');
      },
    });
  }

  onGroupChange(): void {
    this.newGroupMessage = '';
    this.groupMessageError = null;
    this.loadMyGroupMessages();
  }

  get selectedGroup(): Group | null {
    if (this.selectedGroupId == null) {
      return null;
    }

    return this.groups.find((g) => g.groupId === this.selectedGroupId) ?? null;
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

