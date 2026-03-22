export interface User {
  userId: number;
  username: string;
  password?: string;
  role?: string;
  profileImage?: string;
  groupId?: number;
  group?: Group;
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
  commentId: number;
  postId: number;
  userId: number;
  text: string;
  user?: {
    username: string;
    profileImage?: string;
  };
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
  isRead?: boolean;
  sender?: User;
  receiver?: User;
}

export interface ConversationSummary {
  otherUserId: number;
  otherUsername?: string;
  otherProfileImage?: string;
  lastMessagePreview?: string;
  lastMessageTime: string;
  unreadCount: number;
}

export interface Group {
  groupId: number;
  groupName?: string;
  groupMembers?: User[];
}

export interface GroupMessage {
  groupMessageId: number;
  groupId: number;
  senderId: number;
  senderName?: string;
  messageContent?: string;
  timeStamp: Date;
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