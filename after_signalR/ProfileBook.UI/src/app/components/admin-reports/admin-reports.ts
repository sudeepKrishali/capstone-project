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

  deleteReportedUser(report: Report): void {
    if (!report.reportedUserId) {
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to delete user with ID ${report.reportedUserId}?`
    );
    if (!confirmed) {
      return;
    }

    this.userService.deleteUser(report.reportedUserId).subscribe({
      next: () => {
        this.reports = this.reports.filter(
          (r) => r.reportedUserId !== report.reportedUserId
        );
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error deleting user', err);
        this.cdr.detectChanges();
      },
    });
  }
}
