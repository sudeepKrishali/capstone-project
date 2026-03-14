export interface User {
  userId: number;
  username: string;
  password?: string;
  role?: string;
  profileImage?: string;
  posts?: Post[];
  sentMessages?: Message[];
  receivedMessages?: Message[];
}

export interface Post {
  postId: number;
  userId: number;
  content?: string;
  postImage?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  user?: User;
  likes: Like[];
  comments: Comment[];
}

export interface Comment {
  id: number;
  text: string;
  timeStamp: Date;
  postId: number;
  userId: number;
}

export interface Like {
  id: number;
  postId: number;
  userId: number;
}

export interface Message {
  messageId: number;
  senderId: number;
  receiverId: number;
  messageContent?: string;
  timeStamp: Date;
  sender?: User;
  receiver?: User;
}

export interface Group {
  groupId: number;
  groupName?: string;
  groupMembers?: User[];
}

export interface Report {
  reportId: number;
  reportedUserId: number;
  reportedUser?: User;
  reportingUserId: number;
  reportingUser?: User;
  reason?: string;
  timeStamp: Date;
}