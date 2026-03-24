import { Component,OnInit, ChangeDetectorRef } from '@angular/core';
import { PostService } from '../../services/post';
import { AuthService } from '../../services/auth';
import { Post, Comment, Like } from '../../models';
import { environment } from '../../../environment';
import { FlashMessageService } from '../../services/flash-message';

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
  editingPostId: number | null = null;
  editContent = '';
  editImageFile: File | null = null;
  showDeletePostModal = false;
  postToDeleteId: number | null = null;

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private flash: FlashMessageService
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
        this.flash.error('Failed to load posts. Please try again.');
        this.posts = [];
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }


  onLike(postId: number) {
    if (!this.currentUserId) {
      this.flash.warning('Please log in to like posts.');
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
        this.flash.error('Could not update like. Please try again.');
        // Optionally: reload posts to revert optimistic change
        this.loadPosts();
      }
    });
  }

  isPostLikedByCurrentUser(post: Post): boolean {
    if (!this.currentUserId || !post.likes) return false;
    return post.likes.some(like => like.userId === this.currentUserId);
  }

  isOwnPost(post: Post): boolean {
    return this.currentUserId != null && post.userId === this.currentUserId;
  }

  startEdit(post: Post): void {
    this.editingPostId = post.postId;
    this.editContent = post.content ?? '';
    this.editImageFile = null;
  }

  cancelEdit(): void {
    this.editingPostId = null;
    this.editContent = '';
    this.editImageFile = null;
  }

  onEditImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.editImageFile = file ?? null;
  }

  saveEdit(postId: number): void {
    const fd = new FormData();
    fd.append('Content', this.editContent);
    if (this.editImageFile) {
      fd.append('Image', this.editImageFile, this.editImageFile.name);
    }

    this.postService.updatePost(postId, fd).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadPosts();
        this.flash.success('Post updated.');
      },
      error: (err) => {
        console.error('Update post failed', err);
        this.flash.error('Could not update post. You can only edit your own posts.');
      },
    });
  }

  promptDeletePost(postId: number): void {
    this.postToDeleteId = postId;
    this.showDeletePostModal = true;
  }

  cancelDeletePost(): void {
    this.postToDeleteId = null;
    this.showDeletePostModal = false;
  }

  confirmDeletePost(): void {
    if (this.postToDeleteId == null) {
      return;
    }

    const postId = this.postToDeleteId;

    this.postService.deletePost(postId).subscribe({
      next: () => {
        this.posts = this.posts.filter((p) => p.postId !== postId);
        if (this.editingPostId === postId) this.cancelEdit();
        this.cancelDeletePost();
        this.cdr.detectChanges();
        this.flash.success('Post deleted.');
      },
      error: (err) => {
        console.error('Delete post failed', err);
        this.flash.error('Could not delete post.');
      },
    });
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
        this.flash.warning('Could not post comment. Check if you are logged in.');
      }
    });
  }
}
