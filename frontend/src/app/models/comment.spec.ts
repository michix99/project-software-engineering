import { commentFromJson, Comment, commentToModel } from './comment';

describe('Comment ', () => {
  it('commentFromJson should parse an object to a comment instance', () => {
    const comment = {
      id: '12345',
      content: 'My cool comment',
      ticket_id: '5678',
      created_at: new Date(2020, 7, 14).toString(),
      modified_at: new Date(2022, 9, 3).toString(),
      created_by_name: 'dummy',
      modified_by_name: 'author',
      created_by: '987',
    };

    let parsedComment = commentFromJson(comment, '987');
    expect(parsedComment.id).toBe('12345');
    expect(parsedComment.content).toBe('My cool comment');
    expect(parsedComment.ticketId).toBe('5678');
    expect(parsedComment.createdAt).toEqual(new Date(2020, 7, 14));
    expect(parsedComment.modifiedAt).toEqual(new Date(2022, 9, 3));
    expect(parsedComment.createdBy).toBe('dummy');
    expect(parsedComment.modifiedBy).toBe('author');
    expect(parsedComment.isOwnComment).toBeTrue();

    comment['created_by'] = 'another';
    parsedComment = commentFromJson(comment, '987');
    expect(parsedComment.isOwnComment).toBeFalse();
  });

  it('commentToModel should parse a comment to the json format expected by the backend', () => {
    const comment: Comment = {
      id: '7531',
      createdAt: new Date(),
      createdBy: 'dummy',
      modifiedAt: new Date(),
      modifiedBy: 'another',
      content: 'New Comment Text',
      ticketId: '123',
      isOwnComment: true,
    };

    const parsedComment = commentToModel(comment);
    expect(parsedComment['content']).toBe('New Comment Text');
    expect(parsedComment['ticket_id']).toBe('123');
  });
});
