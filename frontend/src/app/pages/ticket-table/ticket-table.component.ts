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
      fieldName: 'type',
      caption: 'Type',
      priority: 5,
      dataType: 'string',
      headerFilterEnabled: true,
    },
    {
      fieldName: 'title',
      caption: 'Title',
      priority: 11,
      dataType: 'string',
      headerFilterEnabled: false,
    },
    {
      fieldName: 'description',
      caption: 'Description',
      priority: 6,
      dataType: 'string',
      headerFilterEnabled: false,
    },
    {
      fieldName: 'courseAbbreviation',
      caption: 'Course Abbreviation',
      priority: 7,
      dataType: 'string',
      headerFilterEnabled: true,
    },
    {
      fieldName: 'courseName',
      caption: 'Course Name',
      priority: 4,
      dataType: 'string',
      headerFilterEnabled: true,
    },
    {
      fieldName: 'status',
      caption: 'Status',
      priority: 10,
      dataType: 'string',
      headerFilterEnabled: true,
    },
    {
      fieldName: 'priority',
      caption: 'Priority',
      priority: 9,
      dataType: 'string',
      headerFilterEnabled: true,
    },
    {
      fieldName: 'assigneeName',
      caption: 'Assignee',
      priority: 8,
      dataType: 'string',
      headerFilterEnabled: true,
    },
    {
      fieldName: 'createdAt',
      caption: 'Created At',
      priority: 2,
      dataType: 'date',
      headerFilterEnabled: false,
      format: 'dd/MM/yyyy HH:mm:ss',
    },
    {
      fieldName: 'createdBy',
      caption: 'Created By',
      priority: 3,
      dataType: 'string',
      headerFilterEnabled: true,
    },
    {
      fieldName: 'modifiedAt',
      caption: 'Modified At',
      priority: 1,
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
