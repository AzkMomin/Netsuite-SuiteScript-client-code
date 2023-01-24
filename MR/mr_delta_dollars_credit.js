/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record',
], function (search, record) {

    function getInputData() {
        //saved search which lists out the invoices where delta dollars are used
        var transactionSearch = search.load({
            id: '2433',
        })

        return transactionSearch
    }

    function map(context) {
        var searchResult = JSON.parse(context.value);
        // log.debug('searchResult : ', searchResult)

        var invoiceId = searchResult.values['GROUP(internalid)'].value;
        var customerId = searchResult.values['GROUP(internalid.customerMain)'].value;
        var invoiceAmount = searchResult.values['SUM(amount)'];

        context.write({
            key: customerId,
            value: {
                'invoiceId': invoiceId,
                'invoiceAmount': invoiceAmount
            }
        });
    }

    function reduce(context) {
        try {
            var records = context.values
            var customerId = context.key
            // log.debug('Context Value : ', records)
            log.debug('Context Customer Id : ', customerId)

            if (records.length > 0) {
                var totalInvoiceValue = 0;
                for (var i = 0; i < records.length; i++) {
                    var invoiceRecord = JSON.parse(records[i])
                    // log.debug('Context Value : ', invoiceRecord)
                    // log.debug('Inv Amount : ', invoiceRecord.invoiceAmount)

                    totalInvoiceValue += parseInt(invoiceRecord.invoiceAmount)
                }

                var deltaDollarsRecord = getPercentValue(totalInvoiceValue);
                if (deltaDollarsRecord !== false) {
                    log.debug('Found Delta Dollars Value as :: ' + deltaDollarsRecord.deltaDollars + ' :: for :: ' + totalInvoiceValue)
                    let deltaDollarRecFound = getDeltaDollarRecForSameCustomer(customerId)
                    log.debug('deltaDollarRecFound : ', deltaDollarRecFound);
                    // var creditMemoRecId = createCreditMemoRecord(customerId, deltaDollarsRecord.deltaDollars)
                    var deltaDollarRec = createDeltaDollarRecord(deltaDollarsRecord, totalInvoiceValue, customerId, deltaDollarRecFound)
                    // log.debug('credit memo record id : ' , creditMemoRecId)
                    log.debug('Delta Dollar record id : ' , deltaDollarRec)
                }

                for (var i = 0; i < records.length; i++) {
                    var invoiceRecord = JSON.parse(records[i])
                     var invId = record.submitFields({
                         type: record.Type.INVOICE,
                         id: invoiceRecord.invoiceId,
                         values: {
                             'custbody_lsk_ddcreated': 'T',
                           'custbody_lsk_ddrecord': deltaDollarRec,
                         }
                     })   

                     log.debug('Updated Invoice Checkbox :: ', invoiceRecord.invoiceId)
                     log.debug('Invid : ' + invId)
                }
            }
        }
        catch (e) {
            log.debug('error : ', e)
        }
    }

    function summarize() {

    }


    function getPercentValue(total) {
        var deltaDollars = 0
        var tierSelectedPercent = 0
        var tierSelected = 0
        var tiersRecordCount = getCounts('customrecord_lsk_ddtiersrecord');
        for (var i = 1; i <= tiersRecordCount; i++) {
            var deltaCreditTier = record.load({
                type: 'customrecord_lsk_ddtiersrecord',
                id: i
            })
            var inactiveCheck = deltaCreditTier.getValue({ fieldId: 'isinactive' });

            if (inactiveCheck != 'F') {
                //ignore inactive records
                var maxAmount = deltaCreditTier.getValue({ fieldId: 'custrecord_lsk_maxamt' })
                var minAmount = deltaCreditTier.getValue({ fieldId: 'custrecord_lsk_minamt' })

                //log.debug('Min Amount : ' + minAmount + ' : Max Amount : ' + maxAmount + ' : Total : ' + parseFloat(total))
                if (parseFloat(total) >= parseFloat(minAmount)) {
                    if (maxAmount == '' || (parseFloat(total) < parseFloat(maxAmount))) {
                        //amount greater than 1M
                        var applicableTier = deltaCreditTier.getText({ fieldId: 'custrecord_lsk_tierpercent' })
                        var applicableTierValue = deltaCreditTier.getValue({ fieldId: 'custrecord_lsk_tierpercent' })
                        deltaDollars = (applicableTier / 100) * total
                        //log.debug('Delta Dollars Applicable :: ', deltaDollars)
                        tierSelectedPercent = applicableTier
                        tierSelected = i
                    }
                }
            }
        }

        if (tierSelected == 0) {
            return false;
        } else {
            return {
                'deltaDollars': parseInt(deltaDollars),
                'tierSelectedPercent': applicableTierValue,
                'tierSelected': tierSelected
            }
        }
    }

    function getCounts(typevalue) {
        var countSearch = {};
        var type = typevalue;
        var columns = [{
            name: 'internalid',
            summary: 'COUNT'
        }];
        var filters = [];
        countSearch.type = type;
        countSearch.columns = columns;
        countSearch.filters = filters;
        var mySearchObj = search.create(countSearch);
        var value;
        var resultset = mySearchObj.run();
        var results = resultset.getRange(0, 100);
        for (var i in results) {
            var result = results[i];
            value = result.getValue(result.columns[0]);

        }
        return value;
    }

    function createDeltaDollarRecord(deltaDollarsRecord, totalInvoiceValue, customerId,  deltaDollarRecFound) {

        var deltaDollarRecord;
        if (deltaDollarRecFound.createNewDeltaDollar) {
            deltaDollarRecord = record.create({
                type: 'customrecord1379',
                isDynamic: true
            })
        } else {
            deltaDollarRecord = record.load({
                type: 'customrecord1379',
                id: deltaDollarRecFound.deltaDollarId,
                isDynamic: true
            })
        }
        var currentYear = new Date().getFullYear();
        var nextYear = parseInt(currentYear) + 1
        var prevYear = parseInt(currentYear) - 1
        var startDate = new Date("11/1/" + prevYear)
        var endDate = new Date("10/31/" + currentYear)
        var expiryDate = new Date("10/31/" + nextYear)



        deltaDollarRecord.setValue({
            fieldId: 'custrecord_lsk_dd_customer',
            value: customerId,
            ignoreFieldChange: true
        })

        deltaDollarRecord.setValue({
            fieldId: 'custrecord_lsk_eligibledd',
            value: deltaDollarsRecord.deltaDollars,
            ignoreFieldChange: true
        })

        deltaDollarRecord.setValue({
            fieldId: 'custrecord_lsk_eligibleamountfordd',
            value: totalInvoiceValue,
            ignoreFieldChange: true
        })

        deltaDollarRecord.setValue({
            fieldId: 'custrecord_lsk_creditstartdate',
            value: startDate,
            ignoreFieldChange: true
        })

        deltaDollarRecord.setValue({
            fieldId: 'custrecord_lsk_creditenddate',
            value: endDate,
            ignoreFieldChange: true
        })

        deltaDollarRecord.setValue({
            fieldId: 'custrecord_lsk_creditexpirydate',
            value: expiryDate,
            ignoreFieldChange: true
        })

        deltaDollarRecord.setValue({
            fieldId: 'custrecord_lsk_eligiblecreditpercentage',
            value: deltaDollarsRecord.tierSelectedPercent,
            ignoreFieldChange: true
        })

        deltaDollarRecord.setValue({
            fieldId: 'custrecord_lsk_eligibletier',
            value: deltaDollarsRecord.tierSelected,
            ignoreFieldChange: true
        })

        // deltaDollarRecord.setValue({
        //     fieldId: 'custrecord_lskcreditmemolink',
        //     value: creditMemoRecId,
        //     ignoreFieldChange: true
        // })

        var deltaDollarRecordId = deltaDollarRecord.save()
        // log.debug(' Delta Dollar Record Saved :: ', deltaDollarRecordId)
        return deltaDollarRecordId
    }

    function createCreditMemoRecord(customerId, deltaDollarsValue) {
        var creditMemoRecord = record.create({
            type: 'CreditMemo',
            isDynamic: false
        })

        creditMemoRecord.setValue({
            fieldId: 'entity',
            value: customerId,
            ignoreFieldChange: true
        })

        //setting location as TX-Summit
        creditMemoRecord.setValue({
            fieldId: 'location',
            value: 3,
            ignoreFieldChange: true
        })

        //setting an item Delta Dollars Credit
        creditMemoRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'item',
            line: 0,
            value: 42927
        })

        creditMemoRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'account',
            line: 0,
            value: 590
        })

        creditMemoRecord.setSublistValue({
            sublistId: 'item',
            fieldId: 'amount',
            line: 0,
            value: deltaDollarsValue
        })

        var creditMemoRecordId = creditMemoRecord.save()
        // log.debug('Credit Memo Record Saved :: ', creditMemoRecordId)
        return creditMemoRecordId;
    }
    function getDeltaDollarRecForSameCustomer(customerId) {
        
        var returnObj;
        const customrecord1379SearchColId = search.createColumn({ name: 'id', sort: search.Sort.ASC });
        const customrecord1379SearchColScriptId = search.createColumn({ name: 'scriptid' });
        const customrecord1379Search = search.create({
            type: 'customrecord1379',
            filters: [
                ['formulatext: {custrecord_lsk_dd_customer.internalid}', 'is', customerId],
            ],
            columns: [
                customrecord1379SearchColId,
                customrecord1379SearchColScriptId,
            ],
        });

        
        const customrecord1379SearchPagedData = customrecord1379Search.runPaged({ pageSize: 1000 });
        log.debug("search result : ", customrecord1379SearchPagedData.pageRanges.length)
        if (customrecord1379SearchPagedData.pageRanges.length != 0) {
            for (let i = 0; i < customrecord1379SearchPagedData.pageRanges.length; i++) {
                const customrecord1379SearchPage = customrecord1379SearchPagedData.fetch({ index: i });
                customrecord1379SearchPage.data.forEach((result) => {
                    const id = result.getValue(customrecord1379SearchColId);
                    
                    var dateCreatedIsCurrentYear = isdateCreatedYearIsCurrentYear(id)
                    if (dateCreatedIsCurrentYear) {
                        returnObj =  {
                            'createNewDeltaDollar': false,
                            'deltaDollarId': id,
                        }
                    }else{
                        log.debug("record found but not of current year")
                        returnObj =  {
                            'createNewDeltaDollar': true,
                        }
                    }
                });
            }
        } else {
            log.debug("else")
            returnObj =  {
                'createNewDeltaDollar': true,
            }
        }
        
        return returnObj

    }

    function isdateCreatedYearIsCurrentYear(id) {
        const deltaDollarRecord = record.load({
            type: 'customrecord1379',
            id: id,
            isDynamic: true
        })

        let dateCreatedYear = deltaDollarRecord.getValue({ fieldId: "created" }).getFullYear();
        let currentYear = new Date().getFullYear();
        if (dateCreatedYear == currentYear) {
            return true

        } else if(dateCreatedYear < currentYear) {
            return false
        }

    }
    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce
    }

});