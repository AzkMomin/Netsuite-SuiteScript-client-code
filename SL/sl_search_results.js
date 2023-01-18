/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

 var PAGE_SIZE = 50
 var SEARCH_ID = 'customsearchtransactiondefaultview_4_2'
 
 var CLIENT_SCRIPT_FILE_ID = 870
 
 define(['N/ui/serverWidget', 'N/search', 'N/redirect'],
   function (serverWidget, search, redirect) {
     function onRequest(context) {
       if (context.request.method === 'GET') {
 
         var form = serverWidget.createForm({
           title: 'Bulk Picking Lists',
           hideNavBar: false,
         })
 
         form.clientScriptModulePath = 'Bulk Picking List/cs_page_controls.js'
 
         // Get parameters
         var pageId = parseInt(context.request.parameters.page)
         var scriptId = context.request.parameters.script
         var deploymentId = context.request.parameters.deploy
 
         // Add sublist that will show results
         var sublist = form.addSublist({
           id: 'custpage_table',
           type: serverWidget.SublistType.LIST,
           label: 'Picking Tickets',
         })
 
         // Add columns to be shown on Page
         sublist.addField({
           id: 'apply',
           label: 'apply',
           type: serverWidget.FieldType.TEXT,
         })
 
         sublist.addField({
           id: 'id',
           label: 'INTERNAL ID',
           type: serverWidget.FieldType.TEXT,
         })
 
         sublist.addField({
           id: 'date',
           label: 'DATE',
           type: serverWidget.FieldType.TEXT,
         })
         sublist.addField({
           id: 'shipdate',
           label: 'SHIP DATE',
           type: serverWidget.FieldType.TEXT,
         })
 
         sublist.addField({
           id: 'canceldate',
           label: 'CANCEL DATE',
           type: serverWidget.FieldType.TEXT,
         })
 
         sublist.addField({
           id: 'print',
           label: 'PRINT',
           type: serverWidget.FieldType.TEXT,
         })
 
         sublist.addField({
           id: 'type',
           label: 'TYPE',
           type: serverWidget.FieldType.TEXT,
         })
 
         sublist.addField({
           id: 'docnumber',
           label: 'DOCUMENT NUMBER',
           type: serverWidget.FieldType.TEXT,
         })
 
         sublist.addField({
           id: 'transaction_number',
           label: 'TRANSACTION NUMBER',
           type: serverWidget.FieldType.TEXT,
         })
 
         sublist.addField({
           id: 'name',
           label: 'NAME',
           type: serverWidget.FieldType.TEXT,
         })
         sublist.addField({
           id: 'account',
           label: 'ACCOUNT',
           type: serverWidget.FieldType.TEXT,
         })
 
         sublist.addField({
           id: 'pocheck',
           label: 'PO/CHECK NUMBER',
           type: serverWidget.FieldType.TEXT,
         })
 
         sublist.addField({
           id: 'shipping_address',
           label: 'SHIPPING ADDRESS',
           type: serverWidget.FieldType.TEXT,
         })
 
         sublist.addField({
           id: 'status',
           label: 'STATUS',
           type: serverWidget.FieldType.TEXT,
         })
 
         sublist.addField({
           id: 'tracking_number',
           label: 'TRACKING NUMBER',
           type: serverWidget.FieldType.TEXT,
         })
 
         sublist.addField({
           id: 'memo',
           label: 'MEMO',
           type: serverWidget.FieldType.TEXT,
         })
         sublist.addField({
           id: 'currency',
           label: 'Currency',
           type: serverWidget.FieldType.TEXT,
         })
         sublist.addField({
           id: 'fxamount',
           label: 'AMOUNT (FOREIGN CURRENCY) ',
           type: serverWidget.FieldType.TEXT,
         })
         sublist.addField({
           id: 'amount',
           label: 'AMOUNT',
           type: serverWidget.FieldType.TEXT,
         })
         sublist.addField({
           id: 'transaction_unit',
           label: 'TRANSACTION UNIT',
           type: serverWidget.FieldType.TEXT,
         })
         sublist.addField({
           id: 'posting',
           label: 'POSTING',
           type: serverWidget.FieldType.TEXT,
         })
         sublist.addField({
           id: 'created_form',
           label: 'CREATED FROM',
           type: serverWidget.FieldType.TEXT,
         })
 
 
         // Run search and determine page count
         var retrieveSearch = runSearch(SEARCH_ID, PAGE_SIZE)
         var pageCount = Math.ceil(retrieveSearch.count / PAGE_SIZE)
         //log.debug('retrieveSearch',retrieveSearch)
         //log.debug('pageCount',pageCount)
 
         // Set pageId to correct value if out of index
         if (!pageId || pageId == '' || pageId < 0)
           pageId = 0
         else if (pageId >= pageCount)
           pageId = pageCount - 1
 
         // Add buttons to simulate Next & Previous
         if (pageId != 0) {
           form.addButton({
             id: 'custpage_previous',
             label: 'Previous',
             functionName: 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId - 1) + ')',
           })
         }
 
         if (pageId != pageCount - 1) {
           form.addButton({
             id: 'custpage_next',
             label: 'Next',
             functionName: 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId + 1) + ')',
           })
         }
 
 
         //var searchResults = getSearchResult(SEARCH_ID)
 
         // Add drop-down and options to navigate to specific page
         var selectOptions = form.addField({
           id: 'custpage_pageid',
           label: 'Page Index',
           type: serverWidget.FieldType.SELECT,
         })
 
         var companyName = form.addField({
           id: 'custpage_companyname',
           label: 'Company Name',
           type: serverWidget.FieldType.DATE,
         })
 
         var poCheckNumber = form.addField({
           id: 'custpage_pochecknumber',
           label: 'PO Check Number',
           type: serverWidget.FieldType.TEXT,
 
         })
 
         var ShippingAddress = form.addField({
           id: 'custpage_shippingAddress',
           label: 'Shipping Address',
           type: serverWidget.FieldType.TEXT,
         })
 
 
         var actualShipDate = form.addField({
           id: 'custpage_actualshipdate',
           label: 'Actual Ship Date',
           type: serverWidget.FieldType.DATE,
 
         })
 
         var from = form.addField({
           id: 'custpage_from',
           label: 'From',
           type: serverWidget.FieldType.TEXT,
 
         })
         var to = form.addField({
           id: 'custpage_to',
           label: 'To',
           type: serverWidget.FieldType.TEXT,
 
         })
 
         // var data = form.addButton({
         //   id: 'custpage_filter',
         //   label: 'Filter',
         //   functionName: 'getFilterData',
         // })
         //getFilteredData()
         for (i = 0; i < pageCount; i++) {
           if (i == pageId) {
             selectOptions.addSelectOption({
               value: 'pageid_' + i,
               text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE),
               isSelected: true,
             })
           } else {
             selectOptions.addSelectOption({
               value: 'pageid_' + i,
               text: ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE),
             })
           }
         }
 
 
         // Get subset of data to be shown on page
         var addResults = fetchSearchResult(retrieveSearch, pageId)
         //log.debug('Search Results : ', addResults)
         form.addButton({
           id: 'custpage_print',
           label: 'XYZ',
           functionName: "printTicketList('hello')",
         })
 
         // Set data returned to columns
         var j = 0
         addResults.forEach(function (result) {
           sublist.setSublistValue({
             id: 'id',
             line: j,
             value: result.internalId,
           })
 
           sublist.setSublistValue({
             id: 'date',
             line: j,
             value: result.shipdate,
           })
 
           sublist.setSublistValue({
             id: 'cancelDate',
             line: j,
             value: result.cancelDate,
           })
 
           sublist.setSublistValue({
             id: 'print',
             line: j,
             value: result.print,
           })
 
           sublist.setSublistValue({
             id: 'type',
             line: j,
             value: result.type,
           })
 
           sublist.setSublistValue({
             id: 'tranid',
             line: j,
             value: result.tranid,
           })
 
          
 
           sublist.setSublistValue({
             id: 'transactionnumber',
             line: j,
             value: result.transactionnumber,
           })
           sublist.setSublistValue({
             id: 'entity',
             line: j,
             value: result.entity,
           })
           sublist.setSublistValue({
             id: 'account',
             line: j,
             value: result.account,
           })
 
           sublist.setSublistValue({
             id: 'otherrefnum',
             line: j,
             value: result.otherrefnum,
           })
           sublist.setSublistValue({
             id: 'statusref',
             line: j,
             value: result.statusref,
           })
           
           sublist.setSublistValue({
             id: 'shipaddressee',
             line: j,
             value: result.shipaddressee,
           })
           
           sublist.setSublistValue({
             id: 'trackingnumbers',
             line: j,
             value: result.trackingnumbers,
           })
           sublist.setSublistValue({
             id: 'memo',
             line: j,
             value: result.memo,
           })
 
           sublist.setSublistValue({
             id: 'currency',
             line: j,
             value: result.currency,
           })
           sublist.setSublistValue({
             id: 'fxamount',
             line: j,
             value: result.fxamount,
           })
           sublist.setSublistValue({
             id: 'amount',
             line: j,
             value: result.amount,
           })
           sublist.setSublistValue({
             id: 'docunit',
             line: j,
             value: result.docunit,
           })
           sublist.setSublistValue({
             id: 'posting',
             line: j,
             value: result.posting,
           })
           sublist.setSublistValue({
             id: 'createdfrom',
             line: j,
             value: result.createdfrom,
           })
 
           j++
         })
 
         context.response.writePage(form)
       }
     }
 
     return {
       onRequest: onRequest,
     }
 
 
 
 
 
     function runSearch(searchId, searchPageSize) {
       var searchObj = search.load({
         id: searchId,
       })
 
       log.debug('searchObj', JSON.stringify(searchObj))
 
       return searchObj.runPaged({
         pageSize: searchPageSize,
       })
     }
 
     function fetchSearchResult(pagedData, pageIndex) {
 
       var searchPage = pagedData.fetch({
         index: pageIndex,
       })
 
       var results = new Array()
 
       searchPage.data.forEach(function (result) {
         //var internalId = result.internalId
         var internalId = result.getValue({
           name: 'internalId',
         })
 
         var shipdate = result.getValue({
           name: 'shipdate',
         })
 
         var cancelDate = result.getValue({
           name: 'custbody_sps_date_001',
         })
 
         var print = result.getValue({
           name: 'print',
         })
 
         var type = result.getValue({
           name: 'type',
         })
         //log.debug('entityid : ' , entityid)
 
         var tranid = result.getValue({
           name: 'tranid',
         })
 
         var transactionnumber = result.getValue({
           name: 'transactionnumber',
         })
 
         var entity = result.getValue({
           name: 'entity',
         })
         var account = result.getValue({
           name: 'account',
         })
         var otherrefnum = result.getValue({
           name: 'otherrefnum',
         })
         var shipaddressee = result.getValue({
           name: 'shipaddressee',
         })
         var statusref = result.getValue({
           name: 'statusref',
         })
         var trackingnumbers = result.getValue({
           name: 'trackingnumbers',
         })
         var memo = result.getValue({
           name: 'memo',
         })
         var currency = result.getValue({
           name: 'currency',
         })
         var fxamount = result.getValue({
           name: 'fxamount',
         })
         var amount = result.getValue({
           name: 'amount',
         })
         var docunit = result.getValue({
           name: 'docunit',
         })
         var posting = result.getValue({
           name: 'posting',
         })
 
         var createdfrom = result.getValue({
           name: 'createdfrom',
         })
 
         //  log.debug('Search Result :: ' , JSON.stringify({
         //    'internalId': internalId,
         //    'trandate': trandate,
         //    'docnumber': tranid,
         //    'poCheckNumber': poCheckNumber,
         //    'entityid': entityid,
         //    'altname': altname,
         //    'item': item,
         //    'binnumber': binnumber,
         //    'quantity': quantity,
         //  }))
 
         results.push({
           'internalId': internalId,
           'shipdate': shipdate,
           'cancelDate': cancelDate,
           'print': print,
           'type': type,
           'tranid': tranid,
           'transactionnumber': transactionnumber,
           'entity': entity,
           'account': account,
           'otherrefnum': otherrefnum,
           'shipaddressee': shipaddressee,
           'statusref': statusref,
           'trackingnumbers': trackingnumbers,
           'memo': memo,
           'currency': currency,
           'fxamount': fxamount,
           'amount': amount,
           'docunit': docunit,
           'posting': posting,
           'createdfrom': createdfrom,
 
         })
       })
       return results
     }
 
   })
 