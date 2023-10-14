import { Component } from '@angular/core';
import 'devextreme/data/odata/store';
import { Column, courseFromJson } from '../../models';

@Component({
  templateUrl: 'course-table.component.html',
})
export class CourseTableComponent {
  dataEndpoint = 'data/course';
  editRoute = 'course';
  dataParser = courseFromJson;
  columns: Array<Column> = [
    { fieldName: 'name', caption: 'Name', priority: 5, dataType: 'string' },
    {
      fieldName: 'courseAbbreviation',
      caption: 'Abbreviation',
      priority: 4,
      dataType: 'string',
    },
    {
      fieldName: 'createdAt',
      caption: 'Created At',
      priority: 3,
      dataType: 'date',
    },
    {
      fieldName: 'createdBy',
      caption: 'Created By',
      priority: 1,
      dataType: 'string',
    },
    {
      fieldName: 'modifiedAt',
      caption: 'Modified At',
      priority: 2,
      dataType: 'date',
    },
    {
      fieldName: 'modifiedBy',
      caption: 'Modified By',
      priority: 0,
      dataType: 'string',
    },
  ];
}
