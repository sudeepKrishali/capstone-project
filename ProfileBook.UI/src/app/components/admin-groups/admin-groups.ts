import { Component, OnInit } from '@angular/core';
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
  newGroupName = '';
  selectedGroupId: number | null = null;
  selectedUserId: number | null = null;
  loading = false;
  error: string | null = null;

  constructor(
    private groupService: GroupService,
    private userService: UserService,
    private router: Router
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
      },
      error: () => {
        this.error = 'Failed to load groups.';
        this.loading = false;
      },
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: () => {
        this.error = 'Failed to load users.';
      },
    });
  }

  createGroup(): void {
    if (!this.newGroupName.trim()) {
      return;
    }
    this.groupService.createGroup(this.newGroupName.trim()).subscribe({
      next: () => {
        this.newGroupName = '';
        this.loadGroups();
      },
      error: () => {
        this.error = 'Failed to create group.';
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
        },
        error: () => {
          this.error = 'Failed to assign user to group.';
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
      },
      error: () => {
        this.error = 'Failed to remove user from group.';
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
      },
      error: () => {
        this.error = 'Failed to delete group.';
      },
    });
  }
}

