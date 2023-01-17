/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

var PAGE_SIZE = 50
var SEARCH_ID = 'customsearch11738'

define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/record','N/url'],
  function (serverWidget, search, redirect, record,url) {
    function onRequest(context) {
      if (context.request.method === 'GET') {

        var form = serverWidget.createForm({
          title: 'Bulk Invoice Approval',
          hideNavBar: false,
        })

        form.clientScriptModulePath = 'Bulk Bill Approval/cs_bulk_bill_approval_page_controls.js'

        var fieldChangeData = new Map()
        // Get parameters
        var scriptId = context.request.parameters.script
        var deploymentId = context.request.parameters.deploy
        var pageId = parseInt(context.request.parameters.page)
        var nameid = context.request.parameters.nameId
        var From = context.request.parameters.from
        var To = context.request.parameters.to


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

        var fromDate = form.addField({
          id: 'custpage_fromdate',
          label: 'From',
          type: serverWidget.FieldType.DATE,

        })
        var toDate = form.addField({
          id: 'custpage_todate',
          label: 'To',
          type: serverWidget.FieldType.DATE,

        })
        nameID.updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.MIDROW
        });
        fromDate.updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.MIDROW
        });
        toDate.updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.MIDROW
        });

        form.addSubmitButton({
          id: 'custpage_print',
          label: 'Approve',
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

        if (String(From) != 'undefined') {
          if (String(From) != 'NaN/NaN/NaN') {
            fieldChangeData.set('fromDate', [fromDate, String(From)])
          }
        }
        if (String(To) != 'undefined') {
          if (String(To) != 'NaN/NaN/NaN') {
            fieldChangeData.set('toDate', [toDate, String(To)])
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

            var otherId = record.submitFields({
              type: 'vendorbill',
              id: parseInt(internalId),
              values: {
                'custbody_bill_approved': true
              }
            });
            log.debug('vendorBill  :', otherId)
          }
        }

        var suiteletURL = url.resolveScript({
          scriptId: 'customscript_bulk_bill_approval_search_r',
          deploymentId: 'customdeploy_sl_bulk_bill_approval_dep',
          // params: params
        });
        redirect.redirect({ url: suiteletURL });
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


        if (result.transactionnumber !== "") {
          sublist.setSublistValue({
            id: 'transactionnumber',
            line: j,
            value: result.transactionnumber,
          })
        } else {
          sublist.setSublistValue({
            id: 'transactionnumber',
            line: j,
            value: ' ',
          })
        }

        if (result.entity !== "") {
          sublist.setSublistValue({
            id: 'entity',
            line: j,
            value: result.entity,
          })
        } else {
          sublist.setSublistValue({
            id: 'entity',
            line: j,
            value: ' ',
          })
        }
        if (result.amount !== "") {
          sublist.setSublistValue({
            id: 'amount',
            line: j,
            value: result.amount,
          })
        } else {
          sublist.setSublistValue({
            id: 'amount',
            line: j,
            value: ' ',
          })
        }
        if (result.statusref !== "") {
          sublist.setSublistValue({
            id: 'statusref',
            line: j,
            value: result.statusref,
          })
        } else {
          sublist.setSublistValue({
            id: 'statusref',
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
        id: 'transactionnumber',
        label: 'TRANSACTION NUMBER',
        type: serverWidget.FieldType.TEXT,
      })

      sublist.addField({
        id: 'entity',
        label: 'VENDOR NUMBER',
        type: serverWidget.FieldType.TEXT,
      })
      sublist.addField({
        id: 'amount',
        label: 'AMOUNT',
        type: serverWidget.FieldType.TEXT,
      })
      sublist.addField({
        id: 'statusref',
        label: 'Status',
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
          ['nameID', ["entity", "ANYOF"]],
          ['fromDate', ["trandate", "ONORAFTER"]],
          ['toDate', ["trandate", "ONORBEFORE"]]

        ])
        // Copy the filters from rs into defaultFilters.
        var defaultFilters = searchObj.filters;


        fieldChangeData.forEach(function (DataValue, dataKey) {
          log.debug('dataKey : ', dataKey)
          log.debug('DataValue : ', DataValue)
          // fieldIsd.forEach(function (idValue, idKkey) {

          if (dataKey == 'nameID') {
            log.debug('Match found nameID')
            //Applying Filters
            defaultFilters.push(search.createFilter({
              name: 'formulatext',
              operator: 'CONTAINS',
              values: DataValue[1],
              formula : '{entity}'
            }));
            DataValue[0].defaultValue = DataValue[1]
          }
          else if (dataKey == 'fromDate') {
            log.debug('Match found fromDate')
            //Applying Filters
            defaultFilters.push(search.createFilter({
              name: 'trandate',
              operator: 'ONORAFTER',
              values: DataValue[1]
            }));
            DataValue[0].defaultValue = DataValue[1]
          }
          else if (dataKey == 'toDate') {
            log.debug('Match found toDate')
            //Applying Filters
            defaultFilters.push(search.createFilter({
              name: 'trandate',
              operator: 'ONORBEFORE',
              values: DataValue[1]
            }));
            DataValue[0].defaultValue = DataValue[1]
          }


          // })
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


        var transactionnumber = result.getValue({
          name: 'transactionnumber',
        })

        var entity = result.getValue({
          name: 'formulatext', formula: '{vendor.companyname}'

        })

        var amount = result.getValue({
          name: 'amount',
        })
        var statusref = result.getValue({
          name: 'statusref',
        })

        results.push({
          'internalId': internalId,
          'transactionnumber': transactionnumber,
          'entity': entity,
          'amount': amount,
          'statusref': statusref,



        })
      })
      return results
    }


  })
