import { Component } from '@angular/core';
import { Column } from '../../models';
import { PERMISSIONS } from './permissions';

@Component({
  selector: 'app-permission-table',
  templateUrl: './permission-table.component.html',
})
export class PermissionTableComponent {
  dataSource = PERMISSIONS;
  columns: Array<Column> = [
    {
      fieldName: 'view',
      caption: 'View',
      priority: 1,
      dataType: 'string',
    },
    {
      fieldName: 'function',
      caption: 'Function',
      priority: 0,
      dataType: 'string',
    },

    {
      fieldName: 'description',
      caption: 'Description',
      priority: 5,
      dataType: 'string',
    },
    {
      fieldName: 'admin',
      caption: 'Admin',
      priority: 4,
      dataType: 'boolean',
    },
    {
      fieldName: 'editor',
      caption: 'Editor',
      priority: 3,
      dataType: 'boolean',
    },
    {
      fieldName: 'requester',
      caption: 'Requester',
      priority: 2,
      dataType: 'boolean',
    },
  ];
}
