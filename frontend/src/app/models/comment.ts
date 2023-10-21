import { Metadata } from './metadata';

export interface Comment extends Metadata {
  content: string;
  ticketId: string;
  isOwnComment: boolean;
}

export function commentFromJson(
  parsedJson: Record<string, unknown>,
  userId: string,
): Comment {
  const comment = {
    id: parsedJson['id'],
    content: parsedJson['content'],
    ticketId: parsedJson['ticket_id'],
    createdAt: new Date(parsedJson['created_at'] as string),
    modifiedAt: new Date(parsedJson['modified_at'] as string),
    createdBy: parsedJson['created_by_name'],
    modifiedBy: parsedJson['modified_by_name'],
    isOwnComment: parsedJson['created_by'] === userId,
  };
  return comment as Comment;
}

export function commentToModel(comment: Comment): Record<string, unknown> {
  const parsedJson: Record<string, unknown> = {
    content: comment.content,
    ticket_id: comment.ticketId,
  };
  return parsedJson;
}
