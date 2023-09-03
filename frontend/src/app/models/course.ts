import { Metadata } from './metadata';

export interface Course extends Metadata {
  courseAbbreviation: string;
  name: string;
}

export function courseFromJson(parsedJson: Record<string, unknown>): Course {
  const course = {
    id: parsedJson['id'],
    courseAbbreviation: parsedJson['course_abbreviation'],
    name: parsedJson['name'],
    createdAt: new Date(parsedJson['created_at'] as string),
    modifiedAt: new Date(parsedJson['modified_at'] as string),
    createdBy: parsedJson['created_by'],
    modifiedBy: parsedJson['modified_by'],
  };
  return course as Course;
}
