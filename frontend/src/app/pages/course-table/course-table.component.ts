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
    {
      fieldName: 'name',
      caption: 'Name',
      priority: 5,
      dataType: 'string',
      headerFilterEnabled: false,
    },
    {
      fieldName: 'courseAbbreviation',
      caption: 'Abbreviation',
      priority: 4,
      dataType: 'string',
      headerFilterEnabled: false,
    },
    {
      fieldName: 'createdAt',
      caption: 'Created At',
      priority: 3,
      dataType: 'date',
      headerFilterEnabled: false,
      format: 'dd/MM/yyyy HH:mm:ss',
    },
    {
      fieldName: 'createdBy',
      caption: 'Created By',
      priority: 1,
      dataType: 'string',
      headerFilterEnabled: true,
    },
    {
      fieldName: 'modifiedAt',
      caption: 'Modified At',
      priority: 2,
      dataType: 'date',
      headerFilterEnabled: false,
      format: 'dd/MM/yyyy HH:mm:ss',
    },
    {
      fieldName: 'modifiedBy',
      caption: 'Modified By',
      priority: 0,
      dataType: 'string',
      headerFilterEnabled: true,
    },
  ];
}
