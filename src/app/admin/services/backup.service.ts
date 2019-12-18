import { Injectable } from '@angular/core';
import {Database} from '../../database/database';
import {User} from '../../user/user';
import {Papa} from 'ngx-papaparse';
import {Entity} from '../../entity/entity';

@Injectable({
  providedIn: 'root'
})
/**
 * Responsible for creating and loading backups.
 */
export class BackupService {
  static readonly SEPARATOR_ROW = '\n';
  static readonly SEPARATOR_COL = ',';

  constructor(private db: Database,
              private papa: Papa) { }

  /**
   * Creates a List of JSON elements separated by `BackupService.SEPARATOR_ROW` holding all elements of the database.
   * This method can be used to created a backup of the data.
   *
   * @returns Promise<string> a string containing all elements of the database separated by SEPARATOR_ROW
   */
  getJsonExport(): Promise<string> {
    return this.db.getAll()
      .then(results => this.createJson(results));
  }

  /**
   * Creates a string of stringified JSON values separated by BackupService.SEPARATOR_ROW
   *
   * @param data the data which should be converted to JSON
   * @returns string containing all the values stringified elements of the input data
   */
  createJson(data): string {
    let res = '';
    data.forEach(r => {
      res += JSON.stringify(r) + BackupService.SEPARATOR_ROW;
    });

    return res.trim();
  }

  /**
   * Creates a CSV string of the whole database
   *
   * @returns string a valid CSV string
   */
  getCsvExport(): Promise<string> {
    return this.db.getAll()
      .then(results => this.createCsv(results));
  }

  /**
   * Creates a CSV string of the input data
   *
   * @param data an array of elements
   * @returns string a valid CSV string of the input data
   */
  createCsv(data: Entity[]): string {
    const resultFields = ['_id', '_rev'];
    data.forEach(d => {
      for (const propertyName in d) {
        if (resultFields.indexOf(propertyName) === -1) {
          resultFields.push(propertyName);
        }
      }
    });
    return this.papa.unparse(
        {data: data, fields: resultFields},
        {quotes: true, header: true});
  }

  /**
   * Removes all but the user entities of the database
   *
   * @returns Promise<any> a promise that resolves after all remove operations are done
   */
  clearDatabase(): Promise<any> {
    const userEntityPrefix = new User('').getType() + ':';

    return this.db.getAll().then(allDocs => {
      const p = [];
      allDocs.forEach(row => {
        if (!row._id.startsWith(userEntityPrefix)) {
          // skip User entities in order to not break login!
          p.push(this.db.remove(row));
        }
      });
      return Promise.all(p);
    });
  }

  /**
   * Fills the database with the provided JSON data.
   * Data should be generated by the `getJsonExport` function
   *
   * @param json data to be saved to the database
   * @param forceUpdate should existing objects be overridden? Default false
   *
   * @returns Promise<any> a promise that resolves after all save operations are done
   */
  importJson(json, forceUpdate = false) {
    const promises = [];
    json.split(BackupService.SEPARATOR_ROW)
      .forEach(record => {
        promises.push(this.db.put(JSON.parse(record), forceUpdate));
      });
    return Promise.all(promises);
  }

  /**
   * Fills the database with the elements of the CSV string
   *
   * @param csv a valid CSV string
   * @param forceUpdate should existing elements be overridden? Default false
   *
   * @returns Promise<any> a promise that resolves after all save operations are done
   */
  importCsv(csv, forceUpdate = false): Promise<any> {
    const promises = [];

    const parsedCsv = this.papa.parse(csv, { header: true, dynamicTyping: true, skipEmptyLines: true });
    parsedCsv.data.forEach(record => {
      // remove undefined properties
      for (const propertyName in record) {
        if (record[propertyName] === null) {
          delete record[propertyName];
        }
      }

      promises.push(this.db.put(record, forceUpdate));
    });

    return Promise.all(promises);
  }
}
