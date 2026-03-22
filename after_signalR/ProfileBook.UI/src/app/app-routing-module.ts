import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { RegisterComponent } from './components/register/register';
import { NewsfeedComponent } from './components/newsfeed/newsfeed';
import { CreatePostComponent } from './components/create-post/create-post';
import { AdminApprovalComponent } from './components/admin-approval/admin-approval';
import { AdminReportsComponent } from './components/admin-reports/admin-reports';
import { SearchUsersComponent } from './components/search-users/search-users';
import { MessagesComponent } from './components/messages/messages';
import { AdminGroupsComponent } from './components/admin-groups/admin-groups';
import { UserGroupComponent } from './components/user-group/user-group';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'newsfeed', component: NewsfeedComponent },
  { path: 'createPost', component: CreatePostComponent },
  { path: 'search-users', component: SearchUsersComponent },
  { path: 'messages', component: MessagesComponent },
  { path: 'messages/chat/:userId', component: MessagesComponent },
  { path: 'admin/approve', component: AdminApprovalComponent },
  { path: 'admin/pending-posts', component: AdminApprovalComponent },
  { path: 'admin/reports', component: AdminReportsComponent },
  { path: 'admin/groups', component: AdminGroupsComponent },
  { path: 'my-group', component: UserGroupComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
