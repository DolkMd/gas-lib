/**
 * @param {string} sheetId
 * @return {SpreadsheetDBRepository}
 */
function newSpreadsheetDBRepository(sheetId) {
    return new SpreadsheetDBRepository(sheetId);
}
  
class SpreadsheetDBRepository {
    /**
     * @param {string} spreadsheetId
     */
    constructor(spreadsheetId) {
      /** @type {string} */
      this.spreadsheetId = spreadsheetId;
    }

    /**
     * @param  {string} tableName
     * @return {Query}
     */
    select(tableName) {
      return Query.select(this.spreadsheetId, tableName);
    }
  
    /**
     * @param {string} tableName
     * @param {Array<string>} cols
     */
    createTable(tableName, cols) {
      Table.createTable(this.spreadsheetId, tableName, cols);
    }
  }
  
  const QUERY_NAME = 'QUERY';
  class QueryNotFoundError extends Error {
    constructor() {
      super('Not found "QUERY" sheet');
    }
  }
  class SheetNotFoundError extends Error {
    constructor(sheetName) {
      super(`Not found ${sheetName} sheet`);
    }
  }

class Query {
    /**
     * @param {string} spreadsheetId
     * @param {string} tableName
     */
    constructor(spreadsheetId, tableName) { 
      /** @type {Table} */
      this.table = new Table(spreadsheetId, tableName);
    }
   
    /**
     * @param  {SpreadsheetApp.Spreadsheet} sheets
     * @param  {string} tableName
     * @return {Query}
     */
    static select(spreadsheetId, tableName) {
      return new Query(spreadsheetId, tableName);
    }
  
    /**
     * @param {object} value
     */
    insert(value) {
      this.insertValues([value]);
    }
  
    /**
     * @param {object[]} values
     */
    insertValues(values) {
      const colNames = this.table.getColNames();
      const records = values.map(value => colNames.filter(v => v != "id").map(colName => value[colName]));
      this.table.insertRows(records);
    }
  
    /**
     * @param  {string} where
     * @return {Object.<string, any>[][]}
     */
    read(where) {
      return this.table.query(where);
    }
  
    /**
     * @param {string} where
     */
    delete(where) {
      const records = this.read(where);
      records.forEach(record => {
        const id = record[0];
        this.table.deleteById(id);
      });
    }
  
    /**
     * @param {Object.<string, any>} data
     * @param {string} where
     */
    update(data, where) {
      const records = this.read(where);
      const colNames = this.table.getColNames();
      records.forEach((record) => {
        const id = record[0];
        let row = colNames.map(colName => data[colName]);
        row = record.map((record, idx) => row[idx] !== undefined ? row[idx] : record);
        this.table.overwriteById(id, row);
      });
    }
}

class Table {
    /**
     * @param {SpreadsheetApp.Spreadsheet[]} sheets
     * @param {string} tableName
     */
    constructor(spreadsheetId, tableName) {
      /** @type {string} */
      this.name = tableName;
      /** @type {SpreadsheetApp.Spreadsheet[]} */
      this.sheets = SpreadsheetApp.openById(spreadsheetId);
      /** @type {SpreadsheetApp.Spreadsheet} */
      this.sheet = this.sheets.getSheetByName(tableName);
      /** @type {string} */
      this.querySheet = this.sheets.getSheetByName(QUERY_NAME);
     
      if (!this.sheet) throw new SheetNotFoundError(tableName);
      if (!this.querySheet) {
        const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        this.querySheet = activeSpreadsheet.insertSheet();
        this.querySheet.setName(QUERY_NAME);
        if (!this.querySheet) throw new QueryNotFoundError();
      }
    }
  
    /**
     * @param  {string} spreadsheetId
     * @param  {string} name
     * @param  {Array<string>} cols
     * @return {SpreadsheetApp.Spreadsheet}
     */
    static createTable(spreadsheetId, name, cols) {
      if (name === QUERY_NAME) throw new Error("Cannot create table name " + QUERY_NAME);
      if (!cols.length) throw new Error("Cols is empty");
      const activeSpreadsheet =  SpreadsheetApp.openById(spreadsheetId);
      try {
        cols.unshift("id");
        const sheet = activeSpreadsheet.insertSheet(name);
        sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
      } catch (e) {
        Logger.log(e);
      }
    }
  
    /**
     * @param {number} row
     * @param {number} col
     * @param {any[]}    value
     */
    setValue(row, col, value) {
      this.setValues(row, col, [value])
    }
  
     /**
     * @param {number}  row
     * @param {number}  col
     * @param {any[][]} values
     */
    setValues(row, col, values) {
      if (values.length) {
        this.sheet.getRange(row, col, values.length, values[0].length).setValues(values);
      } else {
        throw new Error("cannot insert empty value");
      }
    }
  
    /**
     * @return {number}
     */
    getQueryLastRowIdx() {
      const maxRow = this.querySheet.getMaxRows();
      if(this.querySheet.getRange(maxRow,1).getValue()!== "") this.querySheet.insertRowsAfter(maxRow, 100);
      return this.querySheet.getRange(this.querySheet.getMaxRows(), 1).getNextDataCell(SpreadsheetApp.Direction.UP).getRow();
    }
  
    /**
     * @return {number}
     */
    getQueryLastColIdx() {
      return this.querySheet.getRange(1, this.querySheet.getMaxColumns()).getNextDataCell(SpreadsheetApp.Direction.PREVIOUS).getColumn();
    }
  
    /**
     * @return {number}
     */
    getLastRowIdx() {
      const maxRow = this.sheet.getMaxRows();
      if(this.sheet.getRange(maxRow,1).getValue()!== "") this.sheet.insertRowsAfter(maxRow, 100);
      return this.sheet.getRange(this.sheet.getMaxRows(), 1).getNextDataCell(SpreadsheetApp.Direction.UP).getRow();
    }
  
    /**
     * @return {number}
     */
    getLastColIdx() {
      return this.sheet.getRange(1, this.sheet.getMaxColumns()).getNextDataCell(SpreadsheetApp.Direction.PREVIOUS).getColumn();
    }
  
    /**
     * @param  {number} idx
     * @return {Array<string>}
     */
    getRows(idx) {
      return this.sheet.getRange(idx, 1, 1, this.getLastColIdx()).getValues()[0];
    }
  
    /**
     * @return {Array<string>}
     */
    getColNames() {
      return this.getRows(1);
    }
  
    /**
     * @param {number} id
     * @param {Array<any>} values
     */
    overwriteById(id, values) {
      values.forEach((value, idx) => this.setValue(id, idx+1, value));
    }
  
    /**
     * @param {Array<any>} value
     */
    insertRow(value) {
      this.insertRows([value]);
    }
  
     /**
     * @param {Array<any[]>} values
     */
    insertRows(values) {
      values.forEach(value => value.unshift(Utilities.getUuid()));
      this.setValues(this.getLastRowIdx()+1, 1, values);
    }
  
    /**
     * @param  {string} name
     * @return {int}
     */
    cnvColIdx(name) {
      const colNames = this.getColNames();
      return colNames.findIndex(colName => colName === name) + 1;
    }
  
    /**
     * @param  {string} name
     * @return {string}
     */
    cnvColIdxName(name) {
      const idx = this.cnvColIdx(name);
      return String.fromCharCode(65+idx-1);
    }
  
    /**
     * @param {string} where
     */
    query(where) {
      if (!this.querySheet) throw new QueryNotFoundError();
  
      const range = this.name + "!A2:" + this.getLastRowIdx();
      if (where) {
        this.getColNames()
          .forEach((colName) => where = where.replace(new RegExp( `${colName}`, 'g'), `${this.cnvColIdxName(colName)}`));
        this.querySheet.getRange("A1").setValue(`=QUERY(${range}, "WHERE ${where}")`);
      } else {
        this.querySheet.getRange("A1").setValue(`=QUERY(${range})`);
      }
      
      const result = this.querySheet.getRange(1, 1, this.getQueryLastRowIdx(), this.getQueryLastColIdx()).getValues();
      return result.length && result[0].length && result[0][0] === '#N/A' ? undefined : result;
    }
  
    /**
     * @param {number} id
     */
    deleteById(id) {
      this.sheet.deleteRow(id);
    }
  
    /**
     * @param {Array<number>} id
     */
    deleteByIds(ids) {
      this.sheet.deleteRows(ids);
    }
} 
  
  