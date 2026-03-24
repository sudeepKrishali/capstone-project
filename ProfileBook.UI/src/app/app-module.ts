import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withInterceptorsFromDi, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth-interceptor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { NewsfeedComponent } from './components/newsfeed/newsfeed';
import { CreatePostComponent } from './components/create-post/create-post';
import { NavbarComponent } from './components/navbar/navbar';
import { withFetch } from '@angular/common/http';
import { AdminApprovalComponent } from './components/admin-approval/admin-approval';
import { AdminReportsComponent } from './components/admin-reports/admin-reports';
import { SearchUsersComponent } from './components/search-users/search-users';
import { MessagesComponent } from './components/messages/messages';
import { AdminGroupsComponent } from './components/admin-groups/admin-groups';
import { UserGroupComponent } from './components/user-group/user-group';
import { FlashMessagesComponent } from './components/flash-messages/flash-messages';

@NgModule({
  declarations: [
    App,
    LoginComponent,
    RegisterComponent,
    NewsfeedComponent,
    CreatePostComponent,
    NavbarComponent,
    AdminApprovalComponent,
    AdminReportsComponent,
    SearchUsersComponent,
    MessagesComponent,
    AdminGroupsComponent,
    UserGroupComponent,
    FlashMessagesComponent,
  ],
  imports: [BrowserModule, AppRoutingModule, ReactiveFormsModule, RouterModule, FormsModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
  bootstrap: [App],
})
export class AppModule {}
