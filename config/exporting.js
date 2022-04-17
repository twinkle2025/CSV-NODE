'use strict'

/** @type {import('@adonisjs/framework/src/Env')} */

module.exports = {
    formats: {
        csv: {
            extension: '.csv',
            description: 'Comma Separated Values',
            maxExport: -1,
        },
        xlsx: {
            extension: '.xlsx',
            description: 'Excel 2007+ XML Format',
            maxExport: 1000000,
        },
        xlsm: {
            extension: '.xlsm',
            description: 'Excel 2007+ Macro XML Format',
            maxExport: 1000000,
        },
        xlsb: {
            extension: '.xlsb',
            description: 'Excel 2007+ Binary Format',
            maxExport: 1000000,
        },
        biff8: {
            extension: '.xls',
            description: 'Excel 97-2004 Workbook Format',
            maxExport: 1000000,
        },
        biff5: {
            extension: '.xls',
            description: 'Excel 5.0/95 Workbook Format',
            maxExport: 1000000,
        },
        biff2: {
            extension: '.xls',
            description: 'Excel 2.0 Worksheet Format',
            maxExport: 1000000,
        },
        xlml: {
            extension: '.xls',
            description: 'Excel 2003-2004 (SpreadsheetML)',
            maxExport: 1000000,
        },
        ods: {
            extension: '.ods',
            description: 'OpenDocument Spreadsheet',
            maxExport: 1000000,
        },
        fods: {
            extension: '.fods',
            description: 'Flat OpenDocument Spreadsheet',
            maxExport: 1000000,
        },
        txt: {
            extension: '.txt',
            description: 'UTF-16 Unicode Text (TXT)',
            maxExport: 1000000,
        },
        sylk: {
            extension: '.sylk',
            description: 'Symbolic Link (SYLK)',
            maxExport: 1000000,
        },
        html: {
            extension: '.html',
            description: 'HTML Document',
            maxExport: 1000000,
        },
        dif: {
            extension: '.dif',
            description: 'Data Interchange Format (DIF)',
            maxExport: 1000000,
        },
        dbf: {
            extension: '.dbf',
            description: 'dBASE II + VFP Extensions (DBF)',
            maxExport: 1000000,
        },
        rtf: {
            extension: '.rtf',
            description: 'Rich Text Format (RTF)',
            maxExport: 1000000,
        },
        prn: {
            extension: '.prn',
            description: 'Lotus Formatted Text',
            maxExport: 1000000,
        },
        eth: {
            extension: '.eth',
            description: 'Ethercalc Record Format (ETH)',
            maxExport: 1000000,
        },
    }
}
