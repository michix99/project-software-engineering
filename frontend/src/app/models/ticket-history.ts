import { Metadata } from './metadata';

export interface TicketHistory extends Metadata {
  previousValues: Record<string, unknown>;
  changedValues: Record<string, unknown>;
  ticketId: string;
}

export function ticketHistoryFromJson(
  parsedJson: Record<string, unknown>,
): TicketHistory {
  const previous = parsedJson['previous_values'] as Record<string, unknown>;
  const changes = parsedJson['changed_values'] as Record<string, unknown>;

  const ticketHistory = {
    id: parsedJson['id'],
    ticketId: parsedJson['ticket_id'],
    previousValues: getParsedChanges(previous),
    changedValues: getParsedChanges(changes),
    createdAt: new Date(parsedJson['created_at'] as string),
    modifiedAt: new Date(parsedJson['modified_at'] as string),
    createdBy: parsedJson['created_by_name'],
    modifiedBy: parsedJson['modified_by_name'],
  };

  return ticketHistory as TicketHistory;
}

function getParsedChanges(
  parsedJson: Record<string, unknown>,
): Record<string, unknown> {
  const parsed = {
    Description: parsedJson['description'],
    'Course Abbreviation': parsedJson['course_abbreviation'],
    'Course Name': parsedJson['course_name'],
    Title: parsedJson['title'],
    Status: parsedJson['status'],
    Priority: parsedJson['priority'],
    'Assignee Name': parsedJson['assignee_name'],
    Type: parsedJson['type'],
  };

  const changes: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (value !== undefined) {
      changes[key] = value;
    }
  }
  return changes;
}
