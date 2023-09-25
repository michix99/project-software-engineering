import { Component } from '@angular/core';
import { Column, userFromJson } from '../../models';

@Component({
  selector: 'app-user-table',
  templateUrl: './user-table.component.html',
})
export class UserTableComponent {
  dataEndpoint = 'api/user';
  dataParser = userFromJson;
  columns: Array<Column> = [
    {
      fieldName: 'email',
      caption: 'E-Mail',
      priority: 5,
      dataType: 'string',
    },
    {
      fieldName: 'displayName',
      caption: 'Display Name',
      priority: 1,
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
    {
      fieldName: 'disabled',
      caption: 'Is disabled',
      priority: 0,
      dataType: 'boolean',
    },
  ];
}
