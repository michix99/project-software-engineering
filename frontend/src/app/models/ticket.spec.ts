import {
  Priority,
  Status,
  Ticket,
  Type,
  ticketFromJson,
  ticketToModel,
} from './ticket';

describe('Ticket ', () => {
  it('ticketFromJson should parse an object to a ticket instance', () => {
    const ticket = {
      id: '12345',
      description: 'Description of the error.',
      title: 'Error in Course',
      course_id: '456',
      course_abbreviation: 'ISEF01',
      course_name: 'Projekt Software Engineering',
      status: 'DONE',
      priority: 'HIGH',
      assignee_id: '987',
      assignee_name: 'Assigne',
      created_at: new Date(2020, 7, 14).toString(),
      modified_at: new Date(2022, 9, 3).toString(),
      created_by_name: 'dummy',
      modified_by_name: 'author',
      type: 'ADDITION',
    };

    const parsedTicket = ticketFromJson(ticket);
    expect(parsedTicket.id).toBe('12345');
    expect(parsedTicket.description).toBe('Description of the error.');
    expect(parsedTicket.title).toBe('Error in Course');
    expect(parsedTicket.courseId).toBe('456');
    expect(parsedTicket.courseAbbreviation).toBe('ISEF01');
    expect(parsedTicket.courseName).toBe('Projekt Software Engineering');
    expect(parsedTicket.status).toBe(Status.Done);
    expect(parsedTicket.priority).toBe(Priority.High);
    expect(parsedTicket.assigneeId).toBe('987');
    expect(parsedTicket.assigneeName).toBe('Assigne');
    expect(parsedTicket.createdAt).toEqual(new Date(2020, 7, 14));
    expect(parsedTicket.modifiedAt).toEqual(new Date(2022, 9, 3));
    expect(parsedTicket.createdBy).toBe('dummy');
    expect(parsedTicket.modifiedBy).toBe('author');
    expect(parsedTicket.type).toBe('ADDITION');
  });

  it('ticketToModel should parse a ticket to the json format expected by the backend', () => {
    const ticket: Ticket = {
      id: 'dummy-id',
      createdAt: new Date(),
      createdBy: '',
      modifiedAt: new Date(),
      modifiedBy: '',
      description: 'My Description',
      courseId: 'course-id',
      courseAbbreviation: '',
      courseName: '',
      title: 'My title',
      status: Status.Open,
      priority: Priority.Undefined,
      assigneeId: 'assignee-id',
      assigneeName: '',
      type: Type.Error,
    };

    const parsedTicket = ticketToModel(ticket);
    expect(parsedTicket['description']).toBe('My Description');
    expect(parsedTicket['course_id']).toBe('course-id');
    expect(parsedTicket['title']).toBe('My title');
    expect(parsedTicket['status']).toBe('OPEN');
    expect(parsedTicket['priority']).toBe('UNDEFINED');
    expect(parsedTicket['assignee_id']).toBe('assignee-id');
    expect(parsedTicket['type']).toBe('ERROR');
  });
});
