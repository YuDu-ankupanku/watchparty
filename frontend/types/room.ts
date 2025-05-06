import { User } from './user';

export interface Room {
  _id: string;
  name: string;
  videoUrl: string;
  host: User;
  members: User[];
  memberCount: number;
  isLocked: boolean;
  currentTime: number;
  isPlaying: boolean;
  createdAt: string;
  updatedAt: string;
}