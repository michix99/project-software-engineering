import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { AuthenticationService } from './authentication.service';

@Injectable({
  providedIn: 'root',
})
export class DataService {
  constructor(private authService: AuthenticationService) {}

  /**
   * Loads all data items for given data endpoint.
   * @param dataEndpoint The URL endpoint to load the data from.
   * @returns The array of loaded items.
   */
  async getAll(dataEndpoint: string): Promise<Array<Record<string, unknown>>> {
    const token = await this.authService.getToken();
    try {
      const response = await fetch(`${environment.apiUrl}/${dataEndpoint}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status == 200) {
        const jsonResponse = (await response.json()) as unknown as Array<
          Record<string, unknown>
        >;

        return jsonResponse;
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  /**
   * Loads a data item for a given data endpoint.
   * @param dataEndpoint The URL endpoint to load the data from.
   * @param id The identifier of the item to load.
   * @returns The loaded data item.
   */
  async get(
    dataEndpoint: string,
    id: string,
  ): Promise<Record<string, unknown>> {
    const token = await this.authService.getToken();
    try {
      const response = await fetch(
        `${environment.apiUrl}/${dataEndpoint}/${id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.status == 200) {
        const jsonResponse = (await response.json()) as unknown as Record<
          string,
          unknown
        >;

        return jsonResponse;
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  /**
   * Creates a new data item for a given data endpoint.
   * @param dataEndpoint The URL endpoint to create the data item.
   * @param newItem The data for the new item.
   * @returns The identifier of the created item.
   */
  async create(
    dataEndpoint: string,
    newItem: Record<string, unknown>,
  ): Promise<{ id: string }> {
    const token = await this.authService.getToken();
    try {
      const response = await fetch(`${environment.apiUrl}/${dataEndpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      if (response.status == 201) {
        const jsonResponse = (await response.json()) as { id: string };

        return jsonResponse;
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  /**
   * Modifies a data item for given data endpoint.
   * @param dataEndpoint The URL endpoint to modify the data at.
   * @param updatedItem The updated data item.
   * @returns The identifier of the updated item.
   */
  async update(
    dataEndpoint: string,
    updatedItem: Record<string, unknown>,
  ): Promise<{ id: string }> {
    const token = await this.authService.getToken();
    try {
      const response = await fetch(`${environment.apiUrl}/${dataEndpoint}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedItem),
      });

      if (response.status == 200) {
        const jsonResponse = (await response.json()) as { id: string };

        return jsonResponse;
      } else {
        throw new Error(await response.text());
      }
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }
}
