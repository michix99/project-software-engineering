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
  };
  return ticket as Ticket;
}
