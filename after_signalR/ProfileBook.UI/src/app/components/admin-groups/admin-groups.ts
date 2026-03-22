import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Group, User } from '../../models';
import { GroupService } from '../../services/group';
import { UserService } from '../../services/user';

@Component({
  selector: 'app-admin-groups',
  standalone: false,
  templateUrl: './admin-groups.html',
  styleUrl: './admin-groups.css',
})
export class AdminGroupsComponent implements OnInit {
  groups: Group[] = [];
  users: User[] = [];
  availableUsers: User[] = [];
  newGroupName = '';
  selectedGroupId: number | null = null;
  selectedUserId: number | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private groupService: GroupService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadGroups();
    this.loadUsers();
  }

  loadGroups(): void {
    this.loading = true;
    this.groupService.getAllGroups().subscribe({
      next: (groups) => {
        this.groups = groups;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load groups.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.updateAvailableUsers();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load users.';
        this.cdr.detectChanges();
      },
    });
  }

  updateAvailableUsers(): void {
    if (this.selectedGroupId == null) {
      this.availableUsers = this.users;
      return;
    }

    const selectedGroup = this.groups.find(
      (g) => g.groupId === this.selectedGroupId
    );

    if (!selectedGroup || !selectedGroup.groupMembers) {
      this.availableUsers = this.users;
      return;
    }

    const memberIds = new Set(
      selectedGroup.groupMembers.map((m) => m.userId)
    );

    this.availableUsers = this.users.filter(
      (u) => !memberIds.has(u.userId)
    );
  }

  createGroup(): void {
    if (!this.newGroupName.trim()) {
      return;
    }
    this.groupService.createGroup(this.newGroupName.trim()).subscribe({
      next: () => {
        this.newGroupName = '';
        this.loadGroups();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to create group.';
        this.cdr.detectChanges();
      },
    });
  }

  assignUser(): void {
    if (this.selectedGroupId == null || this.selectedUserId == null) {
      return;
    }
    this.groupService
      .addUserToGroup(this.selectedGroupId, this.selectedUserId)
      .subscribe({
        next: () => {
          this.loadGroups();
          this.updateAvailableUsers();
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'Failed to assign user to group.';
          this.cdr.detectChanges();
        },
      });
  }

  messageUser(userId: number): void {
    this.router.navigate(['/messages', 'chat', userId]);
  }

  removeUserFromGroup(groupId: number, userId: number): void {
    this.groupService.removeUserFromGroup(groupId, userId).subscribe({
      next: () => {
        this.loadGroups();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to remove user from group.';
        this.cdr.detectChanges();
      },
    });
  }

  deleteGroup(groupId: number): void {
    if (!confirm('Are you sure you want to delete this group?')) {
      return;
    }
    this.groupService.deleteGroup(groupId).subscribe({
      next: () => {
        this.loadGroups();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to delete group.';
        this.cdr.detectChanges();
      },
    });
  }
}

