import { Component } from '@angular/core';
import { Column, ticketFromJson } from '../../models';

@Component({
  selector: 'app-ticket-table',
  templateUrl: './ticket-table.component.html',
})
export class TicketTableComponent {
  dataEndpoint = 'data/ticket';
  editRoute = 'ticket';
  dataParser = ticketFromJson;
  columns: Array<Column> = [
    {
      fieldName: 'title',
      caption: 'Title',
      priority: 10,
      dataType: 'string',
    },
    {
      fieldName: 'description',
      caption: 'Description',
      priority: 5,
      dataType: 'string',
    },
    {
      fieldName: 'courseAbbreviation',
      caption: 'Course Abbreviation',
      priority: 6,
      dataType: 'string',
    },
    {
      fieldName: 'courseName',
      caption: 'Course Name',
      priority: 4,
      dataType: 'string',
    },
    {
      fieldName: 'status',
      caption: 'Status',
      priority: 9,
      dataType: 'string',
    },
    {
      fieldName: 'priority',
      caption: 'Priority',
      priority: 8,
      dataType: 'string',
    },
    {
      fieldName: 'assigneeName',
      caption: 'Assignee',
      priority: 7,
      dataType: 'string',
    },
    {
      fieldName: 'createdAt',
      caption: 'Created At',
      priority: 2,
      dataType: 'date',
    },
    {
      fieldName: 'createdBy',
      caption: 'Created By',
      priority: 3,
      dataType: 'string',
    },
    {
      fieldName: 'modifiedAt',
      caption: 'Modified At',
      priority: 1,
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
