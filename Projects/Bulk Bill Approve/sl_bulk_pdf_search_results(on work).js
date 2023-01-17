/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

var PAGE_SIZE = 50
var SEARCH_ID = 'customsearch11738'

define(['N/ui/serverWidget', 'N/search', 'N/render', 'N/record'],
  function (serverWidget, search, render, record) {
    function onRequest(context) {
      if (context.request.method === 'GET') {

        var form = serverWidget.createForm({
          title: 'Bulk Pdf',
          hideNavBar: false,
        })

        form.clientScriptModulePath = 'Bulk Bill/cs_bulk_bill_approve_page_controls.js'

        var fieldChangeData = new Map()
        // Get parameters
        var scriptId = context.request.parameters.script
        var deploymentId = context.request.parameters.deploy
        var pageId = parseInt(context.request.parameters.page)
        var nameid = context.request.parameters.nameId
        var pocheckNumber = context.request.parameters.pochecknumber


        //Body Fields
        var selectOptions = form.addField({
          id: 'custpage_pageid',
          label: 'Page Index',
          type: serverWidget.FieldType.SELECT,
        })

        selectOptions.updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.STARTROW
        });

        var nameID = form.addField({
          id: 'custpage_nameid',
          label: 'Name/ID',
          type: serverWidget.FieldType.TEXT,
        })

        var poCheckNumber = form.addField({
          id: 'custpage_pochecknumber',
          label: 'PO Check Number',
          type: serverWidget.FieldType.TEXT,

        })


        form.addSubmitButton({
          id: 'custpage_print',
          label: 'Print',
          //functionName: 'createConsolatedANS("' + context + '")',
        })

        // Add sublist that will show results
        var sublist = form.addSublist({
          id: 'custpage_table',
          type: serverWidget.SublistType.LIST,
          label: 'Search Name',
        })

        if (String(nameid) != 'undefined') {
          if (String(nameid) != '') {
            fieldChangeData.set('nameID', [nameID, String(nameid)])
          }
        }
        if (String(pocheckNumber) != 'undefined') {
          if (String(pocheckNumber) != '') {
            fieldChangeData.set('poCheckNumber', [poCheckNumber, String(pocheckNumber)])
          }
        }

        log.debug('fieldChangeData size: ', fieldChangeData.size)



        // Run search and determine page count
        var retrieveSearch = runSearch(SEARCH_ID, PAGE_SIZE, fieldChangeData)
        var pageCount = Math.ceil(retrieveSearch.count / PAGE_SIZE)

        //log.debug('pageCount :', pageCount)

        if (pageCount != 0) {
          createSublist(sublist)
        }


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

        // Add drop-down and options to navigate to specific page
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


        //Checking for age result
        if (pageCount != 0) {
          // Get subset of data to be shown on page
          var addResults = fetchSearchResult(retrieveSearch, pageId)
          // Set data returned to columns
          setDateToSublist(addResults, sublist)
        }

        //log.debug('sublist val : ' , sublist.getSublistValue({id:'id' , line : 1}))

        context.response.writePage(form)


      } else {

        
        var lineCount = context.request.getLineCount({ group: 'custpage_table' });

        for (var i = 0; i < lineCount; i++) {

          var apply = context.request.getSublistValue({ group: 'custpage_table', name: 'apply', line: i });
          if (apply === 'T') {

            var internalId = context.request.getSublistValue({ group: 'custpage_table', name: 'id', line: i });
            var item = context.request.getSublistValue({ group: 'custpage_table', name: 'item', line: i });
            var binNumber = context.request.getSublistValue({ group: 'custpage_table', name: 'bin_number', line: i });
            var quantity = context.request.getSublistValue({ group: 'custpage_table', name: 'quantity', line: i });


            var cust = context.request.getSublistValue({ group: 'custpage_table', name: 'name', line: i });
            var salesOrder = context.request.getSublistValue({ group: 'custpage_table', name: 'trainid', line: i });
            var purchaseOrder = context.request.getSublistValue({ group: 'custpage_table', name: 'pocheck', line: i });


            let salesOrderRec = record.load({
              type: 'salesorder',
              id: parseInt(internalId),
              isDynamic: true,
            })

            var binLocation = salesOrderRec.getValue({ fieldId: 'location' })
            log.debug('binLocation  :', binLocation)


          }
        }


      }
    }

    return {
      onRequest: onRequest,
    }

   
    function setDateToSublist(addResults, sublist) {

      var j = 0
      // if(j == 0){
      //   log.debug('results : ' ,addResults)
      // }
      addResults.forEach(function (result) {

        sublist.setSublistValue({
          id: 'id',
          line: j,
          value: result.internalId,
        })


        if (result.tranid !== "") {
          sublist.setSublistValue({
            id: 'trainid',
            line: j,
            value: result.tranid,
          })
        } else {
          sublist.setSublistValue({
            id: 'trainid',
            line: j,
            value: ' ',
          })
        }

        if (result.pocheckNumber !== "") {
          sublist.setSublistValue({
            id: 'pocheck',
            line: j,
            value: result.pocheckNumber,
          })
        } else {
          sublist.setSublistValue({
            id: 'pocheck',
            line: j,
            value: ' ',
          })
        }

        j++
      })
    }

    function createSublist(sublist) {
      // Add columns to be shown on Page
      sublist.addField({
        id: 'apply',
        label: 'apply',
        type: serverWidget.FieldType.CHECKBOX,
      })

      sublist.addField({
        id: 'id',
        label: 'INTERNAL ID',
        type: serverWidget.FieldType.TEXT,
      })



      sublist.addField({
        id: 'trainid',
        label: 'DOCUMENT NUMBER',
        type: serverWidget.FieldType.TEXT,
      })

      sublist.addField({
        id: 'pocheck',
        label: 'PO/CHECK NUMBER',
        type: serverWidget.FieldType.TEXT,
      })




    }

    function runSearch(searchId, searchPageSize, fieldChangeData) {
      var searchObj = search.load({
        id: searchId,
      })

      if (fieldChangeData.size == 0) {
        var myPagedResults = searchObj.runPaged({
          pageSize: searchPageSize,
        })

        //log.debug(`Result Count ${myPagedResults.count} `)
        return myPagedResults
      }
      else {
        var fieldIsd = new Map([
          ['nameID', ["customer", "entityid", "ANYOF"]],
          ['poCheckNumber', ["otherrefnum", "EQUALTO"]],

        ])
        // Copy the filters from rs into defaultFilters.
        var defaultFilters = searchObj.filters;

        fieldChangeData.forEach(function (DataValue, dataKey) {
          //fieldIsd.forEach(function (idValue, idKkey) {
          if (dataKey == 'poCheckNumber') {
            //Applying Filters
            defaultFilters.push(search.createFilter({
              name: "otherrefnum",
              operator: "EQUALTO",
              values: DataValue[1]
            }));
            DataValue[0].defaultValue = DataValue[1]
          }
          else if (dataKey == 'nameID') {
            log.debug('data value : ' + DataValue[1])
            //Applying Filters
            defaultFilters.push(search.createFilter({
              name: "entityid",
              join: "customer",
              operator: "CONTAINS",
              values: DataValue[1]
            }));
            DataValue[0].defaultValue = DataValue[1]
          }
          //})
        })
        // Copy the modified defaultFilters back into rs
        searchObj.filters = defaultFilters;
        //log.debug('searchObj', JSON.stringify(searchObj))
        return searchObj.runPaged({
          pageSize: searchPageSize,
        })
      }

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


        var tranid = result.getValue({
          name: 'tranid',
        })

        var pocheckNumber = result.getValue({
          name: 'otherrefnum',

        })


        results.push({
          'internalId': internalId,
          'tranid': tranid,
          'pocheckNumber': pocheckNumber,



        })
      })
      return results
    }


  })
