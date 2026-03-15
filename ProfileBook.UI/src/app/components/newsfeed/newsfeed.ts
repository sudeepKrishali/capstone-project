import { Component,OnInit, ChangeDetectorRef } from '@angular/core';
import { PostService } from '../../services/post';
import { AuthService } from '../../services/auth';
import { Post, Comment, Like } from '../../models';
import { environment } from '../../../environment';

@Component({
  selector: 'app-newsfeed',
  standalone: false,
  templateUrl: './newsfeed.html',
  styleUrl: './newsfeed.css',
})

export class NewsfeedComponent implements OnInit {
  posts: Post[] = [];
  loading = false;
  imageBaseUrl = environment.apiUrl.replace('/api', '');
  currentUserId: number | null = null;

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}
  ngOnInit(): void {
    this.currentUserId = this.authService.getUserId();
    this.loadPosts();
  }
  loadPosts() {
    this.loading = true;
    this.postService.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading posts', err);
        this.posts = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }


  onLike(postId: number) {
    if (!this.currentUserId) {
      alert('Please log in to like posts.');
      return;
    }

    const post = this.posts.find(p => p.postId === postId);
    if (!post) return;

    const alreadyLiked = post.likes?.some(l => l.userId === this.currentUserId);

    // Optimistic UI update
    if (alreadyLiked) {
      post.likes = post.likes.filter(l => l.userId !== this.currentUserId);
    } else {
      const newLike: Like = {
        id: 0,
        postId,
        userId: this.currentUserId
      };
      post.likes = [...(post.likes || []), newLike];
    }

    this.cdr.detectChanges();

    this.postService.likePost(postId).subscribe({
      next: () => {
        // Refresh from server to keep counts in sync
        this.loadPosts();
      },
      error: (err) => {
        console.error('Error liking post', err);
        // Optionally: reload posts to revert optimistic change
        this.loadPosts();
      }
    });
  }

  isPostLikedByCurrentUser(post: Post): boolean {
    if (!this.currentUserId || !post.likes) return false;
    return post.likes.some(like => like.userId === this.currentUserId);
  }
   
  onComment(postId: number, commentText: string) {
    if (!commentText?.trim()) {
      return;
    }

    this.postService.addComment(postId, commentText).subscribe({
      next: (newComment: Comment) => {
        // Optimistically update UI so comment appears immediately
        const post = this.posts.find(p => p.postId === postId);
        if (post) {
          post.comments = [...(post.comments || []), newComment];
        }

        // Force Angular to re-render, then refresh from server
        this.cdr.detectChanges();
        this.loadPosts();
      },
      error: (err) => {
        console.error('Comment failed', err);
        alert('Could not post comment. Check if you are logged in.');
      }
    });
  }
}
