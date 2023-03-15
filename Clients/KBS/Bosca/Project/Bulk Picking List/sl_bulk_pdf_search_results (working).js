/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */

var PAGE_SIZE = 50
var SEARCH_ID = 'customsearch1299'

define(['N/ui/serverWidget', 'N/search', 'N/render', 'N/record'],
  function (serverWidget, search, render, record) {
    function onRequest(context) {
      if (context.request.method === 'GET') {

        var form = serverWidget.createForm({
          title: 'Bulk Item Pick List',
          hideNavBar: false,
        })

        form.clientScriptModulePath = 'Bulk Picking List/cs_bulk_pdf_page_controls.js'

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

        })

        // Add sublist that will show results
        var sublist = form.addSublist({
          id: 'custpage_table',
          type: serverWidget.SublistType.LIST,
          label: 'Search Name',
        })
        sublist.addMarkAllButtons();

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

        var rowsForBins;
        var rowsForItems;
        var grandTotal = 0;
        var orderCount = 0;
        //Map for bins and items table
        var data = new Map();
        //Map for customer ,SO and PO table
        var customer = new Map();

        var SO_Array = [];
        var PO_Array = [];
        var items = [];
        var soIDsItemToBeChecked = []
        var lineCount = context.request.getLineCount({ group: 'custpage_table' });

        for (var i = 0; i < lineCount; i++) {

          var apply = context.request.getSublistValue({ group: 'custpage_table', name: 'apply', line: i });
          if (apply === 'T') {

            var internalId = context.request.getSublistValue({ group: 'custpage_table', name: 'id', line: i });
            var item = context.request.getSublistValue({ group: 'custpage_table', name: 'item', line: i });
            var binNumber = context.request.getSublistValue({ group: 'custpage_table', name: 'bin_number', line: i });
            var quantity = context.request.getSublistValue({ group: 'custpage_table', name: 'quantity', line: i });
            var lineUniqueKey = context.request.getSublistValue({ group: 'custpage_table', name: 'lineuniquekey', line: i });


            soIDsItemToBeChecked.push({
              'internalId': internalId,
              'lineUniqueKey': lineUniqueKey
            })
            var cust = context.request.getSublistValue({ group: 'custpage_table', name: 'name', line: i });
            var salesOrder = context.request.getSublistValue({ group: 'custpage_table', name: 'trainid', line: i });
            var purchaseOrder = context.request.getSublistValue({ group: 'custpage_table', name: 'pocheck', line: i });


            let salesOrderRec = record.load({
              type: 'salesorder',
              id: parseInt(internalId),
              isDynamic: false,
            })

            var binLocation = salesOrderRec.getValue({ fieldId: 'location' });


            // try {
            //For bins and items
            if (data.size == 0) { data.set(i, [item, parseInt(quantity), binLocation]); }
            else {
              var isTrue = false;
              data.forEach(function (value, key) {
                if (value[0] == item && binLocation == value[2]) {
                  data.set(parseInt(key), [item, parseInt(value[1]) + parseInt(quantity), binLocation]); isTrue = true;
                }

              })
              if (isTrue == false) {
                data.set(i, [item, parseInt(quantity), binLocation]);
              }
            }

            //For customers, sales order and purchase order

            if (customer.size == 0) {
              customer.set(cust, [1, 1]);
              SO_Array.push(salesOrder);
              PO_Array.push(purchaseOrder);
            }
            else {
              var isTrue = false;
              customer.forEach(function (value, key) {

                if (key == cust) {
                  if (SO_Array.includes(salesOrder) == false) { // SO not found
                    if (PO_Array.includes(purchaseOrder) == false) { // PO not found
                      customer.set(cust, [parseInt(value[0]) + 1, parseInt(value[1]) + 1]);
                      isTrue = true;
                      SO_Array.push(salesOrder);
                      PO_Array.push(purchaseOrder);
                    }
                    else {// PO found
                      customer.set(cust, [parseInt(value[0]) + 1, parseInt(value[1])]);
                      isTrue = true;
                      SO_Array.push(salesOrder);
                    }
                  }
                  else {// SO found
                    if (PO_Array.includes(purchaseOrder) == false) { // PO not found

                      customer.set(cust, [parseInt(value[0]), parseInt(value[1]) + 1]);
                      isTrue = true;
                      PO_Array.push(purchaseOrder);
                    }
                    else { // PO found
                      customer.set(cust, [parseInt(value[0]), parseInt(value[1])]);
                      isTrue = true;
                    }

                  }
                }

              })
              if (isTrue == false) {
                customer.set(cust, [1, 1]);
                SO_Array.push(salesOrder);
                PO_Array.push(purchaseOrder);

              }
            }


          }
        }
        log.debug('soIDsItemToBeChecked  :', soIDsItemToBeChecked);
        // try {
        //   soIDsItemToBeChecked.forEach((result) => {
        //     let salesOrderRec = record.load({
        //       type: 'salesorder',
        //       id: parseInt(result.internalId),
        //       isDynamic: false,
        //     });

        //     var soLineItemCount = salesOrderRec.getLineCount({ sublistId: 'item' })
        //     for (var i = 0; i < soLineItemCount; i++) {
        //       var lineKey = salesOrderRec.getSublistValue({
        //         sublistId: 'item',
        //         fieldId: 'lineuniquekey',
        //         line: i
        //       })

        //       if (parseInt(lineKey) == parseInt(result.lineUniqueKey)) {

        //         log.debug('lineKey  :', lineKey)
        //         salesOrderRec.setSublistValue({
        //           sublistId: 'item',
        //           fieldId: 'custcol_pick_list_printed',
        //           line: i,
        //           value: true
        //         })
        //       }
        //     }

        //     var soRec = salesOrderRec.save();
        //     log.debug('so : ', soRec)
        //   })
        // } catch (e) {
        //   log.debug("Error : ", e)
        // }




        data.forEach(function (value, key) {
          log.debug(`item : ${value[0]} ,  quantity : ${value[1]} , binlocation : ${value[2]}`)
          let bins = getBins(value[2], value[0], value[1]);
          log.debug('rows : ', bins)
          grandTotal += parseInt(value[1])
          rowsForBins += bins
        })

        customer.forEach(function (value, key) {
          //log.debug(`key : ${key} , bin : ${value[0]} , quantity : ${value[1]}`)
          orderCount += parseInt(value[0])
          rowsForItems += "<tr>\n" +
            "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px;padding: 10px;\">\n " + key + "\n</span>\n</th>" +
            "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + value[0] + " \n</span>\n</th>" +
            "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + value[1] + " \n</span>\n</th>" +
            "</tr>\n"
        })
        // log.debug('data size: ', data.size)
        // log.debug('customer size: ', customer.size)
        // log.debug('grandTotal ', grandTotal)
        // log.debug('orderCount ', orderCount)
        let dateTime = getCurrentDateTime();

        var xmlStr = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
          "<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n" +
          "<pdf>\n<body font-size=\"18\">\n" +
          "<div style=\"text-align: center;\"><span style=\"font-size:18px;font-weight: bold;\">Order Printed After " + dateTime[0] + "   " + dateTime[1] + "</span></div>" +
          "<table  cellpadding=\"1\" cellspacing=\"1\" style=\"width:70%; margin: 10px ;\">\n" +
          "<thead>\n" +
          "<tr>\n" +
          "<th colspan=\"2\" align=\"left\" style=\"width: 30px; ;  background-color: #e3e3e3; \">\n<span style=\"font-size:12px; padding: 15px\">\n<strong>\n Bin NO \n</strong>\n</span>\n</th>" +
          "<th colspan=\"2\" align=\"left\" style=\"width: 30px; ; background-color: #e3e3e3;  \">\n<span style=\"font-size:12px; padding: 15px\">\n<strong>\n Part No   \n</strong>\n</span>\n</th>" +
          "<th colspan=\"2\" align=\"left\" style=\"width: 30px; ;  background-color: #e3e3e3; \">\n<span style=\"font-size:12px; padding: 15px\">\n<strong>\n Total To Pick \n</strong>\n</span>\n</th>" +
          "</tr>\n" +
          // "<hr style=\"width: 100%; color: #d3d3d3; background-color: #d3d3d3; height: 1px;\" />"
          "</thead>\n" +
          rowsForBins +
          "</table>\n" +

          "<div><span style=\"font-size:18px;font-weight: bold;\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Grand Total&nbsp; &nbsp; &nbsp; &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;" + grandTotal + "&nbsp; &nbsp; &nbsp; &nbsp;# Of Orders&nbsp; &nbsp; &nbsp; " + orderCount + "&nbsp;</span></div>" +

          "<table  cellpadding=\"1\" cellspacing=\"1\" style=\"width:100%; margin: 10px ;\">\n" +
          "<thead>\n" +
          "<tr>\n" +
          "<th colspan=\"2\" align=\"left\" style=\"width: 30px; ;  background-color: #e3e3e3; \">\n<span style=\"font-size:12px; padding: 15px\">\n<strong>\n DC # \n</strong>\n</span>\n</th>" +
          "<th colspan=\"2\" align=\"left\" style=\"width: 30px; ; background-color: #e3e3e3;  \">\n<span style=\"font-size:12px; padding: 15px\">\n<strong>\n # Of Orders \n</strong>\n</span>\n</th>" +
          "<th colspan=\"2\" align=\"left\" style=\"width: 30px; ;  background-color: #e3e3e3; \">\n<span style=\"font-size:12px; padding: 15px\">\n<strong>\n # Of POs \n</strong>\n</span>\n</th>" +
          "</tr>\n" +
          // "<hr style=\"width: 100%; color: #d3d3d3; background-color: #d3d3d3; height: 1px;\" />"
          "</thead>\n" +
          rowsForItems +
          "</table>\n" +
          "</body>\n</pdf>";

        var pdfFile = render.xmlToPdf({
          xmlString: xmlStr
        });

        context.response.writeFile(pdfFile, true);
      }
    }

    return {
      onRequest: onRequest,
    }



    function getBins(binLocation, item, quantity) {
      log.debug('quantity : ' + quantity)
      log.debug('binLocation : ' + binLocation)
      var binsItems = new Map();

      var rowsForBins;

      var inventorydetailSearchColBinNumber = search.createColumn({ name: 'binnumber', summary: search.Summary.GROUP });
      var inventorydetailSearchColItemCount = search.createColumn({ name: 'itemcount', summary: search.Summary.SUM, sort: search.Sort.DESC });
      var inventorydetailSearchColLocation = search.createColumn({ name: 'location', summary: search.Summary.GROUP });
      var inventorydetailSearch = search.create({
        type: 'inventorydetail',
        filters: [
          ['formulatext: {item}', 'is', item],
        ],
        columns: [
          inventorydetailSearchColBinNumber,
          inventorydetailSearchColItemCount,
          inventorydetailSearchColLocation,
        ],
      });

      var sameBinLocationFound = new Map();
      var negItemCount = new Map();
      var inventorydetailSearchPagedData = inventorydetailSearch.runPaged({ pageSize: 1000 });
      for (var i = 0; i < inventorydetailSearchPagedData.pageRanges.length; i++) {
        var inventorydetailSearchPage = inventorydetailSearchPagedData.fetch({ index: i });
        log.debug('data length : ' + inventorydetailSearchPage.data.length)
        if (inventorydetailSearchPage.data.length != 0) {
          var j = 1
          inventorydetailSearchPage.data.forEach(function (result) {

            var binNumber = result.getText(inventorydetailSearchColBinNumber);
            var itemCount = result.getValue(inventorydetailSearchColItemCount);
            var locationName = result.getText(inventorydetailSearchColLocation);
            var locationId = result.getValue(inventorydetailSearchColLocation);

            binsItems.set(j, [binNumber, itemCount, locationName])

            if (binLocation == locationId) {
              log.debug('same location found at searchlocation  :')
              sameBinLocationFound.set(j, [binNumber, itemCount, locationName])
            }
            else {
              binsItems.set(j, [binNumber, itemCount, locationName])
            }

            j++;
            // log.debug('location name :', locationName)
            // log.debug('binNumber :', binNumber)

          });
        }
        else {
          log.debug('Bin not found')
          binsItems.set(0, [0, 0])
        }
      }

      // Looping to check item at same location present in sales order
      var qtySatisfyFromSameBin = false;
      if (sameBinLocationFound.size != 0) {
        log.debug('Same location found')
        var qtyRemains = quantity;
        sameBinLocationFound.forEach(function (value, key) {
          log.debug(`binNumber : ${value[0]} ,  item count : ${value[1]} , location : ${value[2]}`)
          if (parseInt(value[1]) >= parseInt(qtyRemains) && qtyRemains > 0) {
            log.debug('quantity is grater at same location')
            rowsForBins += "<tr>\n" +
              "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px;padding: 10px;\">\n " + value[0] + "\n</span>\n</th>" +
              "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + item + " \n</span>\n</th>" +
              "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + quantity + " \n</span>\n</th>" +
              "</tr>\n"
            qtyRemains -= value[1]
            qtySatisfyFromSameBin = true
          }
          else if (value[1] > 0) {
            log.debug('quantity is grater at same location else part')
            if (qtyRemains < parseInt(value[1]) && qtyRemains > 0) {
              rowsForBins += "<tr>\n" +
                "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px;padding: 10px;\">\n " + value[0] + "\n</span>\n</th>" +
                "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + item + " \n</span>\n</th>" +
                "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + value[1] + " \n</span>\n</th>" +
                "</tr>\n"
              qtyRemains -= value[1];
            }
          }
        });

        if (qtyRemains > 0) {
          log.debug('quantity remains ')
          qtySatisfyFromSameBin = false;
          quantity = qtyRemains
        } else {
          log.debug('quantity remains else part')
          qtySatisfyFromSameBin = true;
        }
      }
      log.debug("binsItems.size :" + binsItems.size)
      if (qtySatisfyFromSameBin == false) {
        // var findOnMultipleBin = true
        // if (binsItems.size != 0) {

        //   binsItems.forEach(function (value, key) {
        //     //log.debug(`binNumber : ${key} ,  item count : ${value[0]} , location : ${value[1]}`)

        //     if (parseInt(value[1]) >= parseInt(quantity) && findOnMultipleBin == true) {
        //       log.debug('quantity is grater')
        //       rowsForBins += "<tr>\n" +
        //         "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px;padding: 10px;\">\n " + value[0] + "\n</span>\n</th>" +
        //         "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + item + " \n</span>\n</th>" +
        //         "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + quantity + " \n</span>\n</th>" +
        //         "</tr>\n"
        //       findOnMultipleBin = false
        //     }

        //   })
        // }
        // else {
        rowsForBins += "<tr>\n" +
          "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px;padding: 10px;\">\n " + "Null" + "\n</span>\n</th>" +
          "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + item + " \n</span>\n</th>" +
          "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + quantity + " \n</span>\n</th>" +
          "</tr>\n"
        // findOnMultipleBin = false
        // }

        // if (findOnMultipleBin == true) {
        //   var quantityRemain = quantity

        //   binsItems.forEach(function (value, key) {
        //     log.debug(`binNumber : ${value[0]} , item Cout : ${value[1]} , location : ${value[2]}`)

        //     if (quantityRemain >= 0 && value[1] > 0) {
        //       if (quantityRemain > value[1]) {

        //         rowsForBins += "<tr>\n" +
        //           "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px;padding: 10px;\">\n " + value[0] + "\n</span>\n</th>" +
        //           "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + item + " \n</span>\n</th>" +
        //           "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + value[1] + " \n</span>\n</th>" +
        //           "</tr>\n"

        //         quantityRemain -= value[1]
        //         log.debug('remaining Quantiy : ' + quantityRemain)
        //       } else if (quantityRemain == value[1]) {
        //         rowsForBins += "<tr>\n" +
        //           "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px;padding: 10px;\">\n " + value[0] + "\n</span>\n</th>" +
        //           "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + item + " \n</span>\n</th>" +
        //           "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + value[1] + " \n</span>\n</th>" +
        //           "</tr>\n"

        //         quantityRemain -= value[1]
        //         log.debug('remaining Quantiy : ' + quantityRemain)
        //       } else if (quantityRemain < value[1] && quantityRemain > 0) {
        //         rowsForBins += "<tr>\n" +
        //           "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px;padding: 10px;\">\n " + value[0] + "\n</span>\n</th>" +
        //           "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + item + " \n</span>\n</th>" +
        //           "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + quantityRemain + " \n</span>\n</th>" +
        //           "</tr>\n"

        //         quantityRemain -= value[1]
        //         log.debug('remaining Quantiy : ' + quantityRemain)
        //       }
        //     }

        //     if (quantityRemain != 0) {
        //       rowsForBins += "<tr>\n" +
        //         "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px;padding: 10px;\">\n " + "Null" + "\n</span>\n</th>" +
        //         "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + item + " \n</span>\n</th>" +
        //         "<th colspan=\"2\" align=\"left\" style=\"width: 30px; \">\n<span style=\"font-size:15px; padding: 10px;\">\n " + quantityRemain + " \n</span>\n</th>" +
        //         "</tr>\n"

        //       log.debug('remaining Quantiy : ' + quantityRemain)
        //     }


        //   })
        // }
      }
      return rowsForBins;
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


        if (result.date !== "") {
          sublist.setSublistValue({
            id: 'date',
            line: j,
            value: result.date,
          })
        }
        else {
          sublist.setSublistValue({
            id: 'date',
            line: j,
            value: ' ',
          })
        }


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

        if (result.entityid !== "") {
          sublist.setSublistValue({
            id: 'entityid',
            line: j,
            value: result.entityid,
          })
        } else {
          sublist.setSublistValue({
            id: 'entityid',
            line: j,
            value: ' ',
          })
        }

        if (result.name !== "") {
          sublist.setSublistValue({
            id: 'name',
            line: j,
            value: result.name,
          })
        } else {
          sublist.setSublistValue({
            id: 'name',
            line: j,
            value: ' ',
          })
        }

        if (result.item !== "") {
          sublist.setSublistValue({
            id: 'item',
            line: j,
            value: result.item,
          })
        } else {
          sublist.setSublistValue({
            id: 'item',
            line: j,
            value: ' ',
          })
        }
        if (result.binNumber !== "") {
          sublist.setSublistValue({
            id: 'bin_number',
            line: j,
            value: result.binNumber,
          })
        } else {
          sublist.setSublistValue({
            id: 'bin_number',
            line: j,
            value: ' ',
          })
        }
        if (result.quantity !== "") {
          sublist.setSublistValue({
            id: 'quantity',
            line: j,
            value: result.quantity,
          })
        } else {
          sublist.setSublistValue({
            id: 'quantity',
            line: j,
            value: ' ',
          })
        }
        if (result.lineuniquekey !== "") {
          sublist.setSublistValue({
            id: 'lineuniquekey',
            line: j,
            value: result.lineuniquekey,
          })
        } else {
          sublist.setSublistValue({
            id: 'lineuniquekey',
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
        id: 'date',
        label: 'DATE',
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

      sublist.addField({
        id: 'entityid',
        label: 'Customer ID',
        type: serverWidget.FieldType.TEXT,
      })

      sublist.addField({
        id: 'name',
        label: 'Customer Name',
        type: serverWidget.FieldType.TEXT,
      })


      sublist.addField({
        id: 'item',
        label: 'ITEM',
        type: serverWidget.FieldType.TEXT,
      })


      sublist.addField({
        id: 'bin_number',
        label: 'BIN NUMBER',
        type: serverWidget.FieldType.TEXT,
      })

      sublist.addField({
        id: 'quantity',
        label: 'QUANTITY',
        type: serverWidget.FieldType.TEXT,
      })
      sublist.addField({
        id: 'lineuniquekey',
        label: 'Line Unique Key',
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

    function getCurrentDateTime() {

      var today = new Date();
      var yyyy = today.getFullYear();
      let mm = today.getMonth() + 1; // Months start at 0!
      let dd = today.getDate();

      if (dd < 10) dd = '0' + dd;
      if (mm < 10) mm = '0' + mm;

      var formattedToday = dd + '/' + mm + '/' + yyyy;
      //var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      var hours = today.getHours();
      var minutes = today.getMinutes();
      var seconds = today.getSeconds();
      var ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? '0' + minutes : minutes;
      var strTime = hours + ':' + minutes + ':' + seconds + ampm;




      return [formattedToday, strTime]

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

        var date = result.getValue({
          name: 'trandate',
        })
        var tranid = result.getValue({
          name: 'tranid',
        })

        var pocheckNumber = result.getValue({
          name: 'otherrefnum',

        })

        var entityid = result.getValue({
          name: 'entityid', join: 'customer'
        })

        var name = result.getValue({
          name: 'altname', join: 'customer',
        })

        var item = result.getText({
          name: 'item',
        })

        var binNumber = result.getValue({
          name: 'binnumber', join: 'item'
        })

        var quantity = result.getValue({
          name: 'quantity',
        })
        var lineuniquekey = result.getValue({
          name: 'lineuniquekey',
        })


        results.push({
          'internalId': internalId,
          'date': date,
          'tranid': tranid,
          'pocheckNumber': pocheckNumber,
          'entityid': entityid,
          'name': name,
          'item': item,
          'binNumber': binNumber,
          'quantity': quantity,
          'lineuniquekey': lineuniquekey

        })
      })
      return results
    }


  })
