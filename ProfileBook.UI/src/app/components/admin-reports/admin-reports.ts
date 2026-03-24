import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ReportService } from '../../services/report';
import { UserService } from '../../services/user';
import { Report } from '../../models';

@Component({
  selector: 'app-admin-reports',
  standalone: false,
  templateUrl: './admin-reports.html',
  styleUrl: './admin-reports.css',
})
export class AdminReportsComponent implements OnInit {
  reports: Report[] = [];
  showDeleteUserModal = false;
  reportToDeleteUser: Report | null = null;

  constructor(
    private reportService: ReportService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(): void {
    this.reportService.getReports().subscribe({
      next: (reports) => {
        this.reports = reports;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching reports', err);
        this.cdr.detectChanges();
      },
    });
  }

  promptDeleteReportedUser(report: Report): void {
    if (!report.reportedUserId) {
      return;
    }
    this.reportToDeleteUser = report;
    this.showDeleteUserModal = true;
  }

  cancelDeleteReportedUser(): void {
    this.reportToDeleteUser = null;
    this.showDeleteUserModal = false;
  }

  confirmDeleteReportedUser(): void {
    if (!this.reportToDeleteUser?.reportedUserId) {
      return;
    }

    const reportedUserId = this.reportToDeleteUser.reportedUserId;

    this.userService.deleteUser(reportedUserId).subscribe({
      next: () => {
        this.reports = this.reports.filter(
          (r) => r.reportedUserId !== reportedUserId
        );
        this.cancelDeleteReportedUser();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error deleting user', err);
        this.cdr.detectChanges();
      },
    });
  }
}
