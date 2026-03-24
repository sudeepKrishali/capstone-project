import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Group, User } from '../../models';
import { GroupService } from '../../services/group';
import { UserService } from '../../services/user';
import { FlashMessageService } from '../../services/flash-message';

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
  showDeleteGroupModal = false;
  groupToDeleteId: number | null = null;

  constructor(
    private groupService: GroupService,
    private userService: UserService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private flash: FlashMessageService
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
        this.flash.error('Failed to load groups.');
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
        this.flash.error('Failed to load users.');
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

    this.availableUsers = this.users.filter((u) => !memberIds.has(u.userId));
  }

  createGroup(): void {
    if (!this.newGroupName.trim()) {
      return;
    }
    this.groupService.createGroup(this.newGroupName.trim()).subscribe({
      next: () => {
        this.newGroupName = '';
        this.loadGroups();
        this.flash.success('Group created.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.flash.error('Failed to create group.');
        this.cdr.detectChanges();
      },
    });
  }

  assignUser(): void {
    if (this.selectedGroupId == null || this.selectedUserId == null) {
      return;
    }
    const assignedGroupId = this.selectedGroupId;
    const assignedUserId = this.selectedUserId;

    this.groupService
      .addUserToGroup(assignedGroupId, assignedUserId)
      .subscribe({
        next: () => {
          const selectedGroup = this.groups.find(
            (g) => g.groupId === assignedGroupId
          );
          const assignedUser = this.users.find((u) => u.userId === assignedUserId);

          // Keep local state in sync so the dropdown updates immediately.
          if (selectedGroup && assignedUser) {
            selectedGroup.groupMembers ??= [];
            const alreadyMember = selectedGroup.groupMembers.some(
              (member) => member.userId === assignedUserId
            );
            if (!alreadyMember) {
              selectedGroup.groupMembers = [
                ...selectedGroup.groupMembers,
                assignedUser,
              ];
            }
          }

          if (this.selectedGroupId === assignedGroupId) {
            this.selectedUserId = null;
          }

          this.loadGroups();
          this.updateAvailableUsers();
          this.cdr.detectChanges();
        },
        error: () => {
          this.flash.error('Failed to assign user to group.');
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
        this.flash.success('User removed from group.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.flash.error('Failed to remove user from group.');
        this.cdr.detectChanges();
      },
    });
  }

  promptDeleteGroup(groupId: number): void {
    this.groupToDeleteId = groupId;
    this.showDeleteGroupModal = true;
  }

  cancelDeleteGroup(): void {
    this.groupToDeleteId = null;
    this.showDeleteGroupModal = false;
  }

  confirmDeleteGroup(): void {
    if (this.groupToDeleteId == null) {
      return;
    }

    const groupId = this.groupToDeleteId;

    this.groupService.deleteGroup(groupId).subscribe({
      next: () => {
        this.loadGroups();
        this.flash.success('Group deleted.');
        this.cancelDeleteGroup();
        this.cdr.detectChanges();
      },
      error: () => {
        this.flash.error('Failed to delete group.');
        this.cdr.detectChanges();
      },
    });
  }
}

