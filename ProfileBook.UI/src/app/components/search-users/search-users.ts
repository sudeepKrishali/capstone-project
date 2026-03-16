import { Component, ChangeDetectorRef } from '@angular/core';
import { UserService } from '../../services/user';
import { AuthService } from '../../services/auth';
import { ReportService } from '../../services/report';
import { Router } from '@angular/router';
import { User } from '../../models';
import { environment } from '../../../environment';

@Component({
  selector: 'app-search-users',
  standalone: false,
  templateUrl: './search-users.html',
  styleUrl: './search-users.css',
})
export class SearchUsersComponent {
  searchTerm = '';
  users: User[] = [];
  loading = false;
  hasSearched = false;
  reportingUser: User | null = null;
  reportReason = '';
  imageBaseUrl = environment.apiUrl.replace('/api', '');

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private reportService: ReportService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get currentUserId(): number | null {
    return this.authService.getUserId();
  }

  search(): void {
    const term = this.searchTerm.trim();
    if (!term) {
      this.users = [];
      this.loading = false;
      this.cancelReport();
      this.hasSearched = false;
      return;
    }
    this.loading = true;
    this.userService.searchUsers(term).subscribe({
      next: (data: User[]) => {
        const currentId = this.currentUserId;
        this.users =
          currentId != null
            ? data.filter((u) => u.userId !== currentId)
            : data;
        this.loading = false;
        this.hasSearched = true;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  messageUser(user: User): void {
    this.router.navigate(['/messages', 'chat', user.userId]);
  }

  openReportForm(user: User): void {
    this.reportingUser = user;
    this.reportReason = '';
    this.cdr.detectChanges();
  }

  cancelReport(): void {
    this.reportingUser = null;
    this.reportReason = '';
    this.cdr.detectChanges();
  }

  submitReport(): void {
    const reported = this.reportingUser;
    const currentId = this.currentUserId;
    if (!reported || currentId == null) return;
    this.reportService.reportUser(reported.userId, currentId, this.reportReason || undefined).subscribe({
      next: () => {
        alert('User reported successfully.');
        this.cancelReport();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('Failed to submit report.');
        this.cdr.detectChanges();
      },
    });
  }
}
