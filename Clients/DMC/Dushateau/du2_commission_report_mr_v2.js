/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 */
define(['N/error', 'N/record', 'N/runtime', 'N/search'],

   function (error, record, runtime, search) {

      function getInputData() {
         try {
            var resultObj = runtime.getCurrentScript().getParameter('custscript_result_obj');
            // log.debug('Result Object : ', resultObj);
            var arr = searchTransaction(JSON.parse(resultObj));
            // log.debug('INPUT: ' + arr.length, JSON.stringify(arr));
            return arr;
         }
         catch (e) {
            log.error('INPUT Exception ' + e.message, e);
         }
      }

      function map(context) {
         try {
            // var valuePairs = JSON.parse(context.value);
            // context.write({
            //    key: valuePairs.internalId,
            //    value: {
            //       sequence: valuePairs.sequence,
            //       internalId: valuePairs.internalId,
            //       recordType: valuePairs.recordType,
            //       lineUniqueKey: valuePairs.lineUniqueKey,
            //       lineItem: valuePairs.lineItem,
            //       netAmount: valuePairs.netAmount,
            //       commissionAmount: valuePairs.commissionAmount,
            //       partnerId: valuePairs.partnerId,
            //       payout: valuePairs.payout,
            //       adjustment: valuePairs.adjustment
            //    }
            // });
         }
         catch (e) {
            log.error('MAP Exception ' + e.message, e);
         }
      }

      function reduce(context) {

         var valueArr = context.values.map(function (value) {
            return JSON.parse(value);
         });
         try {

            var sequence = valueArr[0].sequence;
            var internalId = valueArr[0].internalId;
            var recordType = valueArr[0].recordType;
            var lineUniqueKey = valueArr[0].lineUniqueKey;
            var lineItem = valueArr[0].lineItem;
            var commissionAmount = valueArr[0].commissionAmount;
            var partnerId = valueArr[0].partnerId;
            var payout = valueArr[0].payout;
            var adjustment = valueArr[0].adjustment;

            //log.debug('SEQUENCE: ' + sequence, JSON.stringify(valueArr));
            setPayoutGrouped(recordType, internalId, valueArr);
         }
         catch (e) {
            log.error('REDUCE Exception ' + e.message, e);
         }
      }

      function summarize(summary) {
         handleErrorIfAny(summary);

         var results = [];
         summary.output.iterator().each(function (key, value) {
            log.debug('summarize result ' + key, value);
            results.push({
               key: key,
               value: value
            });
            return true;
         });

         log.audit('Summary Results', results);

         log.audit('Usage units consumed', summary.usage);
         log.audit('Concurrency', summary.concurrency);
         log.audit('Number of yields', summary.yields);
      }

      function searchTransaction(jsonObj) {

         var arr = [];
         var searchId = runtime.getCurrentScript().getParameter('custscript_commission_detail_search');
         log.debug("searchId ", searchId)
         var postingPeriod = runtime.getCurrentScript().getParameter('custscript_posting_period');

         var adjSearchResult = getAdjustmentSearch()
         // log.debug("adjSearchResult", adjSearchResult);

         adjSearchResult.forEach((result) => {
            arr.push(result)
         })

         for (var p in jsonObj) {

            var partnerId = jsonObj[p].partnerid;
            var payout = jsonObj[p].payout;
            //log.debug('LOOP', 'partnerId: ' + partnerId + ' | payout: ' + payout);

            var searchObj = search.load({ id: searchId });

            var endDate = getPeriodDetails(Number(postingPeriod)).enddate;
            //Add Filters to search
            var filterEndDate = search.createFilter({
               name: 'trandate',
               operator: 'onorbefore',
               values: endDate
            });
            searchObj.filters.push(filterEndDate);
            var filterPartnerId = search.createFilter({
               name: 'partnerteammember',
               operator: 'anyof',
               values: partnerId
            });
            searchObj.filters.push(filterEndDate);
            searchObj.filters.push(filterPartnerId);

            var resultSet = searchObj.run();

            var currentRange = resultSet.getRange({
               start: 0,
               end: 1000
            });

            var i = 0;  // iterator for all search results
            var j = 0;  // iterator for current result range 0..999
            var line = parseInt(0);

            while (j < currentRange.length) {

               var result = currentRange[j];
               var id = result.id;
               var column = result.columns;

               var internalId = result.getValue({ name: 'internalid' });
               var recordType = result.getValue(column[15]);
               var lineUniqueKey = result.getValue({ name: 'lineuniquekey' });
               var lineItem = result.getValue({ name: 'item' });
               var netAmount = result.getValue({ name: 'netamount' })
               var commissionAmount = Number(result.getValue(column[12]));

               if (commissionAmount != 0) {
                  var sequence = internalId + '-' + lineUniqueKey + '-' + lineItem;

                  arr.push({
                     'sequence': sequence,
                     'internalId': internalId,
                     'recordType': recordType,
                     'lineUniqueKey': lineUniqueKey,
                     'lineItem': lineItem,
                     'netAmount': netAmount,
                     'commissionAmount': commissionAmount,
                     'partnerId': partnerId,
                     'payout': payout,
                     'adjustment': ""
                  });
               }

               //limit to 1000 only
               line++;
               i++;
               j++;

               if (j == 1000) {   // check if it reaches 1000
                  j = 0;          // reset j an reload the next portion
                  currentRange = resultSet.getRange({
                     start: i,
                     end: i + 1000
                  });
               }
            }

            searchObj = null;
         }
         log.debug("arr", arr)
         return arr;
      }
      function getPeriodDetails(id) {
         var accountingperiodSearchObj = search.create({
            type: "accountingperiod",
            filters: [["internalid", "anyof", id]],
            columns: ['periodname', 'internalid', 'enddate']
         });
         var searchRun = accountingperiodSearchObj.run().getRange(0, 1);
         return {
            'periodid': searchRun[0].getValue('internalid'),
            'periodname': searchRun[0].getValue('periodname'),
            'enddate': searchRun[0].getValue('enddate'),
         };
      }
      function setPayoutGrouped(recordtype, recordid, valueArr) {
         try {
            var rec = record.load({
               type: recordtype,
               id: recordid,
               isDynamic: true
            });
            var itemCount = rec.getLineCount('item');

            for (var v in valueArr) {
               var _lineUniqueKey = valueArr[v].lineUniqueKey;
               var _commissionamount = valueArr[v].commissionAmount;
               var _partnerId = valueArr[v].partnerId;
               var _lineItem = valueArr[v].lineItem;
               var _netAmount = valueArr[v].netAmount;
               var _adjustment = valueArr[v].adjustment;

               for (var i = 0; i < itemCount; i++) {
                  var altSalesPercent = rec.getSublistValue({ sublistId: 'item', fieldId: 'custcol_alt_sales_percent', line: i })
                  var lineAmount = rec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i })

                  //resetting commission paid amount based on altSales %
                  _commissionamount = round_number((altSalesPercent * _netAmount) / 100, 2)

                  // log.debug('Resetting Commission Paid Amoun :: altSalesPercent : ' + altSalesPercent + ' : lineAmount : ' + lineAmount + ' : Commission Calculated : ', _commissionamount)
                  var lineUniqueKey = rec.getSublistValue({ sublistId: 'item', fieldId: 'lineuniquekey', line: i });
                  if (lineUniqueKey === _lineUniqueKey) {
                     log.debug('Selected Item : ', lineUniqueKey)
                     rec.selectLine('item', i);
                     rec.setCurrentSublistValue({
                        sublistId: 'item', fieldId: 'custcol_commission_paid',
                        value: _commissionamount
                     });
                     rec.commitLine('item');
                     var paidCommissionId = createPaidCommission(recordid, _partnerId, _commissionamount, _lineItem, lineUniqueKey, _adjustment);
                     log.debug('PAID COMMISSION ID ' + paidCommissionId, JSON.stringify(valueArr[v]));
                     break;

                  }
               }
            }
            var recordId = rec.save();
            return recordId;
         } catch (e) {
            log.error("SET PAYOUT Exception: " + e.message, e);
         }
      }
      function setPayout(recordtype, recordid, commissionamount, linekey) {
         try {
            var rec = record.load({
               type: recordtype,
               id: recordid,
               isDynamic: true
            });
            var itemCount = rec.getLineCount('item');
            for (var i = 0; i < itemCount; i++) {
               var lineUniqueKey = rec.getSublistValue({ sublistId: 'item', fieldId: 'lineuniquekey', line: i });
               if (lineUniqueKey === linekey) {
                  rec.selectLine('item', i);
                  rec.setCurrentSublistValue({
                     sublistId: 'item', fieldId: 'custcol_commission_paid',
                     //value: Number(payout) });
                     value: Number(commissionamount)
                  });
                  rec.commitLine('item');
                  break;
               }
            }
            var recordId = rec.save();
            return recordId;
         } catch (e) {
            log.error("SET PAYOUT Exception: " + e.message, e);
         }
      }
      function createPaidCommission(internalid, partnerid, commissionpaid, itemid, lineUniqueKey, adjustment) {
         log.debug("adjustment on comm ", adjustment)
         try {
            // if (adjustment == "") {
            var COMMISSION_PAID = record.create({
               type: 'customrecord_commission_paid',
            });
            COMMISSION_PAID.setValue('custrecord_commission_transaction', internalid);
            COMMISSION_PAID.setValue('custrecord_commission_partner', partnerid);
            COMMISSION_PAID.setValue('custrecord_commission_paid', new Date());
            COMMISSION_PAID.setValue('custrecord_commission_paid_amount', commissionpaid);
            COMMISSION_PAID.setValue('custrecord_commission_item', itemid);
            COMMISSION_PAID.setValue('custrecord_invoice_line_id', lineUniqueKey);
            log.debug('Set Line Unique Field Value to : ', lineUniqueKey)

            var COMMISSION_PAID_ID = COMMISSION_PAID.save();
            return COMMISSION_PAID_ID;
            //}
         }
         catch (e) {
            log.debug('createPaidCommission ' + e.message, e)
         }
      }

      //region errorHandling
      function handleErrorAndSendNotification(e, stage) {
         log.error('Stage: ' + stage + ' failed', e);
         var author = -5;
         var recipients = 'marc.emilio@fullertonhealth.com';
         var subject = 'Map/Reduce script ' + runtime.getCurrentScript().id
            + ' failed for stage: ' + stage;
         var body = 'An error occurred with the following information:\n' +
            'Error code: ' + e.name + '\n' +
            'Error msg: ' + e.message;
         email.send({
            author: author,
            recipients: recipients,
            subject: subject,
            body: body
         });
      }
      function handleErrorIfAny(summary) {
         var inputSummary = summary.inputSummary;
         var mapSummary = summary.mapSummary;
         var reduceSummary = summary.reduceSummary;
         if (inputSummary.error) {
            var e = error.create({
               name: 'INPUT_STAGE_FAILED',
               message: inputSummary.error
            });
            log.error('Stage: getInputData failed', e);
         }
         handleErrorInStage('map', mapSummary);
         handleErrorInStage('reduce', reduceSummary);
      }
      function handleErrorInStage(stage, summary) {
         var errorMsg = [];
         summary.errors.iterator().each(function (key, value) {
            var msg = 'Failed ID: ' + key + '. Error was: ' + JSON.parse(value).message + '\n';
            errorMsg.push(msg);
            return true;
         });
         if (errorMsg.length > 0) {
            var e = error.create({
               name: 'FAILURE',
               message: JSON.stringify(errorMsg)
            });
            log.error('Stage: ' + stage + ' failed', e);
         }
      }
      //endregion errorHandling

      function round_number(number, precision, fillZeros) {
         var exp = Math.pow(10, precision);
         var round = Math.round(number * exp) / exp
         if (fillZeros > 0) {
            return round.toFixed(fillZeros)
         }
         return round;
      }

      function getAdjustmentSearch() {
         var obj = []
         const transactionSearchColInternalId = search.createColumn({ name: 'internalid' });
         const transactionSearchColSalesReppartnerTeamMember = search.createColumn({ name: 'partnerteammember', sort: search.Sort.ASC });
         const transactionSearchColDocumentNumber = search.createColumn({ name: 'tranid', sort: search.Sort.DESC });
         const transactionSearchColAdjustment = search.createColumn({ name: 'formulanumeric', formula: 'CASE WHEN {partnercontribution} > 0 THEN CASE WHEN {type} = \'Credit Memo\' THEN NVL({custcol_commission_paid},0)+NVL(ROUND(({custcol_alt_sales_percent}*({partnercontribution}*{netamount})),2),0) ELSE NVL({custcol_commission_paid},0)-NVL(ROUND(({custcol_alt_sales_percent}*({partnercontribution}*{netamount})),2),0) END ELSE 0 END' });
         const transactionSearchColDate = search.createColumn({ name: 'trandate' });
         const transactionSearchColItem = search.createColumn({ name: 'item' });
         const transactionSearchColLineUniqueKey = search.createColumn({ name: 'lineuniquekey' });
         const transactionSearchColPriceLevel = search.createColumn({ name: 'pricelevel' });
         const transactionSearchColCommissionLevel = search.createColumn({ name: 'custcol_commission_level' });
         const transactionSearchColSalesReppartnerContribution = search.createColumn({ name: 'partnercontribution', sort: search.Sort.ASC });
         const transactionSearchColContributionAmount = search.createColumn({ name: 'formulanumeric', formula: '{partnercontribution}*{netamount}' });
         const transactionSearchColAmountNet = search.createColumn({ name: 'netamount' });
         const transactionSearchColCommission = search.createColumn({ name: 'custcol_alt_sales_percent' });
         const transactionSearchColOriginalAltSales = search.createColumn({ name: 'custcol_original_altsalesamt' });
         const transactionSearchColCommissionAmount = search.createColumn({ name: 'formulanumeric', formula: '{custcol_alt_sales_percent}*({partnercontribution}*{netamount})' });
         const transactionSearchColCommissionPaid = search.createColumn({ name: 'custcol_commission_paid' });
         const transactionSearchColFormulaTextX39642QP = search.createColumn({ name: 'formulatext', formula: '{recordtype}' });
         const transactionSearchColFormulaNumericXM0WIVOM = search.createColumn({ name: 'formulanumeric', formula: 'To_Number(round({netamount}*{custcol_alt_sales_percent},2))' });
         const transactionSearch = search.create({
            type: 'transaction',
            filters: [
               ['trandate', 'onorafter', '01/01/2023'],
               'AND',
               ['type', 'anyof', 'CustCred', 'CustInvc'],
               'AND',
               ['mainline', 'is', 'F'],
               'AND',
               ['shipping', 'is', 'F'],
               'AND',
               ['taxline', 'is', 'F'],
               'AND',
               ['posting', 'is', 'T'],
               'AND',
               ['custcol_product_type', 'noneof', '16', '18'],
               'AND',
               ['partner.eligibleforcommission', 'is', 'T'],
               'AND',
               ['item', 'noneof', '9383', '-2', '19606', '19607', '19608'],
               'AND',
               ['subsidiary', 'anyof', '6'],
               'AND',
               ['amount', 'notequalto', '0.00'],
               'AND',
               ['custcol_alt_sales_percent', 'greaterthan', '0'],
               'AND',
               ['custcol_commission_paid', 'isnotempty', ''],
               'AND',
               ['trandate', 'before', 'startoflastmonth'],
               'AND',
               ['formulanumeric: CASE WHEN {partnercontribution} > 0 THEN CASE WHEN {type} = \'Credit Memo\' THEN NVL({custcol_commission_paid},0)+NVL(ROUND(({custcol_alt_sales_percent}*({partnercontribution}*{netamount})),2),0) ELSE NVL({custcol_commission_paid},0)-NVL(ROUND(({custcol_alt_sales_percent}*({partnercontribution}*{netamount})),2),0) END ELSE 0 END', 'notequalto', '0'],
            ],
            columns: [
               transactionSearchColInternalId,
               transactionSearchColSalesReppartnerTeamMember,
               transactionSearchColDocumentNumber,
               transactionSearchColAdjustment,
               transactionSearchColDate,
               transactionSearchColItem,
               transactionSearchColLineUniqueKey,
               transactionSearchColPriceLevel,
               transactionSearchColCommissionLevel,
               transactionSearchColSalesReppartnerContribution,
               transactionSearchColContributionAmount,
               transactionSearchColAmountNet,
               transactionSearchColCommission,
               transactionSearchColOriginalAltSales,
               transactionSearchColCommissionAmount,
               transactionSearchColCommissionPaid,
               transactionSearchColFormulaTextX39642QP,
               transactionSearchColFormulaNumericXM0WIVOM,
            ],
         });

         const transactionSearchPagedData = transactionSearch.runPaged({ pageSize: 1000 });
         for (let i = 0; i < transactionSearchPagedData.pageRanges.length; i++) {
            const transactionSearchPage = transactionSearchPagedData.fetch({ index: i });
            transactionSearchPage.data.forEach((result) => {
               const internalId = result.getValue(transactionSearchColInternalId);
               const recType = result.getValue(transactionSearchColFormulaTextX39642QP);
               const partnerId = result.getValue(transactionSearchColSalesReppartnerTeamMember);
               const netAmount = result.getValue(transactionSearchColAmountNet);
               // const documentNumber = result.getValue(transactionSearchColDocumentNumber);
               const adjustment = result.getValue(transactionSearchColAdjustment);
               // const date = result.getValue(transactionSearchColDate);
               const lineItem = result.getValue(transactionSearchColItem);
               const lineUniqueKey = result.getValue(transactionSearchColLineUniqueKey);
               const commissionAmount = result.getValue(transactionSearchColCommissionAmount);
               var sequence = internalId + '-' + lineUniqueKey + '-' + lineItem;
               obj.push({
                  sequence: sequence,
                  recordType: recType,
                  internalId: internalId,
                  lineUniqueKey: lineUniqueKey,
                  lineItem: lineItem,
                  partnerId: partnerId,
                  netAmount: netAmount,
                  commissionAmount: Number(commissionAmount),
                  adjustment: parseFloat(adjustment)
               })

            });
         }
         return obj
      }

      // function getLetestPaidCommrec(internalId) {
      //    var id
      //    const customrecord_commission_paidSearchColInternalId = search.createColumn({ name: 'internalid' });
      //    const customrecord_commission_paidSearchColSalesReppartner = search.createColumn({ name: 'custrecord_commission_partner' });
      //    const customrecord_commission_paidSearchColDateCreated = search.createColumn({ name: 'created', sort: search.Sort.DESC });
      //    const customrecord_commission_paidSearch = search.create({
      //       type: 'customrecord_commission_paid',
      //       filters: [
      //          ['custrecord_commission_partner', 'anyof', internalId],
      //       ],
      //       columns: [
      //          customrecord_commission_paidSearchColInternalId,
      //          customrecord_commission_paidSearchColSalesReppartner,
      //          customrecord_commission_paidSearchColDateCreated,
      //       ],
      //    });
      //    // Note: Search.run() is limited to 4,000 results
      //    // customrecord_commission_paidSearch.run().each((result: search.Result): boolean => {
      //    //   return true;
      //    // });
      //    const customrecord_commission_paidSearchPagedData = customrecord_commission_paidSearch.runPaged({ pageSize: 1000 });
      //    for (let i = 0; i < 1; i++) {
      //       const customrecord_commission_paidSearchPage = customrecord_commission_paidSearchPagedData.fetch({ index: i });
      //       customrecord_commission_paidSearchPage.data.forEach((result) => {
      //          const internalId = result.getValue(customrecord_commission_paidSearchColInternalId);
      //          const salesReppartner = result.getValue(customrecord_commission_paidSearchColSalesReppartner);
      //          const dateCreated = result.getValue(customrecord_commission_paidSearchColDateCreated);

      //          id = internalId
      //       });
      //    }
      //    return id
      // }
      return {
         getInputData: getInputData,
         map: map,
         // reduce: reduce,
         // summarize: summarize
      };

   });