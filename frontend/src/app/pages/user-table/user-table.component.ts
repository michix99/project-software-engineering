import { Component } from '@angular/core';
import { Column, userFromJson } from '../../models';

@Component({
  selector: 'app-user-table',
  templateUrl: './user-table.component.html',
})
export class UserTableComponent {
  dataEndpoint = 'api/user';
  dataParser = userFromJson;
  editRoute = 'user';
  columns: Array<Column> = [
    {
      fieldName: 'email',
      caption: 'E-Mail',
      priority: 3,
      dataType: 'string',
      headerFilterEnabled: false,
    },
    {
      fieldName: 'displayName',
      caption: 'Display Name',
      priority: 1,
      dataType: 'string',
      headerFilterEnabled: false,
    },

    {
      fieldName: 'role',
      caption: 'Role',
      priority: 2,
      dataType: 'string',
      headerFilterEnabled: false,
      customizeText: function (cellInfo: { value: string }) {
        return cellInfo.value.charAt(0).toUpperCase() + cellInfo.value.slice(1);
      },
    },
    {
      fieldName: 'disabled',
      caption: 'Is disabled',
      priority: 0,
      dataType: 'boolean',
      headerFilterEnabled: false,
    },
  ];
}
