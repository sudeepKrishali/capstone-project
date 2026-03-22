import { Component, ChangeDetectorRef } from '@angular/core';
import { PostService } from '../../services/post';
import { OnInit } from '@angular/core';

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
    private cdr: ChangeDetectorRef
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
      error: (err) => console.error('Error fetching pending posts', err)
    });
  }

  approvePost(postId: number) {
    this.postService.approvePost(postId).subscribe({
      next: () => {
        alert('Post approved successfully!');
        this.loadPendingPosts(); 
      },
      error: (err) => console.error('Approval failed', err)
    });
  }
}
