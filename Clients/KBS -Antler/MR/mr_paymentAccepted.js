/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record', 'N/runtime'
], function (search, record, runtime) {

    function getInputData() {
        //Search which contains invoices that contains JE
        var invoiceSearch = search.load({
            id: 'customsearch2974'
        });
        return invoiceSearch;
    }

    function map(context) {
        var searchResult = JSON.parse(context.value);
        // log.debug("searchResult", searchResult)
        context.write({
            key: searchResult.values["GROUP(formulatext)"],
            value: {
                inv: searchResult.values["GROUP(tranid)"],
                invId: searchResult.values["GROUP(internalid)"].value,
                JE: searchResult.values["MAX(custbody_journal_entry)"],
                JE_ID: searchResult.values["MIN(internalid.CUSTBODY_JOURNAL_ENTRY)"],
                creditDebitAmt: searchResult.values["AVG(custbodyamt_to_apply)"]
            }

        });
    }
    function reduce(context) {
        var records = context.values
        // log.debug('context : ', records);
        if (context.key == "P13854 BROADCOM (IFS)") {
            var data = []
            for (var i = 0; i < records.length; i++) {
                var jsonRec = JSON.parse(records[i])
                var jeSplitsBySpace = (jsonRec.JE).split(" ")[1];
                var jeSplitByHashTag = (jeSplitsBySpace).split("#")[1];

                data.push({
                    'InvNumber': jsonRec.inv,
                    'InvId': jsonRec.invId,
                    'JE': jeSplitByHashTag,
                    'JE_ID': jsonRec.JE_ID,
                    'creditDebitAmt': jsonRec.creditDebitAmt
                })
            }
            log.debug('data', data)


            log.debug('parent customer : ', context.key)
            var customerSearchColInternalId = search.createColumn({ name: 'internalid' });
            var customerSearch = search.create({
                type: 'customer',
                filters: [
                    ['entityid', 'is', context.key],
                ],
                columns: [
                    customerSearchColInternalId,
                ],
            });

            var parentId;
            var customerSearchPagedData = customerSearch.runPaged({ pageSize: 1000 });
            for (var i = 0; i < customerSearchPagedData.pageRanges.length; i++) {
                var customerSearchPage = customerSearchPagedData.fetch({ index: i });
                customerSearchPage.data.forEach(function (result) {
                    var internalId = result.getValue(customerSearchColInternalId);
                    parentId = internalId
                });
            }

            log.debug('parentId : ' + parentId)


            var grpData = new Map()
            data.forEach((result) => {
                if (grpData.size != 0) {
                    if (grpData.has(result.JE_ID)) {
                        grpData.forEach((value, key) => {
                            if (key == result.JE_ID) {
                                value.push({ invId: result.InvId, amount: result.creditDebitAmt })
                            }
                        })
                    } else {
                        grpData.set(result.JE_ID, [{ invId: result.InvId, amount: result.creditDebitAmt }])
                    }
                } else {
                    grpData.set(result.JE_ID, [{ invId: result.InvId, amount: result.creditDebitAmt }])
                }
            })


            try {
                var paymentRec = record.create({
                    type: 'customerpayment',
                    isDynamic: true
                });
                paymentRec.setValue({ fieldId: 'customer', value: parentId });
                var creditAmt = 0;
                var amtRemains = 0;
                var dueAmtCredit = 0;
                grpData.forEach((value, key) => {
                    log.debug(`key ${key} value : `, value)
                    value.forEach((val) => {

                        var applyLine = paymentRec.findSublistLineWithValue({
                            sublistId: 'apply',
                            fieldId: 'doc',
                            value: val.invId
                        });

                       
                        if (applyLine != -1) {
                            paymentRec.selectLine({ sublistId: 'apply', line: applyLine })
                            paymentRec.setCurrentSublistValue({ sublistId: "apply", fieldId: "apply", value: true });
                            paymentRec.setCurrentSublistValue({ sublistId: "apply", fieldId: "amount", value: val.amount });
                            paymentRec.commitLine({ sublistId: 'apply' });
                            creditAmt += parseFloat(val.amount);
                        }
                    })
                    var creditLine = paymentRec.findSublistLineWithValue({
                        sublistId: 'credit',
                        fieldId: 'doc',
                        value: key
                    });
                    // log.debug('creditLine', creditLine)
                    if (creditLine != -1) {
                        paymentRec.selectLine({ sublistId: 'credit', line: creditLine })
                        paymentRec.setCurrentSublistValue({ sublistId: "credit", fieldId: "apply", value: true });
                        dueAmtCredit = parseFloat(paymentRec.getCurrentSublistValue({ sublistId: "credit", fieldId: "due" }));
                        log.debug("dueAmtCredit : ", dueAmtCredit);
                        if (dueAmtCredit >= creditAmt) {
                            paymentRec.setCurrentSublistValue({ sublistId: "credit", fieldId: "amount", value: creditAmt });
                        } else {
                            paymentRec.setCurrentSublistValue({ sublistId: "credit", fieldId: "amount", value: dueAmtCredit });
                            amtRemains += (creditAmt - dueAmtCredit)
                        }
                        paymentRec.commitLine({ sublistId: 'credit' });

                    }

                });
                log.debug('creditAmt', creditAmt)
                log.debug('amtRemains', amtRemains)
                if (amtRemains != 0) {
                    paymentRec.setValue({ fieldId: 'payment', value: amtRemains });
                } else {
                    paymentRec.setValue({ fieldId: 'payment', value: '0.001' });

                }

                if (amtRemains != 0) {
                    paymentRec.setValue({ fieldId: 'custbodyamt_exc_je', value: true });
                };
                var paymentRecId = paymentRec.save()
                if (paymentRecId != "") {
                    grpData.forEach((value, key) => {
                        value.forEach((val) => {
                            var otherId = record.submitFields({
                                type: 'invoice',
                                id: val.invId,
                                values: {
                                    'custbody_kbs_je_applied': true
                                }
                            });
                        })
                    });
                }
                log.debug('JE applied successfully')
                log.debug('paymentRecId : ' + paymentRecId)
            }
            catch (e) {
                log.debug('error :', e)
            }

        }
    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce
    }

});