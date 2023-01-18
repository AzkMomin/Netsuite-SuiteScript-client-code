/* 
 * to do: invoice column empty condition; 
 * 
*/

var USE_DEPLOYMENT_PARAMETER = true;
var DO_ARCHIVE_FILE = true;

//var para_csv_header1 = 'journalItemLine_subsidiaryline,externalID,jetype,subsidiary,tranDate,journalItemLine_accountRef,journalItemLine_nameRef,journalItemLine_departmentRef,journalItemLine_debitAmount,journalItemLine_memo';
var author = 385548;  // emp: ray zhu
var bs_usage_notify_email = 'rayzhu@gmail.com';

var senderId = 385548;
var log_interval = 100;
// var dynamic_mode = false;

var auto_chunking = true;
var para_csv_header = 'JE Type,subsidiary_internalid,account_internalid,Date,Amount (Debit),Amount (Credit)';
var auto_chunk_size = 10000;

var bs_upload_folder = 2220;
var bs_working_folder = 2267;
var bs_upload_archive = 2221;

var header_map = 
    {
      "externalid": {
        "ns_field": "externalid",
        "hard_code_value": null,
        "is_line_field": false,
        "is_picklist_text": false
      },
      "trandate": {
        "ns_field": "trandate",
        "hard_code_value": null,
        "is_line_field": false,
        "picklist_text": false
      },
      "subsidiary_internalid": {
        "ns_field": "subsidiary",
        "hard_code_value": null,
        "is_line_field": false,
        "is_picklist_text": false
      },
      "JE Type": {
        "ns_field": "custbody_kbs_jetype",
        "hard_code_value": null,
        "is_line_field": false,
        "is_picklist_text": true
      },
      "department": {
        "ns_field": "department",
        "hard_code_value": null,
        "is_line_field": false,
        "is_picklist_text": false
      },
      "class": {
        "ns_field": "class",
        "hard_code_value": null,
        "is_line_field": false,
        "is_picklist_text": true
      },
      "account_internalid": {
        "ns_field": "account",
        "hard_code_value": null,
        "is_line_field": true,
        "is_picklist_text": false
      },
      "Amount (Debit)": {
        "ns_field": "debit",
        "hard_code_value": null,
        "is_line_field": true,
        "is_picklist_text": false
      },
      "Amount (Credit)": {
        "ns_field": "credit",
        "hard_code_value": null,
        "is_line_field": true,
        "is_picklist_text": false
      }
    };

var opposing_line = 
    {
      "department": -1,
      "class": -1,
      "location": -1,
      "account": 120
    }
;

// rayzhu instance testing
var bs_upload_folder = 5818;
var bs_working_folder = 5819;
var bs_upload_archive = 5820;

var header_map = 
    {
      "account_internalid": {
        "ns_field": "account",
        "hard_code_value": null,
        "is_line_field": true,
        "is_picklist_text": false
      },
      "Amount (Debit)": {
        "ns_field": "debit",
        "hard_code_value": null,
        "is_line_field": true,
        "is_picklist_text": false
      },
      "Amount (Credit)": {
        "ns_field": "credit",
        "hard_code_value": null,
        "is_line_field": true,
        "is_picklist_text": false
      }
    };

var opposing_line = 
    {
      "department": -1,
      "class": -1,
      "location": -1,
      "account": 7
    }
;

var HTTPSMODULE, SFTPMODULE;
var RECORDMODULE, SEARCHMODULE, FILEMODULE, RUNTIMEMODULE, ERRORMODULE;
var RENDERMODULE, EMAILMODULE, LOGMODULE;
var CURRENCYMODULE;
var FORMATMODULE;
var URLMODULE, CACHEMODULE;

/**
*@NApiVersion 2.x
*@NScriptType MapReduceScript
*@NModuleScope Public
*/
define(["N/search", "N/record", "N/file", "N/https", "N/sftp", "N/runtime", 'N/error', 'N/render', 'N/email', 'N/log', 'N/currency', 'N/format', 'N/url', 'N/cache'], runMapReduce);

//********************** MAIN FUNCTION **********************
function runMapReduce(search, record, file, https, sftp, runtime, error, render, email, log, currency, format, url, cache){
  HTTPSMODULE= https;
  SFTPMODULE= sftp;
  RECORDMODULE = record;
  SEARCHMODULE= search;
  FILEMODULE = file;
  RUNTIMEMODULE = runtime;
  ERRORMODULE = error;
  RENDERMODULE = render;
  EMAILMODULE = email;
  LOGMODULE = log;
  CURRENCYMODULE = currency;
  FORMATMODULE = format;
  URLMODULE = url;
  CACHEMODULE = cache;

  //LOGMODULE.debug({title: 'runMapReduce: TIMESTAMP', details: TIMESTAMP});

  return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    summarize: summarize,

    // The exitOnError setting is optional. If excluded,
    // it defaults to false.
    config:{
      //exitOnError: (bs_usage_validation_run ? false : true)
      exitOnError: true
    }
  };
}

function getInputData()
{
  var scriptObj = RUNTIMEMODULE.getCurrentScript();

  if (USE_DEPLOYMENT_PARAMETER) {
    bs_upload_folder = scriptObj.getParameter({name: 'custscript_je_upload_folder_id'});
    bs_working_folder = scriptObj.getParameter({name: 'custscript_je_working_folder_id'});
    bs_upload_archive = scriptObj.getParameter({name: 'custscript_je_upload_archive_id'});
    author = scriptObj.getParameter({name: 'custscript_je_emailauthor_id'});
    bs_usage_notify_email = scriptObj.getParameter({name: 'custscript_je_notify_email'});
    para_csv_header = scriptObj.getParameter({name: 'custscript_je_csv_header'});
    auto_chunking = scriptObj.getParameter({name: 'custscript_je_auto_chunking'});
    auto_chunk_size = scriptObj.getParameter({name: 'custscript_je_auto_chunk_size'});
    //auto_balance = scriptObj.getParameter({name: 'custscript_je_auto_balance'});
    header_map = JSON.parse(scriptObj.getParameter({name: 'custscript_je_header_map'}));
    opposing_line = JSON.parse(scriptObj.getParameter({name: 'custscript_je_opposing_line'}));
  }

  // *** Search Folder ***
  LOGMODULE.debug({title: 'JE Start', details: 'JE load Started'});
  LOGMODULE.debug({title: 'bs_upload_folder', details: bs_upload_folder});
  LOGMODULE.debug({title: 'bs_upload_folder', details: bs_upload_folder});
  LOGMODULE.debug({title: 'USE_DEPLOYMENT_PARAMETER', details: USE_DEPLOYMENT_PARAMETER});
  LOGMODULE.debug({title: 'auto_chunking', details: auto_chunking});
  LOGMODULE.debug({title: 'header_map', details: JSON.stringify(header_map)});
  LOGMODULE.debug({title: 'opposing_line', details: JSON.stringify(opposing_line)});

  var filterExpression = [
    ['folder', 'is', bs_upload_folder]
  ];

  var mySearch = SEARCHMODULE.create({
    type: 'file',
    filters: filterExpression
  });

  var file_results = mySearch.run().getRange({start: 0, end: 999});

  if (file_results && file_results.length > 0) {
    if (auto_chunking) {
      // process one file at a time
      LOGMODULE.debug({title: 'file_results.length', details: file_results.length});

      var fileId = file_results[0].id;

      if (DO_ARCHIVE_FILE) {
        file = FILEMODULE.load({id: fileId});
        file.folder = bs_working_folder;
        fileId = file.save();
        LOGMODULE.debug({title: 'file moved to working folder', details: file.name});
      }

      file = FILEMODULE.load({id: fileId});
      LOGMODULE.debug({title: 'Load file', details: file.name});

      try {
        var iterator = file.lines.iterator();
        iterator.each(function (line) {
          if (line.value.trim() != para_csv_header.trim()) {
            //first line (CSV header) and does not match script parameter
            LOGMODULE.debug({title: 'CSV  file Header', details: line.value});
            LOGMODULE.debug({title: 'Parameter Header', details: para_csv_header});
            //LOGMODULE.debug({title: 'HEADER_MISMATCH', details: 'Header in script parameter does not match header actual CSV'});
            throw ERRORMODULE.create({
              name: 'HEADER_MISMATCH',
              message: 'Header in script parameter does not match header actual CSV.  Parameter|CSV: ' + para_csv_header + '|' + line.value
            });
          }
          return false;
        });
        file.resetStream();
      }
      catch(eout)
      {
        var error_message = eout.message;
        error_message = eout.name + ' ' + eout.message;
        LOGMODULE.debug({title: 'error_message=>line', details: error_message});

        file = null;
      }

      var je_load_cache = CACHEMODULE.getCache({name: 'JE_LOAD_CACHE', scope: CACHEMODULE.Scope.PRIVATE});
      je_load_cache.put({key: 'filename', value: file.name});

      // LOGMODULE.debug({title: 'Feeding file content to map', details: file.name});
      return file;
    }
    else {
      // no auto_chunking. Submit all files in the folder
      return file_results;  // search results
    }
  }
}

function map(context)
{
  var currentkey = parseInt(context.key);
  var currentline = context.value;

  try {

    var scriptObj = RUNTIMEMODULE.getCurrentScript();
    if (USE_DEPLOYMENT_PARAMETER) {
      bs_upload_folder = scriptObj.getParameter({name: 'custscript_je_upload_folder_id'});
      bs_working_folder = scriptObj.getParameter({name: 'custscript_je_working_folder_id'});
      bs_upload_archive = scriptObj.getParameter({name: 'custscript_je_upload_archive_id'});
      author = scriptObj.getParameter({name: 'custscript_je_emailauthor_id'});
      bs_usage_notify_email = scriptObj.getParameter({name: 'custscript_je_notify_email'});
      para_csv_header = scriptObj.getParameter({name: 'custscript_je_csv_header'});
      auto_chunking = scriptObj.getParameter({name: 'custscript_je_auto_chunking'});
      auto_chunk_size = scriptObj.getParameter({name: 'custscript_je_auto_chunk_size'});
      //auto_balance = scriptObj.getParameter({name: 'custscript_je_auto_balance'});
      header_map = JSON.parse(scriptObj.getParameter({name: 'custscript_je_header_map'}));
      opposing_line = JSON.parse(scriptObj.getParameter({name: 'custscript_je_opposing_line'}));
    }

    //var auto_chunking = true;
    if (auto_chunking) {
      // we have lines of a single file here.
      // -1 is taking the header line into account
      var new_key = Math.floor((parseInt(context.key)-1)/parseInt(auto_chunk_size));
      // LOGMODULE.debug({title: 'new_key|context.key', details: new_key + '|' + context.key + '===>' + context.value});
      if (context.value && parseInt(context.key) > 0) {
        // lots of empty lines in the end with only comma ,, in the end.
        if (context.value.replace(/,/g, "").length > 0) {
          //context.write(new_key, context.value);
        }
        else {
          return;
        }
      }
      else {
        return;
      }

      // build customer externalid to internalid map
      //var headArray = CSVtoArray(para_csv_header.replace(/'/g, "").replace(/""/g, ""));
      var headArray = CSVtoArray(para_csv_header);

      var assArray = new Object();
      //var valueArray = CSVtoArray(currentline.replace(/'/g, "").replace(/""/g, ""));
      var valueArray = CSVtoArray(currentline);

      if (!valueArray || valueArray.length < 3) {
        // likely an empty line, or many header lines. don't bother
        return;
      }

      for(var j=0; j<headArray.length; j++){
        if (valueArray[j]) {
          assArray[headArray[j]]=valueArray[j].trim();
        }
      }

      if (assArray[headArray[0]] == headArray[0]) {
        // header line
        return;
      }

      var new_line = context.value;

      for (var csv_column in header_map) {
        if (header_map[csv_column].is_line_field && header_map[csv_column].ns_field == 'entity' && header_map[csv_column].is_picklist_text) {

          var externalid = assArray[csv_column];
          var this_cache = CACHEMODULE.getCache({name: 'KDS_CUSTOMER_EXTID_MAP', scope: CACHEMODULE.Scope.PRIVATE});
          // this_cache = null;
          var internalid = get_customer_internalid_by_externalid(this_cache, externalid);

          if (!isempty(externalid) && isempty(internalid)) {
            throw ERRORMODULE.create({
              name: 'CUSTOMER_NOT_FOUND',
              message: 'Line: ' + context.key + ' externalid===>' + externalid + '===>' + context.value
            });
          }

          new_line = '';
          for(var j=0; j<headArray.length; j++){
            if (headArray[j] == csv_column) {
              assArray[headArray[j]] = internalid;
            }

            // if field value has comma, double quote it
            if (assArray[headArray[j]] && assArray[headArray[j]].indexOf(',') > -1) {
              assArray[headArray[j]] = '"' + assArray[headArray[j]] + '"';
            }

            if (j < headArray.length-1) {
              new_line += (assArray[headArray[j]]?assArray[headArray[j]]:'') + ',';
            }
            else {
              new_line += (assArray[headArray[j]]?assArray[headArray[j]]:'');
            }
          }

          //LOGMODULE.debug({title: 'externalid===>internalid', details: externalid + '===>' + internalid});
          //LOGMODULE.debug({title: 'old_line', details: currentline});
          //LOGMODULE.debug({title: 'new_line', details: new_line});

          break;
        }
      }

      context.write(new_key, new_line);
    }
    else {
      // no auto_chunking. we have the search result of files here. each file is a JE
      context.write(context.key, context.value);
      LOGMODULE.debug({title: 'context.key===>value', details: context.key + '===>' + context.value});
    }
    // single JE
  }
  catch(eout)
  {
    LOGMODULE.debug({title: 'error_message=>line', details: context.value + '=>' + JSON.stringify(eout)});
    // throw ERRORMODULE.create({name: 'MAPPING_ERROR', message: JSON.stringify(eout)});
    throw eout;
  }
}

function get_customer_internalid_by_externalid(this_cache, data) {

  if (!data) {
    return '';
  }

  var internalid = null;

  if (this_cache && !isempty(this_cache.get({key: data}))) {
    internalid = this_cache.get({key: data});
    if (isempty(internalid)) {
      //throw ERRORMODULE.create({name: 'INTERNALID EMPTY from CACHE!', message: 'Data: ' + data});
      //return null;
    }
  }

  if (isempty(internalid)) {
    var filterExpression =	[ ['isinactive', 'is', 'F'], 'AND',
                             [ 'externalidstring', 'is', data] ];

    var mySearch = SEARCHMODULE.create({
      type: 'customer',
      columns: [
        {name: 'internalid'},
        {name: 'subsidiary'},
        {name: 'externalid'}
      ],
      filters: filterExpression
    });

    var searchResult = mySearch.run().getRange({start: 0, end: 1});

    if (searchResult && searchResult.length == 1) {
      internalid = searchResult[0].getValue('internalid');
      /*
			if (isempty(internalid)) {
				throw ERRORMODULE.create({
					name: 'INTERNALID EMPTY!',
					message: 'JSON.stringify(searchResult): ' + JSON.stringify(searchResult)
				});
			}
			*/
      if (this_cache) {
        this_cache.put({key: data, value: internalid});
      }
    }

    /*
		if (searchResult && searchResult.length > 1) {
			throw ERRORMODULE.create({
				name: 'RETURNED MORE THAN 1 CUSTOMER',
				message: 'Data: ' + data
			});
		}
		else if (searchResult && searchResult.length < 1) {
			throw ERRORMODULE.create({
				name: 'RETURNED 0 CUSTOMER',
				message: 'Data: ' + data
			});
		}
		*/
  }

  return internalid;
}


function reduce(context)
{
  var scriptObj = RUNTIMEMODULE.getCurrentScript();
  if (USE_DEPLOYMENT_PARAMETER) {
    bs_upload_folder = scriptObj.getParameter({name: 'custscript_je_upload_folder_id'});
    bs_working_folder = scriptObj.getParameter({name: 'custscript_je_working_folder_id'});
    bs_upload_archive = scriptObj.getParameter({name: 'custscript_je_upload_archive_id'});
    author = scriptObj.getParameter({name: 'custscript_je_emailauthor_id'});
    bs_usage_notify_email = scriptObj.getParameter({name: 'custscript_je_notify_email'});
    para_csv_header = scriptObj.getParameter({name: 'custscript_je_csv_header'});
    auto_chunking = scriptObj.getParameter({name: 'custscript_je_auto_chunking'});
    auto_chunk_size = scriptObj.getParameter({name: 'custscript_je_auto_chunk_size'});
    //auto_balance = scriptObj.getParameter({name: 'custscript_je_auto_balance'});
    header_map = JSON.parse(scriptObj.getParameter({name: 'custscript_je_header_map'}));
    opposing_line = JSON.parse(scriptObj.getParameter({name: 'custscript_je_opposing_line'}));
  }

  var dynamic_mode = scriptObj.getParameter({name: 'custscript_dynamic_mode'});
  var ignore_field_change = scriptObj.getParameter({name: 'custscript_ignore_field_change'});
  var aje_formid = scriptObj.getParameter({name: 'custscript_aje_formid'});

  var je_load_cache = CACHEMODULE.getCache({name: 'JE_LOAD_CACHE', scope: CACHEMODULE.Scope.PRIVATE});
  if (je_load_cache) {
    var filename = je_load_cache.get({key: 'filename'});
  }

  var seq = ('000' + (parseInt(context.key)+1));
  var seq = seq.substring(seq.length-4, seq.length);

  var this_cache = CACHEMODULE.getCache({name: 'KDS_CUSTOMER_EXTID_MAP', scope: CACHEMODULE.Scope.PRIVATE});

  try {

    var lines;
    var fileId;
    var file;

    if (!auto_chunking) {
      // no auto_chunking. we have an array of 1 element, which is one file.

      // ?????
      LOGMODULE.debug({title: 'context.values', details: context.values});
      var this_value = JSON.parse(context.values[0]);
      var fileId = this_value.id;

      file = FILEMODULE.load({id: fileId});
      lines = file.getContents().split("\n");

      var iterator = file.lines.iterator();
      iterator.each(function (line) {
        if (line.value.trim() != para_csv_header.trim()) {
          //first line (CSV header) and does not match script parameter
          LOGMODULE.debug({title: 'CSV  file Header', details: line.value});
          LOGMODULE.debug({title: 'Parameter Header', details: para_csv_header});
          //LOGMODULE.debug({title: 'HEADER_MISMATCH', details: 'Header in script parameter does not match header actual CSV'});
          throw ERRORMODULE.create({
            name: 'HEADER_MISMATCH',
            message: 'Header in script parameter does not match header actual CSV.  Parameter|CSV: ' + para_csv_header + '|' + line.value
          });
        }
        return false;
      });

      filename = file.name;
      file.resetStream();
    }
    else {
      lines = context.values;
    }

    //var dynamic_mode = false;
    var ignore_field_change = true;
    var aje_formid = null;

    if (dynamic_mode) {
      // For Dynamic, must set ignore_field_change = false, or you will get all kinds of errors. So set in code.
      ignore_field_change = false;
    }
    var use_promise = false;

    var currentline = '';
    var theJEId = null;

    var real_linecount = null;
    var error_message = '';

    LOGMODULE.debug({title: 'header', details: para_csv_header});

    var headArray = para_csv_header.split ("\t");
    if (headArray && headArray.length == 1) {
      // it's probably CSV already
      //headArray = CSVtoArray(para_csv_header.replace(/'/g, "").replace(/""/g, ""));
      headArray = CSVtoArray(para_csv_header);
    }

    //LOGMODULE.debug({title: 'lines', details: lines});

    if (!lines || lines.length < 1) {
      // at least should have 1 line of data
      // archive the file
      return;
    }

    LOGMODULE.debug({title: 'lines.length', details: lines.length});
    //LOGMODULE.debug({title: 'custscript_je_header_map', details: scriptObj.getParameter({name: 'custscript_je_header_map'})});
    //LOGMODULE.debug({title: 'JSON.stringify(header_map)', details: '=>' + JSON.stringify(header_map)});

    var reduce_start_timestamp = Math.floor(Date.now() / 1000);

    var today = new Date();
    var trandate = new Date(today.getFullYear(), today.getMonth(), 0);
    var transaction_count = 0;
    var theJE;
    var tranid = null;

    var real_linecount = 0;
    var total_debit = 0.0;
    var total_credit = 0.0;

    // account_map maps account number to account id
    var account_map = new Object();
    for (var csv_column in header_map) {
      if (header_map[csv_column].ns_field == 'account' && header_map[csv_column].is_picklist_text) {
        // search to build map
        var filterExpression = [];
        var mySearch = SEARCHMODULE.create({
          type: 'account',
          columns: [
            {name: 'internalid'},
            {name: 'number'},
            {name: 'type'},
            {name: 'name'}
          ],
          filters: filterExpression
        });

        var this_results = mySearch.run().getRange({start: 0, end: 999});
        if (this_results && this_results.length > 0) {
          for (var i = 0; i < this_results.length; i++) {
            account_map[this_results[i].getValue('number')] = this_results[i].getValue('internalid');
          }
        }
        break;
      }
    }

    // currency_map maps current code to id
    var currency_map = new Object();
    for (var csv_column in header_map) {
      if (header_map[csv_column].ns_field == 'currency' && header_map[csv_column].is_picklist_text) {
        // search to build map
        var filterExpression = [];
        var mySearch = SEARCHMODULE.create({
          type: 'currency',
          columns: [
            {name: 'internalid'},
            {name: 'symbol'}
          ],
          filters: filterExpression
        });

        var this_results = mySearch.run().getRange({start: 0, end: 999});
        //LOGMODULE.debug({title: 'currency JSON.stringify(this_results)', details: JSON.stringify(this_results)});
        if (this_results && this_results.length > 0) {
          for (var i = 0; i < this_results.length; i++) {
            currency_map[this_results[i].getValue('symbol')] = parseInt(this_results[i].getValue('internalid'));
          }
        }
        break;
      }
    }

    // subsidiary_map maps current code to id
    var subsidiary_map = new Object();
    for (var csv_column in header_map) {
      if (header_map[csv_column].ns_field == 'subsidiary' && header_map[csv_column].is_picklist_text) {
        // search to build map
        var filterExpression = [];
        var mySearch = SEARCHMODULE.create({
          type: 'subsidiary',
          columns: [
            {name: 'internalid'},
            {name: 'parent'},
            {name: 'namenohierarchy'},
            {name: 'name'}
          ],
          filters: filterExpression
        });

        var this_results = mySearch.run().getRange({start: 0, end: 999});
        //LOGMODULE.debug({title: 'subsidiary JSON.stringify(this_results)', details: JSON.stringify(this_results)});
        if (this_results && this_results.length > 0) {
          for (var i = 0; i < this_results.length; i++) {
            var one_sample_sub = 
                {
                  "recordType": "subsidiary",
                  "id": "3",
                  "values": {
                    "internalid": [
                      {
                        "value": "3",
                        "text": "3"
                      }
                    ],
                    "parent": "1",
                    "name": "Parent Company : IFS"
                  }
                };

            subsidiary_map[this_results[i].getValue('namenohierarchy')] = parseInt(this_results[i].getValue('internalid'));
          }
        }
        break;
      }
    }

    // dept_map maps department number to account id
    var dept_map = new Object();
    var dept_externalid_map = new Object();
    var dept_businesssector_map = new Object();
    var dept_service_class_map = new Object();
    for (var csv_column in header_map) {
      if (header_map[csv_column].ns_field == 'department' && header_map[csv_column].is_picklist_text) {
        // search to build map
        var filterExpression = [];
        var mySearch = SEARCHMODULE.create({
          type: 'department',
          columns: [
            {name: 'internalid'},
            {name: 'externalid'},
            {name: 'custrecord_businesssector'},
            {name: 'custrecord_service_class'},
            {name: 'name'}
          ],
          filters: filterExpression
        });

        var this_results = mySearch.run().getRange({start: 0, end: 999});
        if (this_results && this_results.length > 0) {
          for (var i = 0; i < this_results.length; i++) {
            dept_map[this_results[i].getValue('name')] = this_results[i].getValue('internalid');
            dept_externalid_map[this_results[i].getValue('externalid')] = this_results[i].getValue('internalid');
            dept_businesssector_map[this_results[i].getValue('externalid')] = this_results[i].getValue('custrecord_businesssector');
            dept_service_class_map[this_results[i].getValue('externalid')] = this_results[i].getValue('custrecord_service_class');
          }
        }
        break;
      }
    }

    /*
		// customer_externalid_map maps customer externalid to internalid
		var customer_externalid_map = new Object();
		for (var csv_column in header_map) {
			if (header_map[csv_column].ns_field == 'entity' && header_map[csv_column].is_picklist_text) {
				// search to build map
				//var filterExpression = ['externalidstring', 'isnotempty', ''];
				//var filterExpression = [];
				var filterExpression =	[ ['isinactive', 'is', 'F'], 'AND',
				                      	  [ 'externalidstring', 'isnotempty', null] ];

				var mySearch = SEARCHMODULE.create({
					type: 'customer',
					columns: [
					          {name: 'internalid'},
					          {name: 'externalid'}
					          ],
					        filters: filterExpression
				});

				var nextStart = 0;
				var search_count = 0;

				LOGMODULE.debug({title: 'BUILD customer_externalid_map, Start timestamp', details: new Date().toString() + ' customer_externalid_map.length=' + Object.keys(customer_externalid_map).length});

				while (true) {
					//LOGMODULE.debug("position: 2");

					try {
						// get max 1000 rows
						var searchResult = mySearch.run().getRange({start: nextStart, end: nextStart+1000});

						//LOGMODULE.debug({title: 'searchResult', details: JSON.stringify(searchResult)});
						if (searchResult === null || searchResult.length ===0) {
							LOGMODULE.debug("position: 3");
							break;
						}
					}
					catch(eout)
					{
						LOGMODULE.debug({title: 'eout', details: JSON.stringify(eout)});
						break;
					}

					//LOGMODULE.debug("position: 4");
					//LOGMODULE.debug("searchResult.length: " + searchResult.length);
					//LOGMODULE.debug({title: 'search_count, timestamp, searchResult.length', details: new Date().toString() + '=> ' + searchResult.length + ' ' + search_count});

					for (var i = 0; i < searchResult.length; i++) {
						var result = searchResult[i];

						customer_externalid_map[searchResult[i].getValue('externalid')] = searchResult[i].getValue('internalid');

						if (i == 0) {
							//LOGMODULE.debug({title: 'timestamp, externalid, internalid', details: new Date().toString() + '=> ' + searchResult[i].getValue('externalid') + '=>' + searchResult[i].getValue('internalid')});
						}
					}

					nextStart += 1000;
					search_count++;
				}

				LOGMODULE.debug({title: 'BUILD customer_externalid_map, END timestamp', details: new Date().toString() + ' customer_externalid_map.length=' + Object.keys(customer_externalid_map).length});

				break;
			}
		}
		*/

    // is_intercompany?
    var is_intercompany = false;
    for (var csv_column in header_map) {
      if (header_map[csv_column].ns_field == 'linesubsidiary') {
        is_intercompany = true;
        break;
      }
    }

    for (var i = 0; i < lines.length; i++) {

      currentline = lines[i];

      //LOGMODULE.debug({title: 'real_linecount=>line=>i', details:  real_linecount + '=>' + currentline + '=>' + i});

      var assArray = new Object();
      var valueArray = null;

      var valueArray = lines[i].split ("\t");
      if (valueArray && valueArray.length == 1) {
        // it's probably CSV already
        valueArray = null;
        //valueArray = CSVtoArray(lines[i].replace(/'/g, "").replace(/""/g, ""));
        valueArray = CSVtoArray(lines[i]);
      }

      if (!valueArray || valueArray.length < 3) {
        // likely an empty line, or many header lines. don't bother
        continue;
      }

      for(var j=0; j<headArray.length; j++){
        if (valueArray[j]) {
          assArray[headArray[j]]=valueArray[j].trim();
        }
      }

      if (assArray[headArray[0]] == headArray[0]) {
        // header line
        continue;
      }

      //LOGMODULE.debug({title: 'assArray', details: JSON.stringify(assArray)});

      // journalItemLine_subsidiaryline,externalID,jetype,subsidiary,tranDate,journalItemLine_accountRef,journalItemLine_nameRef,journalItemLine_departmentRef,journalItemLine_debitAmount,journalItemLine_memo

      // header
      if (real_linecount == 0) {
        // create JE and populate header
        var theJE=RECORDMODULE.create({
          type: (is_intercompany ? RECORDMODULE.Type.ADV_INTER_COMPANY_JOURNAL_ENTRY : RECORDMODULE.Type.JOURNAL_ENTRY),
          isDynamic: dynamic_mode
        });

        //	this second
        var this_linux_second = Math.floor((new Date().getTime()) / 1000);
        //var externalid = this_linux_second;
        // var memo_main = 'RAY_TEST_' + externalid;

        //LOGMODULE.debug({title: 'jetype', details: assArray['jetype']});

        for (var csv_column in header_map) {
          //LOGMODULE.debug({title: 'csv_column=>header_map[csv_column]', details:  csv_column + '=>' + header_map[csv_column] + '=>' + i});
          //console.log(csv_column + " -> " + header_map[csv_column]);
          if (header_map.hasOwnProperty(csv_column)) {
            //console.log(csv_column + " -> " + header_map[csv_column]);
            if (!header_map[csv_column].is_line_field) {
              if(assArray.hasOwnProperty(csv_column)){
                var this_value = assArray[csv_column];
              }
              else {
                // header_map column does exist in CSV, or has no value. default value????
                var this_value = header_map[csv_column].hard_code_value;
              }

              if (isempty(this_value)) {
                // no value provided
                continue;
              }

              if (header_map[csv_column].is_picklist_text) {
                if (header_map[csv_column].ns_field == 'subsidiary') {
                  theJE.setValue({fieldId: header_map[csv_column].ns_field, value: subsidiary_map[this_value], ignoreFieldChange: ignore_field_change});
                }
                else if (header_map[csv_column].ns_field == 'currency') {
                  theJE.setValue({fieldId: header_map[csv_column].ns_field, value: currency_map[this_value], ignoreFieldChange: ignore_field_change});
                }
                else if (header_map[csv_column].ns_field == 'trandate' || header_map[csv_column].ns_field == 'reversaldate') {
                  if (this_value.indexOf('/') > -1) {
                    // date: 02/26/2021 or 2/26/2021
                    var trandate_date = FORMATMODULE.parse({
                      value: this_value,
                      type: FORMATMODULE.Type.DATE
                    });
                  }
                  else {
                    // date: 02262021 to 02/26/2021
                    var trandate_date = FORMATMODULE.parse({
                      value: (this_value.substring(0,2) + '/' + this_value.substring(2,4) + '/' +  this_value.substring(4,8)),
                      type: FORMATMODULE.Type.DATE
                    });
                  }
                  theJE.setValue({fieldId: header_map[csv_column].ns_field, value: trandate_date, ignoreFieldChange: ignore_field_change});
                }
                else {
                  theJE.setText({fieldId: header_map[csv_column].ns_field, text: this_value, ignoreFieldChange: ignore_field_change});
                }

                //LOGMODULE.debug({title: 'HEADER ns_field(Text)=>line#', details:  csv_column + '=>' + header_map[csv_column].ns_field + '=>' + this_value + '=>line: ' + i});
              }
              else {
                if (csv_column == 'Header') {
                  // use HEADER to create document number tranid
                  tranid = this_value.replace(/ /g, '_').trim() + '_' + seq;
                  theJE.setValue({fieldId: 'tranid', value: tranid, ignoreFieldChange: ignore_field_change});
                }

                theJE.setValue({fieldId: header_map[csv_column].ns_field, value: this_value, ignoreFieldChange: ignore_field_change});
                //LOGMODULE.debug({title: 'HEADER csv_column=>ns_field(Value)=>line#', details: csv_column + '=>' + header_map[csv_column].ns_field + '=>' + this_value + '=>line: ' + i});
                // LOGMODULE.debug({title: 'JSON.stringify(header_map[csv_column])', details: csv_column + '=>' + JSON.stringify(header_map[csv_column])});
                // LOGMODULE.debug({title: 'JSON.stringify(header_map)', details: csv_column + '=>' + JSON.stringify(header_map)});
              }
            }
          }
        }
      }

      // set tranid to be filename + seq
      if (auto_chunking) {
        tranid = filename.replace(/[^0-9a-zA-Z _@]/g, "_").substring(0,35) + '_' + seq;
      }
      else {
        tranid = filename.replace(/[^0-9a-zA-Z _@]/g, "_").substring(0,35);
      }
      theJE.setValue({fieldId: 'tranid', value: tranid, ignoreFieldChange: ignore_field_change});

      // lines
      if (theJE.isDynamic) {

        theJE.selectNewLine({sublistId: 'line'});

        for (var csv_column in header_map) {
          if (header_map[csv_column].is_line_field) {
            if(assArray.hasOwnProperty(csv_column)){
              var this_value = assArray[csv_column];
            }
            else {
              // header_map column does exist in CSV, or has no value. default value????
              var this_value = header_map[csv_column].hard_code_value;
            }

            if (isempty(this_value)) {
              // no value provided
              continue;
            }

            if (header_map[csv_column].is_picklist_text) {
              if (header_map[csv_column].ns_field == 'account') {
                // If it's account. the account number is not simple text, it's mapped to internalid instead.
                if (!account_map[this_value]) {
                  throw ERRORMODULE.create({
                    name: 'INVALID_ACCOUNT',
                    message: 'GL Account not found. ' + csv_column + '=' + this_value
                  });
                }
                theJE.setCurrentSublistValue({sublistId: 'line', fieldId: header_map[csv_column].ns_field, value: account_map[this_value], ignoreFieldChange: ignore_field_change});
              }
              else if (header_map[csv_column].ns_field == 'department') {
                // internal id 209	
                // name 3020 Finance
                // CSV has 3020, this_value = 3020
                // 3020 is prefix in dept name, and could also be externalid.

                // found dept.
                if (dept_externalid_map[this_value]) {
                  theJE.setCurrentSublistValue({sublistId: 'line', fieldId: header_map[csv_column].ns_field, value: dept_externalid_map[this_value], ignoreFieldChange: ignore_field_change});
                }
                if (dept_service_class_map[this_value]) {
                  theJE.setCurrentSublistValue({sublistId: 'line', fieldId: 'class', value: dept_service_class_map[this_value], ignoreFieldChange: ignore_field_change});
                }
                if (dept_businesssector_map[this_value]) {
                  theJE.setCurrentSublistValue({sublistId: 'line', fieldId: 'cseg1', value: dept_businesssector_map[this_value], ignoreFieldChange: ignore_field_change});
                }
              }
              // else if (header_map[csv_column].ns_field == 'entity' && customer_externalid_map[this_value]) {
              // else if (header_map[csv_column].ns_field == 'entity' && get_customer_internalid_by_externalid(this_cache, this_value)) {
              else if (header_map[csv_column].ns_field == 'entity' && this_value) {
                //theJE.setCurrentSublistValue({sublistId: 'line', fieldId: header_map[csv_column].ns_field, value: customer_externalid_map[this_value], ignoreFieldChange: ignore_field_change});
                //theJE.setCurrentSublistValue({sublistId: 'line', fieldId: header_map[csv_column].ns_field, value: get_customer_internalid_by_externalid(this_cache, this_value), ignoreFieldChange: ignore_field_change});
                theJE.setCurrentSublistValue({sublistId: 'line', fieldId: header_map[csv_column].ns_field, value: this_value, ignoreFieldChange: ignore_field_change});
              }
              else {
                theJE.setCurrentSublistText({sublistId: 'line', fieldId: header_map[csv_column].ns_field, text: this_value, ignoreFieldChange: ignore_field_change});
              }
              //LOGMODULE.debug({title: 'ns_field(Text)=>line#', details:  header_map[csv_column].ns_field + '=>' + this_value + '=>line: ' + i});
            }
            else {
              // debit and credit cannot be both populated
              if (header_map[csv_column].ns_field == 'debit') {
                // number contains ( ), to represents negative in accounting. Negative is a credit amount. It may also have comma separator
                var is_negative = (this_value.indexOf('(') > -1 || this_value.indexOf('-') > -1);
                this_value = this_value.replace('(', '').replace(')', '').replace(',', '');
                var this_value_float = Math.abs(parseFloat(this_value));
                if (is_negative) {
                  if (this_value_float > 0.0) {
                    theJE.setCurrentSublistValue({sublistId: 'line', fieldId: 'credit', value: this_value_float, ignoreFieldChange: ignore_field_change});
                    //LOGMODULE.debug({title: 'ns_field(Value)=>line#', details:  header_map[csv_column].ns_field + '=>' + this_value + '=>line: ' + i});
                    total_credit += this_value_float;
                  }
                }
                else {
                  if (this_value_float > 0.0) {
                    theJE.setCurrentSublistValue({sublistId: 'line', fieldId: 'debit', value: this_value_float, ignoreFieldChange: ignore_field_change});
                    //LOGMODULE.debug({title: 'ns_field(Value)=>line#', details:  header_map[csv_column].ns_field + '=>' + this_value + '=>line: ' + i});
                    total_debit += this_value_float;
                  }
                }
              } 
              else if (header_map[csv_column].ns_field == 'credit') {
                var is_negative = (this_value.indexOf('(') > -1 || this_value.indexOf('-') > -1);
                this_value = this_value.replace('(', '').replace(')', '').replace(',', '');
                var this_value_float = Math.abs(parseFloat(this_value));
                if (is_negative) {
                  if (this_value_float > 0.0) {
                    theJE.setCurrentSublistValue({sublistId: 'line', fieldId: 'debit', value: this_value_float, ignoreFieldChange: ignore_field_change});
                    total_debit += this_value_float;
                  }
                }
                else {
                  if (this_value_float > 0.0) {
                    theJE.setCurrentSublistValue({sublistId: 'line', fieldId: 'credit', value: this_value_float, ignoreFieldChange: ignore_field_change});
                    total_credit += this_value_float;
                  }
                }

                /*
								var this_value_float = parseFloat(this_value);
								if (this_value_float > 0) {
									theJE.setCurrentSublistValue({sublistId: 'line', fieldId: header_map[csv_column].ns_field, value: this_value_float, ignoreFieldChange: ignore_field_change});
									//LOGMODULE.debug({title: 'ns_field(Value)=>line#', details:  header_map[csv_column].ns_field + '=>' + this_value + '=>line: ' + i});
									total_credit += this_value_float;
								}
								*/
              } 
              else {
                theJE.setCurrentSublistValue({sublistId: 'line', fieldId: header_map[csv_column].ns_field, value: this_value, ignoreFieldChange: ignore_field_change});
              }
            }
          }
        }

        var line_debit_amount = theJE.getCurrentSublistValue({sublistId: 'line', fieldId: 'debit'});
        var line_credit_amount = theJE.getCurrentSublistValue({sublistId: 'line', fieldId: 'credit'});
        if (isempty(line_debit_amount) && isempty(line_credit_amount)) {
          //LOGMODULE.debug({title: 'BOTH Debit and Credit are Zero', details:  currentline});
          theJE.setCurrentSublistValue({sublistId: 'line', fieldId: 'debit', value: 0.00, ignoreFieldChange: ignore_field_change});
        }

        //check mandatoryFieldsValidations

        var getAcc=theJE.getCurrentSublistValue({sublistId: 'line', fieldId: 'account'});
        var getclass=theJE.getCurrentSublistValue({sublistId: 'line', fieldId: 'class'});
        if(getAcc=="50700" && !getclass)
        {

          theJE.setCurrentSublistValue({sublistId: 'line', fieldId: "class", value: 14});
          theJE.setCurrentSublistValue({sublistId: 'line', fieldId:"cseg1" , value: 6});
        }

        theJE.commitLine({sublistId: 'line'});

        real_linecount++;

      }
      else {
		  
        theJE.insertLine({sublistId: 'line', line: real_linecount, ignoreRecalc: true, beforeLineInstanceId: real_linecount+1});

        for (var csv_column in header_map) {
          if (header_map[csv_column].is_line_field) {
            if(assArray.hasOwnProperty(csv_column)){
              var this_value = assArray[csv_column];
            }
            else {
              // header_map column does exist in CSV, or has no value. default value????
              var this_value = header_map[csv_column].hard_code_value;
            }

            if (isempty(this_value)) {
              // no value provided
              continue;
            }

            if (header_map[csv_column].is_picklist_text) {
              //AC001
                                        //      theJE.setSublistValue({ sublistId: 'line', fieldId: 'class', line: real_linecount, value:"", ignoreFieldChange: ignore_field_change });
              //AC001
              if (header_map[csv_column].ns_field == 'account') {
                if (!account_map[this_value]) {
                  throw ERRORMODULE.create({
                    name: 'INVALID_ACCOUNT',
                    message: 'GL Account not found. ' + csv_column + '=' + this_value
                  });
                }
                // If it's account. the account number is not simple text, it's mapped to internalid instead.
                theJE.setSublistValue({sublistId: 'line', fieldId: header_map[csv_column].ns_field, line: real_linecount, value: account_map[this_value], ignoreFieldChange: ignore_field_change});
              }
              else if (header_map[csv_column].ns_field == 'department') {
				  log.debug("inside 1090");
				  log.debug("this_value",this_value);
				  log.debug("class",dept_service_class_map[this_value]);
				  log.debug("class detail",dept_service_class_map);
				  log.debug("dept",dept_businesssector_map[this_value]);
				  log.debug("dept detail",dept_businesssector_map);
                // internal id 209	
                // name 3020 Finance
                // CSV has 3020, this_value = 3020
                // 3020 is prefix in dept name, and could also be externalid.
                // found dept.
                if (dept_externalid_map[this_value]) {
                  theJE.setSublistValue({sublistId: 'line', fieldId: header_map[csv_column].ns_field, line: real_linecount, value: dept_externalid_map[this_value], ignoreFieldChange: ignore_field_change});
                }
                if (dept_service_class_map[this_value]) {
					log.debug("inside service");
                  theJE.setSublistValue({sublistId: 'line', fieldId: 'class', line: real_linecount, value:dept_service_class_map[this_value], ignoreFieldChange: ignore_field_change});
                }
                if (dept_businesssector_map[this_value]) {
					log.debug("inside business");
                  theJE.setSublistValue({sublistId: 'line', fieldId: 'cseg1', line: real_linecount, value: dept_businesssector_map[this_value], ignoreFieldChange: ignore_field_change});
                }
        //        LOGMODULE.debug({title: 'dept', details:  this_value + 'internalid =>' + dept_externalid_map[this_value] + ' dept_service_class_map=>' + dept_service_class_map[this_value] + ' dept_businesssector_map=>' + dept_businesssector_map[this_value]});
              }
              //else if (header_map[csv_column].ns_field == 'entity' && customer_externalid_map[this_value]) {
              //else if (header_map[csv_column].ns_field == 'entity' && get_customer_internalid_by_externalid(this_cache, this_value)) {
              else if (header_map[csv_column].ns_field == 'entity' && this_value) {
                //theJE.setSublistValue({sublistId: 'line', fieldId: header_map[csv_column].ns_field, line: real_linecount, value: customer_externalid_map[this_value], ignoreFieldChange: ignore_field_change});
                //theJE.setSublistValue({sublistId: 'line', fieldId: header_map[csv_column].ns_field, line: real_linecount, value: get_customer_internalid_by_externalid(this_cache, this_value), ignoreFieldChange: ignore_field_change});
                theJE.setSublistValue({sublistId: 'line', fieldId: header_map[csv_column].ns_field, line: real_linecount, value: this_value, ignoreFieldChange: ignore_field_change});
              }
              else {
                theJE.setSublistText({sublistId: 'line', fieldId: header_map[csv_column].ns_field, line: real_linecount, text: this_value, ignoreFieldChange: ignore_field_change});
                //LOGMODULE.debug({title: 'ns_field(Text)=>line#', details:  csv_column + '=>' + header_map[csv_column].ns_field + '=>' + this_value + '=>line: ' + i});
              }
              // dept_map[this_results[i].getValue('name')] = this_results[i].getValue('internalid');
              //LOGMODULE.debug({title: 'ns_field(Text)=>line#', details:  csv_column + '=>' + header_map[csv_column].ns_field + '=>' + this_value + '=>line: ' + i});
              //LOGMODULE.debug({title: 'ns_field(Text)=>line#', details:  csv_column + '=>' + header_map[csv_column].ns_field + '=>' + this_value + '=>line: ' + i});
            }
            else {
              // debit and credit cannot be both populated
              //LOGMODULE.debug({title: 'ns_field(Value)=>line#', details:  header_map[csv_column].ns_field + '=>' + this_value + '=>line: ' + i});
              if (header_map[csv_column].ns_field == 'debit' && this_value) {
                // number contains ( ), to represents negative in accounting. Negative is a credit amount. It may also have comma separator
                var is_negative = (this_value.indexOf('(') > -1 || this_value.indexOf('-') > -1);
                this_value = this_value.replace('(', '').replace(')', '').replace(',', '');
                var this_value_float = Math.abs(parseFloat(this_value));
                if (is_negative) {
                  if (this_value_float > 0.0) {
                    theJE.setSublistValue({sublistId: 'line', fieldId: 'credit', line: real_linecount, value: this_value_float, ignoreFieldChange: ignore_field_change});
                    //LOGMODULE.debug({title: 'ns_field(Value)=>line#', details:  header_map[csv_column].ns_field + '=>' + this_value + '=>line: ' + i});
                    total_credit += this_value_float;
                  }
                }
                else {
                  if (this_value_float > 0.0) {
                    theJE.setSublistValue({sublistId: 'line', fieldId: 'debit', line: real_linecount, value: this_value_float, ignoreFieldChange: ignore_field_change});
                    //LOGMODULE.debug({title: 'ns_field(Value)=>line#', details:  header_map[csv_column].ns_field + '=>' + this_value + '=>line: ' + i});
                    total_debit += this_value_float;
                  }
                }
              } 
              else if (header_map[csv_column].ns_field == 'credit' && this_value) {
                var is_negative = (this_value.indexOf('(') > -1 || this_value.indexOf('-') > -1);
                this_value = this_value.replace('(', '').replace(')', '').replace(',', '');
                var this_value_float = Math.abs(parseFloat(this_value));
                if (is_negative) {
                  if (this_value_float > 0.0) {
                    theJE.setSublistValue({sublistId: 'line', fieldId: 'debit', line: real_linecount, value: this_value_float, ignoreFieldChange: ignore_field_change});
                    total_debit += this_value_float;
                  }
                }
                else {
                  if (this_value_float > 0.0) {
                    theJE.setSublistValue({sublistId: 'line', fieldId: 'credit', line: real_linecount, value: this_value_float, ignoreFieldChange: ignore_field_change});
                    total_credit += this_value_float;
                  }
                }

                /*
								var this_value_float = parseFloat(this_value);
								if (this_value_float > 0) {
									theJE.setSublistValue({sublistId: 'line', fieldId: header_map[csv_column].ns_field, line: real_linecount, value: this_value_float, ignoreFieldChange: ignore_field_change});
									//LOGMODULE.debug({title: 'ns_field(Value)=>line#', details:  header_map[csv_column].ns_field + '=>' + this_value + '=>line: ' + i});
									total_credit += this_value_float;
								}
								*/
              } 
              else {
                theJE.setSublistValue({sublistId: 'line', fieldId: header_map[csv_column].ns_field, line: real_linecount, value: this_value, ignoreFieldChange: ignore_field_change});
              }
            }
          }
        }

        // check if both lines are 0, set the debit amount to 0 instead of both null
        var line_debit_amount = theJE.getSublistValue({sublistId: 'line', fieldId: 'debit', line: real_linecount});
        var line_credit_amount = theJE.getSublistValue({sublistId: 'line', fieldId: 'credit', line: real_linecount});
        if (isempty(line_debit_amount) && isempty(line_credit_amount)) {
          //LOGMODULE.debug({title: 'BOTH Debit and Credit are Zero', details:  currentline});
          theJE.setSublistValue({sublistId: 'line', fieldId: 'debit', line: real_linecount, value: 0.0, ignoreFieldChange: ignore_field_change});
        }


        var getAcc=theJE.getSublistValue({sublistId: 'line', fieldId: 'account',line: real_linecount});
        var getclass=theJE.getSublistText({sublistId: 'line', fieldId: 'class',line: real_linecount});
        log.debug('getAcc : ' + getAcc)
        log.debug('getclass : ' + getclass)
        if(getAcc=="50700" && !getclass)
        {

          theJE.setSublistValue({sublistId: 'line', fieldId: "class", line: real_linecount, value: 14});
          theJE.setSublistValue({sublistId: 'line', fieldId:"cseg1" , line: real_linecount, value: 6});
        }
        real_linecount++;
      }

    }

    if (real_linecount > 0) {
      // auto balancing
      // add opposing line here. Single line for now

      if (Math.abs(total_credit - total_debit)>0) {

        LOGMODULE.debug({title: 'JE auto balance. Amount', details: total_debit - total_credit});

        if (theJE.isDynamic) {
          theJE.selectNewLine({sublistId: 'line'});

          theJE.setCurrentSublistValue({sublistId: 'line', fieldId: 'account', value: opposing_line.account, ignoreFieldChange: ignore_field_change});

          if (total_credit > total_debit) {
            // add opposing debit line
            theJE.setCurrentSublistValue({sublistId: 'line', fieldId: 'debit', value: total_credit-total_debit, ignoreFieldChange: ignore_field_change});
            LOGMODULE.debug({title: 'auto balance line', details:   'account:' + (opposing_line.account) + '|debit: ' + (total_credit-total_debit).toFixed(2) + '|line: ' + i});
          }
          else {
            // add opposing credit line
            theJE.setCurrentSublistValue({sublistId: 'line', fieldId: 'credit', value: total_debit-total_credit, ignoreFieldChange: ignore_field_change});
            LOGMODULE.debug({title: 'auto balance line', details:   'account:' + (opposing_line.account) + '|credit: ' + (total_debit-total_credit).toFixed(2) + '|line: ' + i});
          }

          theJE.commitLine({sublistId: 'line'});
          real_linecount++;
        }
        else {
          theJE.insertLine({sublistId: 'line', line: real_linecount, ignoreRecalc: true, beforeLineInstanceId: real_linecount+1});

          theJE.setSublistValue({sublistId: 'line', fieldId: 'account', line: real_linecount, value: opposing_line.account, ignoreFieldChange: ignore_field_change});

          if (total_credit > total_debit) {
            // add opposing debit line
            theJE.setSublistValue({sublistId: 'line', fieldId: 'debit', line: real_linecount, value: total_credit-total_debit, ignoreFieldChange: ignore_field_change});
            LOGMODULE.debug({title: 'auto balance line', details:   'account:' + (opposing_line.account) + '|debit: ' + (total_credit-total_debit).toFixed(2) + '|line: ' + i});
          }
          else {
            // add opposing credit line
            theJE.setSublistValue({sublistId: 'line', fieldId: 'credit', line: real_linecount, value: total_debit-total_credit, ignoreFieldChange: ignore_field_change});
            LOGMODULE.debug({title: 'auto balance line', details:   'account:' + (opposing_line.account) + '|credit: ' + (total_debit-total_credit).toFixed(2) + '|line: ' + i});
          }

          real_linecount++;
        }
      }
      else {
        LOGMODULE.debug({title: 'JE is self balanced', details: 'account:' + (opposing_line.account) + '|debit: ' + (total_debit).toFixed(2) + '|credit: ' + (total_credit).toFixed(2) + '|line: ' + i});
      }

      var reduce_current_timestamp = Math.floor(Date.now() / 1000);
      var minutes_consumed = ((reduce_current_timestamp - reduce_start_timestamp) / 60).toFixed(2);

      LOGMODULE.debug({title: 'JE before save. ', details: 'minutes_consumed='+minutes_consumed + '|' + 'real_linecount='+real_linecount + '|' + 'dynamic_mode='+dynamic_mode + '|' + 'ignore_field_change='+ignore_field_change + '|' + 'aje_formid='+aje_formid + '|' + 'use_promise='+use_promise});
      //LOGMODULE.debug({title: 'JE dump', details: JSON.stringify(theJE)});

      theJE.setValue({fieldId: 'tranid', value: tranid, ignoreFieldChange: ignore_field_change});
      LOGMODULE.debug({title: 'tranid', details: csv_column + '=>' + tranid});


      var jeid = theJE.save({
        enableSourcing: true,
        ignoreMandatoryFields: false
      });

      /*
			var theJE = RECORDMODULE.load({
				type: RECORDMODULE.Type.JOURNAL_ENTRY,
				id: jeid
			});

			theJE.setValue({fieldId: 'tranid', value: tranid, ignoreFieldChange: ignore_field_change});

			var jeid = theJE.save();
			//*/
      /*
			if (tranid) {
				var jeid = RECORDMODULE.submitFields({
					type: RECORDMODULE.Type.JOURNAL_ENTRY,
					id: jeid,
					values: {
						'tranid':  tranid
					},
					options: {
						enableSourcing: false,
						ignoreMandatoryFields : true
					}
				});
			}
			//*/

      var reduce_current_timestamp = Math.floor(Date.now() / 1000);
      var minutes_consumed = ((reduce_current_timestamp - reduce_start_timestamp) / 60).toFixed(2);

      var msg = 'filename='+filename + '|' + 'jeid='+jeid + '|' + 'tranid='+tranid + '|' + 'real_linecount='+real_linecount + '|' + 'dynamic_mode='+dynamic_mode + '|' + 'minutes_consumed='+minutes_consumed;
      LOGMODULE.debug({title: 'JE SAVED', details:  msg});

      context.write({key: 'OK|' + context.key, value: msg});

      var logRecord = RECORDMODULE.create({type: 'customrecord_je_load_log', isDynamic: false});

      if (filename) {
        logRecord.setValue({fieldId: 'custrecord_csv_filename', value: filename});
      }
      logRecord.setValue({fieldId: 'custrecord_csv_chunking', value: auto_chunking});
      logRecord.setValue({fieldId: 'custrecord_csv_key', value: (parseInt(context.key)+1).toFixed(0)});
      logRecord.setValue({fieldId: 'custrecord_csv_je_number', value: tranid});
      logRecord.setValue({fieldId: 'custrecord_csv_processing_time', value: (new Date()).toISOString()});
      logRecord.setValue({fieldId: 'custrecord_csv_processing_status', value: 'OK'});
      logRecord.setValue({fieldId: 'custrecord_csv_message', value: msg});

      var logRecordId = logRecord.save({enableSourcing: false, ignoreMandatoryFields: false});        

    }

    if (!auto_chunking) {
      // no auto_chunking. archive individual file

      if (DO_ARCHIVE_FILE) {
        file.folder = bs_upload_archive;
        fileId = file.save();
        LOGMODULE.debug({title: 'file moved to archive folder', details: filename});
      }
    }
  }
  catch(eout)
  {
    LOGMODULE.debug({title: 'error_message=>line', details: error_message  + '=>' + currentline + '=>' + JSON.stringify(eout)});

    context.write({key: 'ERROR|' + context.key, value: currentline + '=>' + JSON.stringify(eout)});

    var logRecord = RECORDMODULE.create({type: 'customrecord_je_load_log', isDynamic: false});

    if (filename) {
      logRecord.setValue({fieldId: 'custrecord_csv_filename', value: filename});
    }
    logRecord.setValue({fieldId: 'custrecord_csv_chunking', value: auto_chunking});
    logRecord.setValue({fieldId: 'custrecord_csv_key', value: (parseInt(context.key)+1).toFixed(0)});
    logRecord.setValue({fieldId: 'custrecord_csv_je_number', value: tranid});
    logRecord.setValue({fieldId: 'custrecord_csv_processing_time', value: (new Date()).toISOString()});
    logRecord.setValue({fieldId: 'custrecord_csv_processing_status', value: 'ERROR'});
    logRecord.setValue({fieldId: 'custrecord_csv_message', value: currentline + '=>' + JSON.stringify(eout)});

    var logRecordId = logRecord.save({enableSourcing: false, ignoreMandatoryFields: false});        

  }
}

function summarize(summary)
{
  var scriptObj = RUNTIMEMODULE.getCurrentScript();
  if (USE_DEPLOYMENT_PARAMETER) {
    bs_upload_folder = scriptObj.getParameter({name: 'custscript_je_upload_folder_id'});
    bs_working_folder = scriptObj.getParameter({name: 'custscript_je_working_folder_id'});
    bs_upload_archive = scriptObj.getParameter({name: 'custscript_je_upload_archive_id'});
    author = scriptObj.getParameter({name: 'custscript_je_emailauthor_id'});
    bs_usage_notify_email = scriptObj.getParameter({name: 'custscript_je_notify_email'});
    para_csv_header = scriptObj.getParameter({name: 'custscript_je_csv_header'});
    auto_chunking = scriptObj.getParameter({name: 'custscript_je_auto_chunking'});
    auto_chunk_size = scriptObj.getParameter({name: 'custscript_je_auto_chunk_size'});
    //auto_balance = scriptObj.getParameter({name: 'custscript_je_auto_balance'});
    header_map = JSON.parse(scriptObj.getParameter({name: 'custscript_je_header_map'}));
    opposing_line = JSON.parse(scriptObj.getParameter({name: 'custscript_je_opposing_line'}));
  }

  var bs_ctr_validation_run = false;
  var ds = (new Date()).toISOString().replace(/[^0-9]/g, "");
  var summary_filename;

  LOGMODULE.debug({title: 'starttime', details: summary.dateCreated});
  LOGMODULE.debug({title: 'finishtime', details: (new Date())});
  LOGMODULE.debug({title: 'upload_folder', details: bs_upload_folder});
  LOGMODULE.debug({title: 'upload_archive_folder', details: bs_upload_archive});

  if (auto_chunking) {
    var filterExpression = [
      ['folder', 'is', bs_working_folder]
    ];

    var mySearch = SEARCHMODULE.create({
      type: 'file',
      filters: filterExpression
    });

    var file_results = mySearch.run().getRange({start: 0, end: 1});

    var fileContent = [];
    var file = new Object();

    if (file_results && file_results.length == 1) {

      var fileId = file_results[0].id;
      file = FILEMODULE.load({id: fileId});

      var filename = file.name;

      if (fileId && bs_upload_folder && bs_upload_archive && bs_upload_archive != bs_upload_folder) {
        // archive first, change folder, save, then reload.

        if (DO_ARCHIVE_FILE) {
          file.folder = bs_upload_archive;
          fileId = file.save();
          LOGMODULE.debug({title: 'file moved to archive folder', details: filename});
        }
      }

      var myFilename = filename;

      if (bs_ctr_validation_run) {
        myFilename = 'DRY-RUN-' + myFilename;
      }

      summary_filename = myFilename + ".SUMMARY.txt";

      LOGMODULE.debug({title: 'filename', details: myFilename});
    }
    else {
      // processed nothing
      return;
    }
  }
  else {
    summary_filename = "JE-LOAD-" + ds + ".SUMMARY.txt"; 
  }

  //var author = -5;
  if (bs_usage_notify_email.indexOf(',') > -1 ) {
    var recipients = bs_usage_notify_email.split(',');
    for (var i = 0; i < recipients.length; i++) {
      recipients[i] = recipients[i].trim();
    }
  }
  else if (bs_usage_notify_email.indexOf(';') > -1 ) {
    var recipients = bs_usage_notify_email.split(';');
    for (var i = 0; i < recipients.length; i++) {
      recipients[i] = recipients[i].trim();
    }
  }
  else {
    var recipients = bs_usage_notify_email.trim();
  }

  d = new Date();  // 2018-06-04T00:47:42.551Z

  LOGMODULE.debug({title: 'SUMMARY filename', details: summary_filename});

  var subject = 'JE Load Notification'  + (bs_ctr_validation_run ? ' (Dry Run)' : '');

  var body = 'JE Load Processing Finished: ' + (bs_ctr_validation_run? '(Dry Run)' : '') + '\r\n' +
      '\r\n' +
      'email sent to: ' + bs_usage_notify_email + '\r\n' +
      '\r\n' +
      'Local Folder ID: ' + bs_upload_folder + '\r\n' +
      'Local Archive Folder ID: ' + bs_upload_archive + '\r\n' +
      //'filename: ' + myFilename + '\r\n' +
      'SUMMARY filename: ' + summary_filename + '\r\n' +
      '\r\n' +
      'start time: ' + summary.dateCreated + '\r\n' +
      'finish time: ' + (new Date()) + '\r\n' +
      'NetSuite usage: ' + summary.usage + '\r\n' +
      'concurrency: ' + summary.concurrency + '\r\n' +
      '\r\n' +
      '\r\n' +
      '\r\n';

  var totalRecordsUpdated = 0;
  var totalRecordsERROR = 0;
  summary.output.iterator().each(function (key, value){
    if (key.indexOf('OK|') > -1) {
      totalRecordsUpdated++;
      body = body + value + '\r\n' 
    }
    else if (key.indexOf('ERROR|') > -1) {
      totalRecordsERROR++;
      body = body + value + '\r\n' 
    }
    else {
    }
    return true;
  });

  // add map error into logs
  summary.mapSummary.errors.iterator().each(function (key, error, executionNo) {
    totalRecordsERROR++;
    LOGMODULE.error('MAP ERROR, key: ' + key, error);
    body = body + 'MAP ERROR, key: ' + key + '. Details: ' + error + '\r\n' 
    return true;
  });

  summary.reduceSummary.errors.iterator().each(function (key, error) {
    LOGMODULE.error('REDUCE ERROR (maybe repeating), key: ' + key, error);
    body = body + 'REDUCE ERROR (maybe repeating), key: ' + key + '. Details: ' + error + '\r\n' 
    return true;
  });

  if ((totalRecordsUpdated + totalRecordsERROR) > 0) {
    if (bs_upload_folder && bs_upload_archive && bs_upload_archive != bs_upload_folder) {
      // archive first, change folder, save, then reload.
      summary_file = FILEMODULE.create({
        name: summary_filename,
        fileType: FILEMODULE.Type.PLAINTEXT,
        folder: bs_upload_archive,
        contents: body
      });

      summary_fileId = summary_file.save();
      LOGMODULE.debug({title: 'summary_filename', details: summary_filename});
    }

    EMAILMODULE.send({
      author: author,
      recipients: recipients,
      subject: subject,
      body: body
    });
  }

  LOGMODULE.debug({title: 'Finish', details: 'JE Loader Finished'});

  return;
}

function trim(str) {
  str = str.replace(/\s+/, '');
  for (var i = str.length - 1; i >= 0; i--) {
    if (/\S/.test(str.charAt(i))) {
      str = str.substring(0, i + 1);
      break;
    }
  }
  return str;
}

function isempty(variable) {
  if (typeof variable == 'undefined' || variable == null || (typeof variable == 'string' && trim(variable) == '')) {
    return true;
  }
  else {
    return false;
  }
}

//https://stackoverflow.com/questions/8493195/how-can-i-parse-a-csv-string-with-javascript-which-contains-comma-in-data
// JavaScript function to parse CSV string:
// Return array of string values, or NULL if CSV string not well formed.

//function CSVtoArray_OLD(text) {
function CSVtoArray(text) {
  var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
  var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
  // Return NULL if input string is not well formed CSV string.
  if (!re_valid.test(text)) return null;
  var a = [];                     // Initialize array to receive values.
  text.replace(re_value, // "Walk" the string using replace with callback.
               function(m0, m1, m2, m3) {
    // Remove backslash from \' in single quoted values.
    if      (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
    // Remove backslash from \" in double quoted values.
    else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
    else if (m3 !== undefined) a.push(m3);
    return ''; // Return empty string.
  });
  // Handle special case of empty last value.
  if (/,\s*$/.test(text)) a.push('');
  return a;
};

// https://stackoverflow.com/questions/1293147/example-javascript-code-to-parse-csv-data
// this DID NOT work, likely the RegExp is not compatible with NS
// function CSVToArray( strData, strDelimiter ){
function CSVtoArray_NEW_DIDNOT_WORK(strData, strDelimiter){
  // Check to see if the delimiter is defined. If not,
  // then default to comma.
  strDelimiter = (strDelimiter || ",");

  // Create a regular expression to parse the CSV values.
  var objPattern = new RegExp(
    (
      // Delimiters.
      "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +

      // Quoted fields.
      "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +

      // Standard fields.
      "([^\"\\" + strDelimiter + "\\r\\n]*))"
    ),
    "gi"
  );


  // Create an array to hold our data. Give the array
  // a default empty first row.
  var arrData = [[]];

  // Create an array to hold our individual pattern
  // matching groups.
  var arrMatches = null;


  // Keep looping over the regular expression matches
  // until we can no longer find a match.
  while (arrMatches = objPattern.exec( strData )){

    // Get the delimiter that was found.
    var strMatchedDelimiter = arrMatches[ 1 ];

    // Check to see if the given delimiter has a length
    // (is not the start of string) and if it matches
    // field delimiter. If id does not, then we know
    // that this delimiter is a row delimiter.
    if (
      strMatchedDelimiter.length &&
      strMatchedDelimiter !== strDelimiter
    ){

      // Since we have reached a new row of data,
      // add an empty row to our data array.
      arrData.push( [] );

    }

    var strMatchedValue;

    // Now that we have our delimiter out of the way,
    // let's check to see which kind of value we
    // captured (quoted or unquoted).
    if (arrMatches[ 2 ]){

      // We found a quoted value. When we capture
      // this value, unescape any double quotes.
      strMatchedValue = arrMatches[ 2 ].replace(
        new RegExp( "\"\"", "g" ),
        "\""
      );

    } else {

      // We found a non-quoted value.
      strMatchedValue = arrMatches[ 3 ];

    }


    // Now that we have our value string, let's add
    // it to the data array.
    arrData[ arrData.length - 1 ].push( strMatchedValue );
  }

  // Return the parsed data.
  return( arrData );
}


//https://stackoverflow.com/questions/1293147/example-javascript-code-to-parse-csv-data
// this function is not the main on this page, it's in the comment section. It does multiple lines. So we will make a wrapper that handles 1 line only.
function CSVtoArray_NEW2(text) {
  //function CSVtoArray(text) {
  var arr = parseCSV(text);

  if (arr.length > 0) {
    return arr[0];
  }
  else {
    return [];
  }
}

//https://stackoverflow.com/questions/1293147/example-javascript-code-to-parse-csv-data
//this function is not the main on this page, it's in the comment section. It does multiple lines. So we will make a wrapper that handles 1 line only.
function parseCSV(str) {
  var arr = [];
  var quote = false;  // 'true' means we're inside a quoted field

  // Iterate over each character, keep track of current row and column (of the returned array)
  for (var row = 0, col = 0, c = 0; c < str.length; c++) {
    var cc = str[c], nc = str[c+1];        // Current character, next character
    arr[row] = arr[row] || [];             // Create a new row if necessary
    arr[row][col] = arr[row][col] || '';   // Create a new column (start with empty string) if necessary

    // If the current character is a quotation mark, and we're inside a
    // quoted field, and the next character is also a quotation mark,
    // add a quotation mark to the current column and skip the next character
    if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }

    // If it's just one quotation mark, begin/end quoted field
    if (cc == '"') { quote = !quote; continue; }

    // If it's a comma and we're not in a quoted field, move on to the next column
    if (cc == ',' && !quote) { ++col; continue; }

    // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
    // and move on to the next row and move to column 0 of that new row
    if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }

    // If it's a newline (LF or CR) and we're not in a quoted field,
    // move on to the next row and move to column 0 of that new row
    if (cc == '\n' && !quote) { ++row; col = 0; continue; }
    if (cc == '\r' && !quote) { ++row; col = 0; continue; }

    // Otherwise, append the current character to the current column
    arr[row][col] += cc;
  }
  return arr;
}