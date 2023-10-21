import { Course, courseFromJson, courseToModel } from './course';

describe('Course ', () => {
  it('courseFromJson should parse an object to a course instance', () => {
    const course = {
      id: '12345',
      course_abbreviation: 'ISEF01',
      name: 'Projekt Software Engineering',
      created_at: new Date(2020, 7, 14).toString(),
      modified_at: new Date(2022, 9, 3).toString(),
      created_by_name: 'dummy',
      modified_by_name: 'author',
    };

    const parsedCourse = courseFromJson(course);
    expect(parsedCourse.id).toBe('12345');
    expect(parsedCourse.courseAbbreviation).toBe('ISEF01');
    expect(parsedCourse.name).toBe('Projekt Software Engineering');
    expect(parsedCourse.createdAt).toEqual(new Date(2020, 7, 14));
    expect(parsedCourse.modifiedAt).toEqual(new Date(2022, 9, 3));
    expect(parsedCourse.createdBy).toBe('dummy');
    expect(parsedCourse.modifiedBy).toBe('author');
  });

  it('courseToModel should parse a course to the json format expected by the backend', () => {
    const course: Course = {
      id: '7531',
      createdAt: new Date(),
      createdBy: 'dummy',
      modifiedAt: new Date(),
      modifiedBy: 'another',
      courseAbbreviation: 'DN',
      name: 'Dummy Name',
    };

    const parsedCourse = courseToModel(course);
    expect(parsedCourse['name']).toBe('Dummy Name');
    expect(parsedCourse['course_abbreviation']).toBe('DN');
  });
});
