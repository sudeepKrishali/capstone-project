import { Component, ChangeDetectorRef } from '@angular/core';
import { PostService } from '../../services/post';
import { OnInit } from '@angular/core';
import { FlashMessageService } from '../../services/flash-message';

@Component({
  selector: 'app-admin-approval',
  standalone: false,
  templateUrl: './admin-approval.html',
  styleUrl: './admin-approval.css',
})
export class AdminApprovalComponent implements OnInit {
  pendingPosts: any[] = [];

  constructor(
    private postService: PostService,
    private cdr: ChangeDetectorRef,
    private flash: FlashMessageService
  ) {}

  ngOnInit(): void {
    this.loadPendingPosts();
  }

  loadPendingPosts() {
    this.postService.getPendingPosts().subscribe({
      next: (posts) => {
        this.pendingPosts = posts;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching pending posts', err);
        this.flash.error('Failed to load pending posts.');
      },
    });
  }

  approvePost(postId: number) {
    this.postService.approvePost(postId).subscribe({
      next: () => {
        this.flash.success('Post approved successfully!');
        this.loadPendingPosts(); 
      },
      error: (err) => {
        console.error('Approval failed', err);
        this.flash.error('Failed to approve post.');
      },
    });
  }
}
