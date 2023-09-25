import { ticketFromJson } from './ticket';

describe('Ticket ', () => {
  it('ticketFromJson should parse an object to a ticket instance', () => {
    const ticket = {
      id: '12345',
      description: 'Description of the error.',
      title: 'Error in Course',
      course_id: '456',
      course_abbreviation: 'ISEF01',
      course_name: 'Projekt Software Engineering',
      status: 'done',
      priority: 'high',
      assignee_id: '987',
      assignee_name: 'Assigne',
      created_at: new Date(2020, 7, 14).toString(),
      modified_at: new Date(2022, 9, 3).toString(),
      created_by_name: 'dummy',
      modified_by_name: 'author',
    };

    const parsedTicket = ticketFromJson(ticket);
    expect(parsedTicket.id).toBe('12345');
    expect(parsedTicket.description).toBe('Description of the error.');
    expect(parsedTicket.title).toBe('Error in Course');
    expect(parsedTicket.courseId).toBe('456');
    expect(parsedTicket.courseAbbreviation).toBe('ISEF01');
    expect(parsedTicket.courseName).toBe('Projekt Software Engineering');
    expect(parsedTicket.status).toBe('done');
    expect(parsedTicket.priority).toBe('high');
    expect(parsedTicket.assigneeId).toBe('987');
    expect(parsedTicket.assigneeName).toBe('Assigne');
    expect(parsedTicket.createdAt).toEqual(new Date(2020, 7, 14));
    expect(parsedTicket.modifiedAt).toEqual(new Date(2022, 9, 3));
    expect(parsedTicket.createdBy).toBe('dummy');
    expect(parsedTicket.modifiedBy).toBe('author');
  });
});
