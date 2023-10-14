export interface Column {
  fieldName: string;
  caption: string;
  dataType: 'string' | 'date' | 'number' | 'boolean' | 'object' | 'datetime';
  priority: number;
}
