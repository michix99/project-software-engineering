import { Metadata } from './metadata';

export interface Ticket extends Metadata {
  description: string;
  courseId: string;
  courseAbbreviation: string;
  courseName: string;
  title: string;
  status: string;
  priority: string;
  assigneeId: string;
  assigneeName: string;
  type: string;
}

export function ticketFromJson(parsedJson: Record<string, unknown>): Ticket {
  const ticket = {
    id: parsedJson['id'],
    description: parsedJson['description'],
    courseId: parsedJson['course_id'],
    courseAbbreviation: parsedJson['course_abbreviation'],
    courseName: parsedJson['course_name'],
    title: parsedJson['title'],
    status: parsedJson['status'],
    priority: parsedJson['priority'],
    assigneeId: parsedJson['assignee_id'],
    assigneeName: parsedJson['assignee_name'],
    createdAt: new Date(parsedJson['created_at'] as string),
    modifiedAt: new Date(parsedJson['modified_at'] as string),
    createdBy: parsedJson['created_by_name'],
    modifiedBy: parsedJson['modified_by_name'],
    type: parsedJson['type'],
  };
  return ticket as Ticket;
}

export function ticketToModel(ticket: Ticket): Record<string, unknown> {
  const parsedJson: Record<string, unknown> = {
    description: ticket.description,
    course_id: ticket.courseId,
    title: ticket.title,
    status: ticket.status,
    priority: ticket.priority,
    assignee_id: ticket.assigneeId,
    type: ticket.type,
  };
  return parsedJson;
}

export enum Status {
  Open = 'OPEN',
  InProgress = 'IN PROGRESS',
  Feedback = 'FEEDBACK',
  InReview = 'IN REVIEW',
  Done = 'DONE',
}

export enum Priority {
  High = 'HIGH',
  Medium = 'MEDIUM',
  Low = 'LOW',
  Undefined = 'UNDEFINED',
}

export enum Type {
  Error = 'ERROR',
  Improvement = 'IMPROVEMENT',
  Addition = 'ADDITION',
  Undefined = 'UNDEFINED',
}
