import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PostService } from '../../services/post';
import { Router } from '@angular/router';
import { FlashMessageService } from '../../services/flash-message';

@Component({
  selector: 'app-create-post',
  standalone: false,
  templateUrl: './create-post.html',
  styleUrl: './create-post.css',
})

export class CreatePostComponent {
  selectedFile: File | null = null;
  submitted = false;
  postForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private router: Router,
    private flash: FlashMessageService
  ) {
    this.postForm = this.fb.group({
      content: ['', Validators.required],
      image: [null, Validators.required],
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files?.[0] ?? null;
    this.postForm.patchValue({ image: this.selectedFile });
    this.postForm.get('image')?.markAsTouched();
  }

  onSubmit() {
    this.submitted = true;
    this.postForm.markAllAsTouched();
    if (this.postForm.invalid) return;

    const formData = new FormData();
    formData.append('content', this.postForm.get('content')?.value ?? '');
    if (this.selectedFile) {
      formData.append('image', this.selectedFile, this.selectedFile.name);
    }

    this.postService.createPost(formData).subscribe({
      next: () => {
        this.flash.success('Post created and sent for approval!');
        window.setTimeout(() => {
          this.router.navigate(['/newsfeed']);
        }, 1200);
      },
      error: () => {
        this.flash.error('Failed to create post. Please try again.');
      },
    });
  }
}
