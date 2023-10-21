import { ticketHistoryFromJson } from './ticket-history';

describe('TicketHistory ', () => {
  it('ticketHistoryFromJson should parse an object to a ticket history instance', () => {
    const ticketHistory = {
      id: '12345',
      previous_values: {
        description: 'old',
        title: 'Error in Course',
        course_abbreviation: 'ISEF02',
        course_name: 'Projekt Software Engineering 2',
        status: 'FEEDBACK',
        priority: 'HIGH',
        assignee_name: 'Assigne',
        type: undefined, // Should not be included in parsed changes
      },
      changed_values: {
        description: 'new',
        title: 'Mistake in Course',
        course_abbreviation: 'ISEF01',
        course_name: 'Projekt Software Engineering',
        status: 'DONE',
        priority: 'MEDIUM',
        assignee_name: 'New Assigne',
        type: undefined, // Should not be included in parsed changes
      },
      created_at: new Date(2019, 3, 7).toString(),
      modified_at: new Date(2023, 6, 7).toString(),
      created_by_name: 'dummy',
      modified_by_name: 'author',
    };

    const parsedTicketHistory = ticketHistoryFromJson(ticketHistory);
    expect(parsedTicketHistory.id).toBe('12345');
    expect(parsedTicketHistory.previousValues).toEqual({
      Description: 'old',
      Title: 'Error in Course',
      'Course Abbreviation': 'ISEF02',
      'Course Name': 'Projekt Software Engineering 2',
      Status: 'FEEDBACK',
      Priority: 'HIGH',
      'Assignee Name': 'Assigne',
    });
    expect(parsedTicketHistory.changedValues).toEqual({
      Description: 'new',
      Title: 'Mistake in Course',
      'Course Abbreviation': 'ISEF01',
      'Course Name': 'Projekt Software Engineering',
      Status: 'DONE',
      Priority: 'MEDIUM',
      'Assignee Name': 'New Assigne',
    });
    expect(parsedTicketHistory.createdAt).toEqual(new Date(2019, 3, 7));
    expect(parsedTicketHistory.modifiedAt).toEqual(new Date(2023, 6, 7));
    expect(parsedTicketHistory.createdBy).toBe('dummy');
    expect(parsedTicketHistory.modifiedBy).toBe('author');
  });
});
