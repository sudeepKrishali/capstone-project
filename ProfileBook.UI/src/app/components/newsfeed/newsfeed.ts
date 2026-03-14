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
  imageBaseUrl = environment.apiUrl.replace('/api', ''); // To get the base URL for images

  constructor(private postService: PostService) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts() {
    this.postService.getPosts().subscribe(data => {
      this.posts = data;
    });
  }

  onLike(postId: number) {
    this.postService.likePost(postId).subscribe(() => this.loadPosts());
  }
}
