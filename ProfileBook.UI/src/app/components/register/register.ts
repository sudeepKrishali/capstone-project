import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { Router } from '@angular/router';
import { FlashMessageService } from '../../services/flash-message';


@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  registerForm: FormGroup;
  selectedFile: File | null = null;
  submitted = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private flash: FlashMessageService
  ) {
    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      profileImage: [null, Validators.required],
    });
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files?.[0] ?? null;
    this.registerForm.patchValue({ profileImage: this.selectedFile });
    this.registerForm.get('profileImage')?.markAsTouched();
  }

  onSubmit() {
    this.submitted = true;
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) return;

    const formData = new FormData();
    formData.append('username', this.registerForm.get('username')?.value);
    formData.append('password', this.registerForm.get('password')?.value);
    if (this.selectedFile) {
      formData.append(
        'profileImage',
        this.selectedFile,
        this.selectedFile.name
      );
    }

    this.authService.register(formData).subscribe({
      next: () => {
        this.flash.success('Registration successful! Redirecting to login...');
        window.setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1200);
      },
      error: () => {
        this.flash.error('Registration failed. Please try again.');
      },
    });
  }
}
