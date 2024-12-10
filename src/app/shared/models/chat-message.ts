export interface ChatMessage {
    message: string;
    username: string;
    message_id?: string;
    timestamp?: Date;
    user_id?: string;
    isMine?: boolean;
    hideUsername?: boolean;
  }