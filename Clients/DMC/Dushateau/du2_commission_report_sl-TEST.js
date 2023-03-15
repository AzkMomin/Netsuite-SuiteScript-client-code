/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */


// Constants
var PAGE_SIZE = 100;
var SEARCH_ID = '';


define(['N/redirect', 'N/search', 'N/ui/serverWidget', 'N/runtime', 'N/record', 'N/url', 'N/task'],

   function (redirect, search, serverWidget, runtime, record, url, task) {

      function onRequest(context) {

         var userDetails = runtime.getCurrentUser();
         var formName = runtime.getCurrentScript().getParameter('custscript_form_name');
         log.debug('scriptobj1', JSON.stringify(runtime.getCurrentScript()));

         // Form get request
         if (context.request.method == 'GET') {

            // Form goes here
            var form = serverWidget.createForm({
               title: formName,
               hideNavBar: false
            });

            // Call client scripts
            form.clientScriptModulePath = "../client/du2_commission_report_cs.js";

            var pageId = parseInt(context.request.parameters.page);
            log.debug('pageId1', pageId);

            var scriptId = context.request.parameters.script;
            var deploymentId = context.request.parameters.deploy;
            log.debug('scriptId', scriptId);
            log.debug('deploymentId', deploymentId);


            // Add Period field
            var postingPeriodId = context.request.parameters.postingperiod;
            log.debug('postingPeriodId', postingPeriodId);


            var filterPostingPeriod = form.addField({
               id: 'postingperiod',
               type: 'select',
               label: 'Payment Period'
            });

            // Add to list the default or selected period
            if (!isNullOrEmpty(postingPeriodId)) {
               log.debug('Period details', getPeriodDetails(postingPeriodId));
               filterPostingPeriod.addSelectOption({
                  value: getPeriodDetails(postingPeriodId).periodid,
                  text: getPeriodDetails(postingPeriodId).periodname
               });
            } else {
               filterPostingPeriod.addSelectOption({ value: '', text: '' });
            }

            // Add list of periods from search
            var accountingperiodSearchObj = search.create({
               type: "accountingperiod",
               filters: [
                  ["closed", "is", "F"]
               ],
               columns: [search.createColumn({
                  name: "internalid",
                  sort: search.Sort.ASC,
                  label: "Internal ID"
               }),
                  'periodname']
            });

            var searchRunPeriod = accountingperiodSearchObj.run().each(function (result) {
               var periodName = result.getValue('periodname')
               var periodLetters = periodName.substring(0, 2);
               var indent = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';

               if (periodLetters == 'Q1' || periodLetters == 'Q2' ||
                  periodLetters == 'Q3' || periodLetters == 'Q4') {
                  periodName = indent + periodName;
               }

               if (periodLetters != 'FY' &&
                  !(periodLetters == 'Q1' || periodLetters == 'Q2' ||
                     periodLetters == 'Q3' || periodLetters == 'Q4')) {
                  periodName = indent + indent + periodName;
               }

               filterPostingPeriod.addSelectOption({
                  value: result.getValue('internalid'),
                  text: periodName
               });
               return true;

            });


            //var resultsCount = (!isNullOrEmpty(postingPeriodId)) ? schTransactions(postingPeriodId).runPaged().count : 0;	// Load backend search
            var resultsCount = (!isNullOrEmpty(postingPeriodId)) ? runSearch(postingPeriodId).runPaged().count : 0;	// Load from NS search

            // Add sublist to the page
            var sublist = form.addSublist({
               id: 'custpage_transactions',
               type: 'list',
               label: 'Results (' + resultsCount + ')'
            });


            // Add fields to sublist

            var partner = sublist.addField({
               id: 'partner',
               label: 'Partner',
               type: 'text'
            });

            var partnerId = sublist.addField({
               id: 'partnerid',
               label: 'Partner ID',
               type: 'text'
            }).updateDisplayType({
               displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            var employeeNumber = sublist.addField({
               id: 'employeenumber',
               label: 'Employee Number',
               type: 'text'
            });

            var totalAmount = sublist.addField({
               id: 'totalamount',
               label: 'Transaction Net Amount',
               type: 'currency'
            });

            var altSalesPct = sublist.addField({
               id: 'altsalespct',
               label: 'Alt Sales %',
               type: 'text'
            }).updateDisplayType({
               displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            /*
            var altSalesOrig = sublist.addField({
               id : 'altsalesorig',
               label : 'Alt Sales Orig',
               type : 'text'
            }).updateDisplayType({
               displayType: serverWidget.FieldDisplayType.HIDDEN
            });
            */

            var averageCommission = sublist.addField({
               id: 'averagecommission',
               label: 'Average Commission',
               type: 'text'
            });


            var contributionPct = sublist.addField({
               id: 'contributionpct',
               label: 'Contribution %',
               type: 'text'
            }).updateDisplayType({
               displayType: serverWidget.FieldDisplayType.HIDDEN
            });

            var contributionAmt = sublist.addField({
               id: 'contributionamount',
               label: 'Contribution Amount',
               type: 'currency'
            });


            var bonusPlan = sublist.addField({
               id: 'bonusplan',
               label: 'Bonus Plan',
               type: 'text'
            });

            var bonusAmount = sublist.addField({
               id: 'bonusamount',
               label: 'Bonus Amount',
               type: 'currency'
            });


            var commission = sublist.addField({
               id: 'commission',
               label: 'Commission',
               type: 'text'
            });
            var adjustmentField = sublist.addField({
               id: 'adjustment',
               label: 'Adjustment (Previous Period)',
               type: 'text'
            });

            var draw = sublist.addField({
               id: 'draw',
               label: 'Draw',
               type: 'currency'
            });

            var payout = sublist.addField({
               id: 'payout',
               label: 'Commission to Pay',
               type: 'currency'
            });



            // Add other buttons to page
            form.addSubmitButton({
               id: 'custpage_process',
               label: 'Process Payout'
            });



            // Page iterator
            ///postingPeriodId = (isNullOrEmpty(context.request.parameters.postingperiod)) ?
            ///getCurrentPeriod() :
            ///context.request.parameters.postingperiod;

            // Page iterator setting values
            //var retrieveSearch = runSearch(SEARCH_ID, PAGE_SIZE, postingPeriodId);

            log.debug('postingPeriodId2', postingPeriodId);

            if (postingPeriodId) {

               var retrieveSearch = runSearch(postingPeriodId);
               var retrieveSearchCount = retrieveSearch.runPaged().count;
               //log.debug('retrieveSearch.runPaged().count', retrieveSearch.runPaged().count);

               ///log.debug('postingPeriodId3', postingPeriodId);
               log.debug('retrieveSearchCount', retrieveSearchCount);


               /*
                var pageCount = parseInt(retrieveSearch.count / PAGE_SIZE);
                if (!pageId || pageId == '' || pageId < 0)
                    pageId = 0;
                else if (pageId >= pageCount)
                    pageId = pageCount - 1;
                */

               // Show results to the form sublist
               //if (resultsCount != 0) {
               if (retrieveSearchCount > 0) {

                  var adjustmentMaping = getAdjustmentMaping()

                  log.debug("adjustmentMaping ", adjustmentMaping)
                  //if (!isNullOrEmpty(postingPeriodId) && retrieveSearch.runPaged().count > 0) {

                  //var addResults = fetchSearchResult(retrieveSearch, pageId);
                  var addResults = fetchSearchResult2(retrieveSearch);
                  var j = 0;
                  var payout = 0;
                  addResults.forEach(function (result) {
                     // log.debug("result " , result);
                     var bonusAmount = 0;
                     log.debug('result.contribution', result.contribution);

                     sublist.setSublistValue({ id: 'totalamount', line: j, value: result.amount });
                     sublist.setSublistValue({ id: 'partner', line: j, value: result.partner });
                     sublist.setSublistValue({ id: 'partnerid', line: j, value: result.partnerid });
                     sublist.setSublistValue({ id: 'employeenumber', line: j, value: result.partner.substring(result.partner.indexOf(':') + 1, result.partner.indexOf(' ')) });

                     //sublist.setSublistValue({ id:'altsalespct', line:j, value:result.altsalespct });
                     sublist.setSublistValue({ id: 'averagecommission', line: j, value: result.altsalespct });

                     //sublist.setSublistValue({ id:'contributionpct', line:j, value:result.contribution });
                     sublist.setSublistValue({ id: 'contributionamount', line: j, value: result.contribution });

                     var bonusPlan = search.lookupFields({
                        type: 'partner',
                        id: result.partnerid,
                        columns: "custentity_sales_bonus_plan"
                     });

                     // log.debug("bonusPlan + result.contribution", JSON.stringify(bonusPlan) + result.contribution);
                     adjustmentMaping.forEach((adjResult) => {
                        if (adjResult.salesrepPartnerName == result.partner) {
                           sublist.setSublistValue({ id: 'adjustment', line: j, value: String(adjResult.adjustment) });
                        }
                     })

                     //if (bonusPlan.custentity_sales_bonus_plan.length > 0) {
                     if (bonusPlan.custentity_sales_bonus_plan.length > 0 && Number(result.contribution) >= 0) {
                        sublist.setSublistValue({ id: 'bonusplan', line: j, value: bonusPlan.custentity_sales_bonus_plan[0].text });
                        //bonusAmount = schBonusAmount(bonusPlan.custentity_sales_bonus_plan[0].value,result.amount).bonusamount
                        bonusAmount = schBonusAmount(bonusPlan.custentity_sales_bonus_plan[0].value, result.contribution).bonusamount
                     }

                     sublist.setSublistValue({ id: 'bonusamount', line: j, value: Number(bonusAmount) });

                     // Set value with toCurrency for text field
                     ///sublist.setSublistValue({ id:'altsalesorig', line:j, value: toCurrency(result.altsalesorig) });
                     sublist.setSublistValue({ id: 'commission', line: j, value: toCurrency(result.commission) });

                     var partnerDraw = schPartnerDraw(result.partnerid);
                     sublist.setSublistValue({ id: 'draw', line: j, value: Number(partnerDraw) });
                     // adjustmentMaping.forEach((result)=>{

                     // })

                     payout = (Number(result.commission) > Number(partnerDraw)) ?
                        //Number(result.commission) - Number(partnerDraw) : 0;
                        (Number(result.commission) - Number(partnerDraw)) : 0;
                     sublist.setSublistValue({ id: 'payout', line: j, value: payout });

                     j++

                  });		// End for each
               }



            }
            


            // Write the form
            context.response.writePage(form);

         }



         // Form post request
         else {

            var postingPeriod = context.request.parameters.postingperiod;
            var postingPeriodTex = context.request.parameters.inpt_postingperiod;	// Get text value
            log.debug('postingPeriodTex', postingPeriodTex);

            var count = context.request.getLineCount({ group: 'custpage_transactions' });
            log.debug('count', count);

            var commissionDetails = [];
            var adjValueObj = getAdjustmentValue()
            log.debug("adjValueObj : ", adjValueObj)
            
            for (var i = 0; i < count; i++) {
               var partner = context.request.getSublistValue({
                  group: 'custpage_transactions',
                  name: 'partner',
                  line: i
               });
               var partnerId = context.request.getSublistValue({
                  group: 'custpage_transactions',
                  name: 'partnerid',
                  line: i
               });
               var payout = context.request.getSublistValue({
                  group: 'custpage_transactions',
                  name: 'payout',
                  line: i
               });
               var adjustment = context.request.getSublistValue({
                  group: 'custpage_transactions',
                  name: 'adjustment',
                  line: i
               });
               commissionDetails.push({
                  partner: partner,
                  partnerid: partnerId,
                  payout: payout,
                  adjustment: adjustment
               });
            }


            // Call Map/Reduce to process update record from detail of Summary Search
            var scriptTask = task.create({
               taskType: task.TaskType.MAP_REDUCE,
               scriptId: 'customscript_du_commission_report_mr',
            });
            scriptTask.params = {
               'custscript_posting_period': postingPeriod,
               'custscript_result_obj': commissionDetails,
            };
            var taskId = scriptTask.submit();
            log.debug('taskId', taskId);

            var taskStatus = task.checkStatus(taskId);
            log.debug('taskStatus', taskStatus);


            context.response.write('Generating commission for ' + count + ' Sales Rep/Partner status: ' + taskStatus.status);

         }




      }






      // Other functions
      //function runSearch(searchId, searchPageSize, postingPeriod) {
      function runSearch(postingPeriod) {
         log.debug('postingPeriod', postingPeriod);

         //var searchObj = schTransactions(postingPeriod);	// Load from backend

         // Load NS Search
         var searchId = runtime.getCurrentScript().getParameter('custscript_commission_summary_search');
         // log.debug("searchId " , searchId)
         var searchObj = search.load({ id: searchId });

         var endDate = getPeriodDetails(Number(postingPeriod)).enddate;
         log.debug('endDate', endDate);

         //Add Filter to search
         var filterEndDate = search.createFilter({
            name: "trandate",
            operator: 'onorbefore',
            values: endDate
         });
         searchObj.filters.push(filterEndDate);
         return searchObj;

         log.debug('searchObj', JSON.stringify(searchObj));

         /*
          return searchObj.runPaged({
              pageSize : searchPageSize
          });
          */
      }





      function fetchSearchResult(pagedData, pageIndex) {
         var searchPage = pagedData.fetch({
            index: pageIndex
         });
         var results = [];
         log.debug('searchPage', searchPage);

         searchPage.data.forEach(function (result) {
            // log.debug('result', result);

            var internalId = result.id;
            log.debug('internalId', internalId);

            var amount = result.getValue({ name: 'netamount', summary: "SUM" });
            var partner = result.getText({ name: 'partnerteammember', summary: "GROUP" });
            var partnerId = result.getValue({ name: 'partnerteammember', summary: "GROUP" });
            var altSalesPct = nonOrVal(result.getValue({ name: 'custcol_alt_sales_percent', summary: "AVG" }));
            var altSalesOrig = nonOrVal(result.getValue({ name: 'custcol_original_altsalesamt', summary: "SUM" }));
            var commission = nonOrVal(result.getValue({ name: 'formulanumeric1', summary: "SUM" }));
            var contributionAmount = nonOrVal(result.getValue({ name: 'formulanumeric2', summary: "SUM" }));

            results.push({
               internalid: internalId,
               amount: amount,
               partner: partner,
               partnerid: partnerId,
               altsalespct: altSalesPct,
               ///altsalesorig : altSalesOrig,
               commission: commission,
               contribution: contributionAmount
            });

         });

         log.debug('fetchSearchResults', JSON.stringify(results));

         return results;

      }


      function fetchSearchResult2(searchObj) {
         var results = [];
         var searchResult = searchObj.run();
         var searchDetailsRun = searchResult.each(function (result) {
            // log.debug('result', result);
            // log.debug('internalId', result.id);
            // log.debug('column 4', result.getValue(searchResult.columns[4]));
            // log.debug('column 1', result.getValue(searchResult.columns[1]));

            results.push({
               internalid: result.id,
               amount: result.getValue({ name: 'netamount', summary: "SUM" }),
               partner: result.getText({ name: 'partnerteammember', summary: "GROUP" }),
               partnerid: result.getValue({ name: 'partnerteammember', summary: "GROUP" }),
               altsalespct: nonOrVal(result.getValue({ name: 'custcol_alt_sales_percent', summary: "AVG" })),

               commission: Number(result.getValue(searchResult.columns[4])),
               //contribution : nonOrVal(result.getValue(searchResult.columns[4]))
               contribution: nonOrVal(result.getValue(searchResult.columns[1]))

            });
            return true;
         });
         log.debug('fetchSearchResult2', JSON.stringify(results));


         return results;
      }



      function schTransactions(postingPeriodId) {

         var endDate = getPeriodDetails(Number(postingPeriodId)).enddate;
         log.debug("endDate", endDate);

         // Search object from Export as Script plugin
         // Seach ID: 4226
         // Seach ID: 4251 - Prod

         var transactionSearchObj = search.create({
            type: "transaction",
            filters: [
               ["type", "anyof", "CustInvc", "CustCred"], "AND",
               ["mainline", "is", "F"], "AND",
               ["taxline", "is", "F"], "AND",
               ["shipping", "is", "F"], "AND",
               ["status", "noneof", "RtnAuth:A", "RtnAuth:C", "RtnAuth:H", "SalesOrd:A", "SalesOrd:C", "SalesOrd:H", "CustInvc:V", "CustInvc:E", "CustInvc:D"], "AND",
               ["custcol_product_type", "noneof", "18", "16", "38"], "AND",
               ["customermain.custentity_test_entity", "is", "F"], "AND",
               ["customer.otherrelationships", "noneof", "Partner"], "AND",
               ["custcol_product_type", "noneof", "18", "16", "38", "@NONE@"], "AND",

               ["trandate", "within", "lastmonth"], "AND",
               //["trandate","onorbefore",endDate], "AND",	// Filter based on selected period end date

               ["amount", "notequalto", "0.00"]
            ],
            columns: [
               search.createColumn({
                  name: "partnerteammember",
                  summary: "GROUP",
                  sort: search.Sort.ASC,
                  label: "Sales Rep/Partner Team Member"
               }),
               search.createColumn({
                  name: "netamount",
                  summary: "SUM",
                  label: "Amount (Net)"
               }),
               search.createColumn({
                  name: "custcol_alt_sales_percent",
                  summary: "AVG",
                  label: "Alt Sales %"
               }),
               search.createColumn({
                  name: "custcol_original_altsalesamt",
                  summary: "SUM",
                  label: "Original Alt Sales"
               }),
               search.createColumn({
                  name: "formulanumeric1",	// Renamed to formulanumeric1 for fetch of value
                  summary: "SUM",
                  //formula: "{custcol_original_altsalesamt}*{partnercontribution}",
                  formula: "{custcol_alt_sales_percent}*({partnercontribution}*{netamount})",
                  //label: "Formula (Numeric)"
                  label: "Commission Amount"
               }),
               search.createColumn({
                  name: "formulanumeric2",
                  summary: "SUM",
                  formula: "{partnercontribution}*{netamount}",
                  //label: "Formula (Numeric)"
                  label: "Contribution Amount"
               })

            ]
         });
         var searchResultCount = transactionSearchObj.runPaged().count;
         log.debug("transactionSearchObj result count", searchResultCount);

         return transactionSearchObj;

      }


      function isNullOrEmpty(val) {
         return (val == null || val == '' || val == undefined);
      }

      function nonOrVal(statement) {
         return (isNullOrEmpty(statement) ? ' ' : statement);
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

      function toCurrency(amount) {
         var value = amount * 1.0;
         value = value.toFixed(2);
         if (!value) value = "0.00";
         value += '';
         return value.replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
      }

      function schPartnerDraw(partnerid) {
         var partnerDrawSearch = search.create({
            type: "customrecord_commission_partner_draw",
            filters: [["custrecord_partner", "anyof", partnerid]],
            columns: ['custrecord_partner_draw']
         });
         var searchRun = partnerDrawSearch.run().getRange(0, 1);
         return (searchRun.length > 0) ? searchRun[0].getValue('custrecord_partner_draw') : 0;
      }

      function schBonusAmount(bonusPlan, contributionAmount) {
         var partnerDrawSearch = search.create({
            type: "customrecord_commission_bonus",
            filters: [["custrecord_sales_bonus_min", "notgreaterthan", contributionAmount], "AND",
            ["custrecord_sales_bonus_max", "notlessthan", contributionAmount], "AND",
            ["custrecord_sales_bonus_plan_type", "anyof", bonusPlan]],
            columns: ['custrecord_sales_bonus_tier', 'custrecord_sales_bonus_amount']
         });
         var searchRun = partnerDrawSearch.run().getRange(0, 1);
         return {
            'bonustier': searchRun[0].getValue('custrecord_sales_bonus_tier'),
            'bonusamount': searchRun[0].getValue('custrecord_sales_bonus_amount')
         };
      }

      function getCurrentPeriod() {
         var date = new Date(), y = date.getFullYear(), m = date.getMonth();
         var firstDay = new Date(y, m, 1);
         var lastDay = new Date(y, m + 1, 0);
         log.debug("lastDay", lastDay);
         var accountingperiodSearchObj = search.create({
            type: "accountingperiod",
            filters: [ //["startdate","on", formatDate(firstDay)], "AND",
               ["enddate", "on", formatDate(lastDay)]],
            columns: ['periodname', 'internalid', 'enddate']
         });
         var searchResultCount = accountingperiodSearchObj.runPaged().count;
         log.debug("accountingperiodSearchObj result count", searchResultCount);
         var searchRun = accountingperiodSearchObj.run().getRange(0, 1);
         return searchRun[0].getValue('internalid');
      }


      function formatDate(date) {
         log.debug("formatDate date", date);
         var now = new Date(date);
         var dd = now.getDate();
         var mm = now.getMonth() + 1; //January is 0!
         var yyyy = now.getFullYear();
         if (dd < 10) {
            dd = '0' + dd;
         }
         if (mm < 10) {
            mm = '0' + mm;
         }
         //var today = dd + '/' + mm + '/' + yyyy;
         var today = mm + '/' + dd + '/' + yyyy;
         log.debug("formatDate today", today);
         return today;
      }

      function getAdjustmentMaping() {
         var adjObj = []
         const transactionSearchColSalesReppartnerTeamMember = search.createColumn({ name: 'partnerteammember', summary: search.Summary.GROUP, sort: search.Sort.ASC });
         const transactionSearchColContributionAmount = search.createColumn({ name: 'formulanumeric', summary: search.Summary.SUM, formula: '{partnercontribution}*{netamount}' });
         const transactionSearchColTransactionTotal = search.createColumn({ name: 'netamount', summary: search.Summary.SUM });
         const transactionSearchColAvgCommission = search.createColumn({ name: 'custcol_alt_sales_percent', summary: search.Summary.AVG });
         const transactionSearchColCommissionAmount = search.createColumn({ name: 'formulanumeric', summary: search.Summary.SUM, formula: '{custcol_alt_sales_percent}*({partnercontribution}*{netamount})' });
         const transactionSearchColAdjustment = search.createColumn({ name: 'formulanumeric', summary: search.Summary.SUM, formula: 'CASE WHEN {partnercontribution} > 0 THEN CASE WHEN {type} = \'Credit Memo\' THEN NVL({custcol_commission_paid},0)+NVL(ROUND(({custcol_alt_sales_percent}*({partnercontribution}*{netamount})),2),0) ELSE NVL(ROUND(({custcol_alt_sales_percent}*({partnercontribution}*{netamount})),2),0)-NVL({custcol_commission_paid},0) END ELSE 0 END' });
         const transactionSearchColCommissionPaid = search.createColumn({ name: 'custcol_commission_paid', summary: search.Summary.SUM });
         const transactionSearch = search.create({
            type: 'transaction',
            filters: [
               ['trandate', 'onorafter', '12/01/2022'],
               'AND',
               ['type', 'anyof', 'CustInvc', 'CustCred'],
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
               ['trandate', 'onorbefore', 'lastmonth'],
               'AND',
               ['custcol_commission_paid', 'isnotempty', ''],
            ],
            columns: [
               transactionSearchColSalesReppartnerTeamMember,
               transactionSearchColContributionAmount,
               transactionSearchColTransactionTotal,
               transactionSearchColAvgCommission,
               transactionSearchColCommissionAmount,
               transactionSearchColAdjustment,
               transactionSearchColCommissionPaid,
            ],
         });
         // Note: Search.run() is limited to 4,000 results
         // transactionSearch.run().each((result: search.Result): boolean => {
         //   return true;
         // });
         const transactionSearchPagedData = transactionSearch.runPaged({ pageSize: 1000 });
         for (let i = 0; i < transactionSearchPagedData.pageRanges.length; i++) {
            const transactionSearchPage = transactionSearchPagedData.fetch({ index: i });
            transactionSearchPage.data.forEach(function (result) {
               const salesReppartnerTeamMember = result.getValue(transactionSearchColSalesReppartnerTeamMember);
               const salesReppartnerTeamMemberName = result.getText(transactionSearchColSalesReppartnerTeamMember);
               const contributionAmount = result.getValue(transactionSearchColContributionAmount);
               const transactionTotal = result.getValue(transactionSearchColTransactionTotal);
               const avgCommission = result.getValue(transactionSearchColAvgCommission);
               const commissionAmount = result.getValue(transactionSearchColCommissionAmount);
               const adjustment = result.getValue(transactionSearchColAdjustment);
               const commissionPaid = result.getValue(transactionSearchColCommissionPaid);
               adjObj.push({
                  "salesrepPartner": salesReppartnerTeamMember,
                  "salesrepPartnerName": salesReppartnerTeamMemberName,
                  "adjustment": parseFloat(adjustment),

               })
            });
         }
         return adjObj
      }

      function getAdjustmentValue() {
         var obj = [];
         var savedSearch = search.load({
            id: "customsearch_partner_commission_detai_27"
         });

         var searchResults = savedSearch.run().getRange({
            start: 0,
            end: 1000 // replace with the number of search results you want to retrieve
         });

         for (var i = 0; i < searchResults.length; i++) {
            var result = searchResults[i];
            // do something with the search result
            // for example, log the value of the 'internalid' column
            var adjustment = result.getValue({
               name: 'formulanumeric', formula: 'CASE WHEN {partnercontribution} > 0 THEN CASE WHEN {type} = \'Credit Memo\' THEN NVL({custcol_commission_paid},0)+NVL(ROUND(({custcol_alt_sales_percent}*({partnercontribution}*{netamount})),2),0) ELSE NVL({custcol_commission_paid},0)-NVL(ROUND(({custcol_alt_sales_percent}*({partnercontribution}*{netamount})),2),0) END ELSE 0 END'
            });
            var uniqueId = result.getValue({
               name: 'lineuniquekey'
            });
            var docNumber = result.getValue({
               name: 'tranid', sort: search.Sort.DESC
            });

            obj.push( {
               adjustment: Number(adjustment),
               uniqueId: Number(uniqueId),
               docNumber: docNumber
            })

         }

         return obj;
      }


      return {
         onRequest: onRequest
      };

   });