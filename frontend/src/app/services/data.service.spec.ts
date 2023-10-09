import { TestBed } from '@angular/core/testing';
import { AuthenticationService } from './authentication.service';
import { AuthenticationServiceMock } from 'src/test/authentication-service.mock';
import { DataService } from './data.service';
import { environment } from 'src/environments/environment';

describe('DataService', () => {
  let service: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DataService,
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
      ],
    });

    service = TestBed.inject(DataService);
  });

  it('getAll should load the given data endpoint and return the array of items', async () => {
    const data = [
      {
        id: '0',
        field: 'test',
      },
    ];
    const fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo({
      status: 200,
      json: () => Promise.resolve(data),
    } as unknown as Response);

    const response = await service.getAll('dummy/endpoint');
    expect(response).toBe(data);
    expect(fetchSpy).toHaveBeenCalledWith(
      `${environment.apiUrl}/dummy/endpoint`,
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer dummy-token',
        },
      },
    );
  });

  it('getAll should return errors happening while fetching data', async () => {
    spyOn(globalThis, 'fetch').and.resolveTo({
      status: 403,
      text: () => Promise.resolve('Sample Error'),
    } as unknown as Response);

    try {
      await service.getAll('dummy/endpoint');
      fail('Should throw error!');
    } catch (error) {
      expect((error as Error).message).toBe('Sample Error');
    }
  });

  it('get should load the given data endpoint and return the item', async () => {
    const data = {
      id: '0',
      field: 'test',
    };
    const fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo({
      status: 200,
      json: () => Promise.resolve(data),
    } as unknown as Response);

    const response = await service.get('dummy/endpoint', 'id');
    expect(response).toBe(data);
    expect(fetchSpy).toHaveBeenCalledWith(
      `${environment.apiUrl}/dummy/endpoint/id`,
      {
        method: 'GET',
        headers: {
          Authorization: 'Bearer dummy-token',
        },
      },
    );
  });

  it('get should return errors happening while fetching data', async () => {
    spyOn(globalThis, 'fetch').and.resolveTo({
      status: 403,
      text: () => Promise.resolve('Sample Error'),
    } as unknown as Response);

    try {
      await service.get('dummy/endpoint', 'id');
      fail('Should throw error!');
    } catch (error) {
      expect((error as Error).message).toBe('Sample Error');
    }
  });

  it('create should take the given data endpoint and data, create the new item and return the identifier', async () => {
    const newItem = {
      attribut: 'value',
      field: 'test',
    };
    const fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo({
      status: 201,
      json: () => Promise.resolve({ id: 'dummy-id' }),
    } as unknown as Response);

    const response = await service.create('dummy/endpoint', newItem);
    expect(response.id).toBe('dummy-id');
    expect(fetchSpy).toHaveBeenCalledWith(
      `${environment.apiUrl}/dummy/endpoint`,
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer dummy-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      },
    );
  });

  it('create should return errors happening while fetching data', async () => {
    spyOn(globalThis, 'fetch').and.resolveTo({
      status: 403,
      text: () => Promise.resolve('Sample Error'),
    } as unknown as Response);

    try {
      await service.create('dummy/endpoint', {});
      fail('Should throw error!');
    } catch (error) {
      expect((error as Error).message).toBe('Sample Error');
    }
  });

  it('update should take the given data endpoint and data, update the item and return the identifier', async () => {
    const modifiedItem = {
      attribut: 'value',
      field: 'test',
    };
    const fetchSpy = spyOn(globalThis, 'fetch').and.resolveTo({
      status: 200,
      json: () => Promise.resolve({ id: 'dummy-id' }),
    } as unknown as Response);

    const response = await service.update(
      'dummy/endpoint/dummy-id',
      modifiedItem,
    );
    expect(response.id).toBe('dummy-id');
    expect(fetchSpy).toHaveBeenCalledWith(
      `${environment.apiUrl}/dummy/endpoint/dummy-id`,
      {
        method: 'PUT',
        headers: {
          Authorization: 'Bearer dummy-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modifiedItem),
      },
    );
  });

  it('update should return errors happening while fetching data', async () => {
    spyOn(globalThis, 'fetch').and.resolveTo({
      status: 403,
      text: () => Promise.resolve('Sample Error'),
    } as unknown as Response);

    try {
      await service.update('dummy/endpoint/dummy-id', {});
      fail('Should throw error!');
    } catch (error) {
      expect((error as Error).message).toBe('Sample Error');
    }
  });
});
