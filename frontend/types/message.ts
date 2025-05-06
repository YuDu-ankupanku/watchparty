export interface Message {
  _id: string;
  roomId: string;
  sender: {
    _id: string;
    username: string;
  };
  text: string;
  type: 'text' | 'system';
  createdAt: string;
  updatedAt: string;
}