import { Component } from '@angular/core';
import { PostService } from '../../services/post';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-post',
  standalone: false,
  templateUrl: './create-post.html',
  styleUrl: './create-post.css',
})

export class CreatePostComponent {
  content: string = '';
  selectedFile: File | null = null;

  constructor(private postService: PostService, private router: Router) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onSubmit() {
    if (!this.selectedFile) {
      alert('Please select an image');
      return;
    }

    const formData = new FormData();
    formData.append('content', this.content);
    formData.append('image', this.selectedFile);

    this.postService.createPost(formData).subscribe({
      next: () => {
        alert('Post created and sent for approval!');
        this.router.navigate(['/newsfeed']);
      },
      error: (err) => console.error('Error creating post', err)
    });
  }
}
