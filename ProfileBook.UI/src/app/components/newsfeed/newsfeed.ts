import { Component,OnInit } from '@angular/core';
import { PostService } from '../../services/post';
import { Post } from '../../models';
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
  constructor(private postService: PostService) {}
  ngOnInit(): void {
    this.loadPosts();
  }
  loadPosts() {
    this.loading = true;
    this.postService.getPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading posts', err);
        this.posts = [];
        this.loading = false;
      },
    });
  }


  onLike(postId: number) {
  this.postService.likePost(postId).subscribe({
    next: () => {
      const post = this.posts.find(p => p.postId === postId);
      if (post) {
        this.loadPosts(); 
      }
    },
    error: (err) => console.error('Error liking post', err)
  });
  }
   
    onComment(postId: number, commentText: string) {
  this.postService.addComment(postId, commentText).subscribe({
    next: () => {
      this.loadPosts(); // This refreshes the whole feed including comments
    }
  });


  this.postService.addComment(postId, commentText).subscribe({
    next: () => {
      // 1. Success! Now reload the list to show the new comment
      this.loadPosts(); 
    },
    error: (err) => {
      console.error('Comment failed', err);
      alert('Could not post comment. Check if you are logged in.');
    }
  });
}
}
