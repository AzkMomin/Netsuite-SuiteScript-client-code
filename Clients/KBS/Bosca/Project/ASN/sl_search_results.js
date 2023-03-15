/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

var PAGE_SIZE = 50
var SEARCH_ID = 'customsearch_anc_asn_suitelet'

var CLIENT_SCRIPT_FILE_ID = 870

define(['N/ui/serverWidget', 'N/search', 'N/redirect', 'N/url', 'N/format', 'N/https'],
  function (serverWidget, search, redirect, url, format, https) {
    function onRequest(context) {
      if (context.request.method === 'GET') {

        var form = serverWidget.createForm({
          title: 'Bulk Create ASN',
          hideNavBar: false,
        })

        form.clientScriptModulePath = 'Bulk Picking List/cs_page_controls.js'

        var fieldChangeData = new Map()
        // Get parameters
        var scriptId = context.request.parameters.script
        var deploymentId = context.request.parameters.deploy
        var pageId = parseInt(context.request.parameters.page)
        var companyname = context.request.parameters.companyname
        var pocheckNumber = context.request.parameters.pochecknumber
        var shipaddress = context.request.parameters.shipaddress
        var actualshipdate = context.request.parameters.actualshipdate
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

        var companyName = form.addField({
          id: 'custpage_companyname',
          label: 'Company Name',
          type: serverWidget.FieldType.TEXT,
        })

        var poCheckNumber = form.addField({
          id: 'custpage_pochecknumber',
          label: 'PO Check Number',
          type: serverWidget.FieldType.TEXT,

        })
        poCheckNumber.updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
        });

        var ShippingAddress = form.addField({
          id: 'custpage_shippingaddress',
          label: 'Shipping Address',
          type: serverWidget.FieldType.TEXT,
        })


        var actualShipDate = form.addField({
          id: 'custpage_actualshipdate',
          label: 'Actual Ship Date',
          type: serverWidget.FieldType.DATE,

        })
        actualShipDate.updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.MIDROW
        });
        var from = form.addField({
          id: 'custpage_from',
          label: 'From',
          type: serverWidget.FieldType.DATE,

        })
        from.updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.MIDROW
        });


        var to = form.addField({
          id: 'custpage_to',
          label: 'To',
          type: serverWidget.FieldType.DATE,

        })
        to.updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.ENDROW
        });

        form.addSubmitButton({
          id: 'custpage_createconsolatedans',
          label: 'Create ASN',
          //functionName: 'createConsolatedANS("' + context + '")',
        })

        // Add sublist that will show results
        var sublist = form.addSublist({
          id: 'custpage_table',
          type: serverWidget.SublistType.LIST,
          label: 'Search Name',
        })


        if (String(companyname) != 'undefined') {
          if (String(companyname) != '') {
            fieldChangeData.set('companyName', [companyName, String(companyname)])
          }
        }
        if (String(pocheckNumber) != 'undefined') {
          if (String(pocheckNumber) != '') {
            fieldChangeData.set('poCheckNumber', [poCheckNumber, String(pocheckNumber)])
          }
        }
        if (String(shipaddress) != 'undefined') {
          if (String(shipaddress) != '') {
            fieldChangeData.set('ShippingAddress', [ShippingAddress, String(shipaddress)])
          }
        }
        if (String(actualshipdate) != 'undefined') {
          if (String(actualshipdate) != 'NaN/NaN/NaN') {
            fieldChangeData.set('actualShipDate', [actualShipDate, String(actualshipdate)])
          }
        }
        if (String(From) != 'undefined') {
          if (String(From) != 'NaN/NaN/NaN') {
            fieldChangeData.set('from', [from, String(From)])
          }
        }
        if (String(To) != 'undefined') {
          if (String(To) != 'NaN/NaN/NaN') {
            fieldChangeData.set('to', [to, String(To)])
          }
        }
        //log.debug('fieldChangeData : ', fieldChangeData.size)



        // Run search and determine page count
        var retrieveSearch = runSearch(SEARCH_ID, PAGE_SIZE, fieldChangeData, companyName, poCheckNumber, ShippingAddress, actualShipDate, from, to)
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

        log.debug('Received Data sublist linecount :: ', context.request.getLineCount({ group: 'custpage_table' }))
        var lineCount = context.request.getLineCount({ group: 'custpage_table' })

        for (var i = 0; i < lineCount; i++) {
          var apply = context.request.getSublistValue({ group: 'custpage_table', name: 'apply', line: i });
          // log.debug("Apply  : " ,typeof apply)
          if (apply == 'T') {
            var internalId = context.request.getSublistValue({ group: 'custpage_table', name: 'internalid', line: i });
            log.debug("Internal Id : ", internalId)

            try {
              var suiteletURL = url.resolveScript({
                scriptId: 'customscript_sps_sl_svc_create_asn',
                deploymentId: 'customdeploy_sps_sl_svc_create_asn',
                params: {
                  'params1': '1084267',
                  'id': '1084267',
                  'internalId': parseInt(internalId),
                  'packageSource': "3",
                },
                returnExternalUrl: true
              });
             
              redirect.redirect({ url: suiteletURL });

             
            }
            catch (e) {
              log.error(e.toString());
            }

          }
        }
      }
    }

    return {
      onRequest: onRequest,
    }

    function setDateToSublist(addResults, sublist) {
      var j = 0
      addResults.forEach(function (result) {
        //log.debug('results : ', result)
        sublist.setSublistValue({
          id: 'internalid',
          line: j,
          value: result.internalId,
        })


        if (result.shipdate !== "") {
          sublist.setSublistValue({
            id: 'shipdate',
            line: j,
            value: result.shipdate,
          })
        }
        else {
          sublist.setSublistValue({
            id: 'shipdate',
            line: j,
            value: ' ',
          })
        }

        if (result.cancelDate !== "") {
          sublist.setSublistValue({
            id: 'cancelDate',
            line: j,
            value: result.cancelDate,
          })
        } else {
          sublist.setSublistValue({
            id: 'cancelDate',
            line: j,
            value: ' ',
          })
        }
        if (result.print !== "") {
          sublist.setSublistValue({
            id: 'print',
            line: j,
            value: result.print,
          })
        } else {
          sublist.setSublistValue({
            id: 'print',
            line: j,
            value: ' ',
          })
        }
        if (result.type !== "") {
          sublist.setSublistValue({
            id: 'type',
            line: j,
            value: result.type,
          })
        } else {
          sublist.setSublistValue({
            id: 'type',
            line: j,
            value: ' ',
          })
        }


        if (result.tranid !== "") {
          sublist.setSublistValue({
            id: 'tranid',
            line: j,
            value: result.tranid,
          })
        } else {
          sublist.setSublistValue({
            id: 'tranid',
            line: j,
            value: ' ',
          })
        }

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

        if (result.otherrefnum !== "") {
          sublist.setSublistValue({
            id: 'otherrefnum',
            line: j,
            value: result.otherrefnum,
          })
        } else {
          sublist.setSublistValue({
            id: 'otherrefnum',
            line: j,
            value: ' ',
          })
        }
        if (result.shipaddressee !== "") {
          sublist.setSublistValue({
            id: 'shipaddressee',
            line: j,
            value: result.shipaddressee,
          })
        } else {
          sublist.setSublistValue({
            id: 'shipaddressee',
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



        if (result.trackingnumbers !== "") {
          sublist.setSublistValue({
            id: 'trackingnumbers',
            line: j,
            value: result.trackingnumbers,
          })
        } else {
          sublist.setSublistValue({
            id: 'trackingnumbers',
            line: j,
            value: ' ',
          })
        }

        if (result.memo !== "") {
          sublist.setSublistValue({
            id: 'memo',
            line: j,
            value: result.memo,
          })
        } else {
          sublist.setSublistValue({
            id: 'memo',
            line: j,
            value: ' ',
          })
        }

        if (result.currency !== "") {
          sublist.setSublistValue({
            id: 'currency',
            line: j,
            value: result.currency,
          })
        } else {
          sublist.setSublistValue({
            id: 'currency',
            line: j,
            value: ' ',
          })
        }




        if (result.docunit !== "") {
          sublist.setSublistValue({
            id: 'docunit',
            line: j,
            value: result.docunit,
          })
        } else {
          sublist.setSublistValue({
            id: 'docunit',
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
        id: 'internalid',
        label: 'INTERNAL ID',
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
        id: 'tranid',
        label: 'DOCUMENT NUMBER',
        type: serverWidget.FieldType.TEXT,
      })

      sublist.addField({
        id: 'transactionnumber',
        label: 'TRANSACTION NUMBER',
        type: serverWidget.FieldType.TEXT,
      })

      sublist.addField({
        id: 'entity',
        label: 'NAME',
        type: serverWidget.FieldType.TEXT,
      })


      sublist.addField({
        id: 'otherrefnum',
        label: 'PO/CHECK NUMBER',
        type: serverWidget.FieldType.TEXT,
      })

      sublist.addField({
        id: 'shipaddressee',
        label: 'SHIPPING ADDRESS',
        type: serverWidget.FieldType.TEXT,
      })

      sublist.addField({
        id: 'statusref',
        label: 'STATUS',
        type: serverWidget.FieldType.TEXT,
      })

      sublist.addField({
        id: 'trackingnumbers',
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
        id: 'docunit',
        label: 'TRANSACTION UNIT',
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

        log.debug(`Result Count ${myPagedResults.count} `)
        return myPagedResults
      }
      else {
        var fieldIsd = new Map([
          ['companyName', ["entity", "CONTAINS"]],
          ['poCheckNumber', ["otherrefnum", "EQUALTO"]],
          ['ShippingAddress', ["shipaddress", "CONTAINS"]],
          ['actualShipDate', ["shipdate", "ON"]],
          ['from', ["shipdate", "ONORAFTER"]],
          ['to', ["shipdate", "ONORBEFORE"]]
        ])
        // Copy the filters from rs into defaultFilters.
        var defaultFilters = searchObj.filters;

       
        fieldChangeData.forEach(function (DataValue, dataKey) {
          if (dataKey == "poCheckNumber") {
            defaultFilters.push(search.createFilter({
              name: "formulatext",
              operator: "CONTAINS",
              values: DataValue[1],
              formula : '{createdfrom.otherrefnum}'
            }));
            DataValue[0].defaultValue = DataValue[1]
            
          }else if(dataKey == "companyName"){
            defaultFilters.push(search.createFilter({
              name: "formulatext",
              operator: "CONTAINS",
              values: DataValue[1],
              formula : '{name}'
            }));
            DataValue[0].defaultValue = DataValue[1]
          }else{
            fieldIsd.forEach(function (idValue, idKkey) {
              if (dataKey == idKkey) {
                //Applying Filters
                defaultFilters.push(search.createFilter({
                  name: "shipdate",
                  join: 'createdfrom',
                  operator: idValue[1],
                  values: DataValue[1],
                }));
                DataValue[0].defaultValue = DataValue[1]

              }
            })
          }
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

        var shipdate = result.getValue({
          name: 'shipdate', join: 'createdFrom'
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

        var entity = result.getText({
          name: 'entity',
        })


        var otherrefnum = result.getValue({
          name: 'otherrefnum', join: 'createdFrom'
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
        var currency = result.getText({
          name: 'currency',
        })

        var docunit = result.getValue({
          name: 'docunit',
        })


        results.push({
          'internalId': internalId,
          'shipdate': shipdate,
          'cancelDate': cancelDate,
          'print': print,
          'type': type,
          'tranid': tranid,
          'transactionnumber': transactionnumber,
          'entity': entity,
          'otherrefnum': otherrefnum,
          'shipaddressee': shipaddressee,
          'statusref': statusref,
          'trackingnumbers': trackingnumbers,
          'memo': memo,
          'currency': currency,
          'docunit': docunit,

        })
      })
      return results
    }


  })
