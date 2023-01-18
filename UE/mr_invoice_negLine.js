/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */

 define([
    'N/search', 'N/record',
], function (search, record) {

    function getInputData() {
        var invoiceSearchColInternalId = search.createColumn({ name: 'internalid' });
        var invoiceSearch = search.create({
            type: 'invoice',
            filters: [
                ['type', 'anyof', 'CustInvc'],
                'AND',
                ['mainline', 'is', 'T'],
                'AND',
                ['trandate', 'within', 'lastmonth'],
              	'AND',
                ['custbody_invoice_negative_processed', 'is', 'f'],
            ],
            columns: [
                invoiceSearchColInternalId,
            ],
        });



        return invoiceSearch;
    }

    function map(context) {
        var searchResult = JSON.parse(context.value);
        var values = searchResult.values
        //log.debug('context : ' , context)
        //Doesnot got internal id
        var internalid = searchResult.values['internalid'].value
        internalid = parseInt(internalid)
        log.debug('invoiceid : ' + internalid)

        //Loading invoice record
        var newRecord = record.load({
            'type': 'invoice',
            'id': internalid,
            'isDynamic': false,
        })



        var invoiceLineItemCount = newRecord.getLineCount({ sublistId: 'item' });

        var falseLineCount = 0
        for (var i = 0; i < invoiceLineItemCount; i++) {

            var itemId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i,
            })

            var subscriptioId = newRecord.getSublistValue({
                'sublistId': 'item',
                'fieldId': 'subscription',
                'line': i,
            })

            if (subscriptioId !== "") {

                var processed = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcolprocessed_split',
                    line: i,
                })

                var subscriptionRec = record.load({
                    'type': 'subscription',
                    'id': subscriptioId,
                    'isDynamic': true,
                })
                var subscriptionLineCount = subscriptionRec.getLineCount({ sublistId: 'subscriptionline' });

                for (var j = 0; j < subscriptionLineCount; j++) {
                    var subscriptionItem = subscriptionRec.getSublistValue({
                        sublistId: 'subscriptionline',
                        fieldId: 'item',
                        line: j,
                    })
                    var subscriptionIsActive = subscriptionRec.getSublistValue({
                        sublistId: 'subscriptionline',
                        fieldId: 'status',
                        line: j,
                    })


                    if (subscriptionItem === itemId && subscriptionIsActive == 'ACTIVE') {
                        var subscriptionLineId = subscriptionRec.getSublistValue({
                            sublistId: 'subscriptionline',
                            fieldId: 'subscriptionline',
                            line: j,
                        })

                        var subscriptionLineRec = record.load({
                            type: 'subscriptionline',
                            id: subscriptionLineId,
                            isDynamic: true,
                        })




                        var pb_amount = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_bp_amount' });
                        var calcu = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_calculation' });

                        if ((pb_amount != 0 || pb_amount != "") && calcu == 'Split') {
                            if ((itemId === '416' || itemId === '414') && processed == false) {

                                falseLineCount += 1
                            }
                        }

                    }

                }
            }

        }

        //log.debug('invoiceLineItemCount : ' + invoiceLineItemCount)
        //log.debug('falseLineCount : ' + falseLineCount)

        for (var i = 0; i < invoiceLineItemCount + falseLineCount; i++) {

            var itemId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i,
            })

            var subscriptioId = newRecord.getSublistValue({
                'sublistId': 'item',
                'fieldId': 'subscription',
                'line': i,
            })

            var processed = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcolprocessed_split',
                line: i,
            })

            if (subscriptioId !== "") {

                var values = getPB_AmountAndCalcMthd(itemId, subscriptioId)

                if ((values.pb_amount != 0 || values.pb_amount != "") && values.calculation == 'Split') {
                    if ((itemId == 416 || itemId == 414) && processed == false) {
                        setOnCreateAndEdit(i, itemId, processed, newRecord)
                    }
                    else if ((itemId == 416 || itemId == 414) && processed == true) {
                        setOnCreateAndEdit(i, itemId, processed, newRecord)


                    }
                }

            }

        }
        newRecord.setValue({ fieldId: "custbody_invoice_negative_processed", value: true });
        try {
            newRecord.save();
        }
        catch (e) {
            log.debug('error', e)
        }

        //loop for negative line record
        var invoiceLineItemCountForInvCreation = newRecord.getLineCount({ sublistId: 'item' });
        var splitInvoiceData = []
        var rebateInvoiceData = []

        //getting data for split
        var invoiceLineItemCount = newRecord.getLineCount({ sublistId: 'item' });
        for (var i = 0; i < invoiceLineItemCountForInvCreation; i++) {

            var itemId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i,
            })

            var subscriptioId = newRecord.getSublistValue({
                'sublistId': 'item',
                'fieldId': 'subscription',
                'line': i,
            })

            var processed = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcolprocessed_split',
                line: i,
            })

            if (subscriptioId === "") {
                var subscriptioIdrecordLoad = newRecord.getSublistValue({
                    'sublistId': 'item',
                    'fieldId': 'subscription',
                    'line': i - 1,
                })
                var subscriptionRec = record.load({
                    'type': 'subscription',
                    'id': subscriptioIdrecordLoad,
                    'isDynamic': true,
                })
                var subscriptionLineCount = subscriptionRec.getLineCount({ sublistId: 'subscriptionline' });

                for (var j = 0; j < subscriptionLineCount; j++) {
                    var subscriptionItem = subscriptionRec.getSublistValue({
                        sublistId: 'subscriptionline',
                        fieldId: 'item',
                        line: j,
                    })
                    var subscriptionIsActive = subscriptionRec.getSublistValue({
                        sublistId: 'subscriptionline',
                        fieldId: 'status',
                        line: j,
                    })


                    if (subscriptionItem === itemId && subscriptionIsActive == 'ACTIVE') {
                        var subscriptionLineId = subscriptionRec.getSublistValue({
                            sublistId: 'subscriptionline',
                            fieldId: 'subscriptionline',
                            line: j,
                        })

                        var subscriptionLineRec = record.load({
                            type: 'subscriptionline',
                            id: subscriptionLineId,
                            isDynamic: true,
                        })


                        var calc_method = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_method' });
                        var calcu = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_calculation' });
                        var discountRateCap = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_disc_r_cap' });
                        var pb_per = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_per' });
                        var pb_amount = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_bp_amount' });
                        var withAccount = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_withacc' });
                        var stdRate = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subline_rate' });
                        var calCap = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_calc_cap' });
                        var discountPercent = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_disc_rate' });
                        var calCapByOtherProd = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_cap_by_otherprod' })


                        var Qty = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            line: i,

                        });

                        var rate = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'rate',
                            line: i
                        });
                        var amount = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'amount',
                            line: i
                        });
                        var taxcode = newRecord.getSublistValue({
                            sublistId: 'item',
                            fieldId: 'taxcode',
                            line: i,
                        })


                        splitInvoiceData.push({
                            'Qty': Qty,
                            'unitCost': rate,
                            'amount': amount,
                            'itemId': itemId,
                            'subscriptioId': subscriptionLineId,
                            'withAccount': withAccount,
                            'taxcode': taxcode,
                            'pb_amount': pb_amount,
                            'pb_per': pb_per,
                            'calc_method': calc_method,
                            'calcu': calcu,
                            'discountPercent': discountPercent,
                            'calCap': calCap,
                            'calCapByOtherProd': calCapByOtherProd,

                        })



                    }

                }
            }
        }

        //getting data for Rebate
        var invoiceLineItemCount = newRecord.getLineCount({ sublistId: 'item' });
        for (var i = 0; i < invoiceLineItemCount; i++) {

            var itemId = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'item',
                line: i,
            })

            var subscriptioId = newRecord.getSublistValue({
                'sublistId': 'item',
                'fieldId': 'subscription',
                'line': i,
            })

            var processed = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcolprocessed_split',
                line: i,
            })

            if (subscriptioId !== "" && processed == false) {
                var subscriptionRec = record.load({
                    'type': 'subscription',
                    'id': subscriptioId,
                    'isDynamic': true,
                })
                var subscriptionLineCount = subscriptionRec.getLineCount({ sublistId: 'subscriptionline' });
                //log.debug('subscriptionLineCount : ' + subscriptionLineCount)
                for (var j = 0; j < subscriptionLineCount; j++) {
                    var subscriptionItem = subscriptionRec.getSublistValue({
                        sublistId: 'subscriptionline',
                        fieldId: 'item',
                        line: j,
                    })
                    var subscriptionIsActive = subscriptionRec.getSublistValue({
                        sublistId: 'subscriptionline',
                        fieldId: 'status',
                        line: j,
                    })


                    if (subscriptionItem === itemId && subscriptionIsActive == 'ACTIVE') {
                        var subscriptionLineId = subscriptionRec.getSublistValue({
                            sublistId: 'subscriptionline',
                            fieldId: 'subscriptionline',
                            line: j,
                        })

                        var subscriptionLineRec = record.load({
                            type: 'subscriptionline',
                            id: subscriptionLineId,
                            isDynamic: true,
                        })


                        var calc_method = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_method' });
                        var calcu = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_calculation' });
                        var discountRateCap = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_disc_r_cap' });
                        var pb_per = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_per' });
                        var pb_amount = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_bp_amount' });
                        var withAccount = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_withacc' });
                        var stdRate = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subline_rate' });
                        var calCap = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_calc_cap' });
                        var discountPercent = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_disc_rate' });
                        var calCapByOtherProd = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_cap_by_otherprod' });

                        if ((pb_amount != 0 || pb_amount != "") && calcu == 'Rebate') {
                            if ((itemId === '416' || itemId === '414')) {
                                var Qty = newRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'quantity',
                                    line: i,

                                });

                                var rate = newRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'rate',
                                    line: i
                                });
                                var amount = newRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    line: i
                                });
                                var taxcode = newRecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'taxcode',
                                    line: i,
                                })

                                var calculationCap = 0
                                if (calCapByOtherProd !== "") {
                                    var subscRec = record.load({
                                        'type': 'subscription',
                                        'id': subscriptioId,
                                        'isDynamic': true,
                                    })
                                    var subscItem = subscRec.getSublistValue({
                                        sublistId: 'subscriptionline',
                                        fieldId: 'item',
                                        line: j,
                                    })
                                    var subscIsActive = subscRec.getSublistValue({
                                        sublistId: 'subscriptionline',
                                        fieldId: 'status',
                                        line: j,
                                    })
                                    var calCapByOthrProd = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_cap_by_otherprod' });
                                    if (subscItem === calCapByOthrProd && subscIsActive == 'ACTIVE') {
                                        var subscLineId = subscriptionRec.getSublistValue({
                                            sublistId: 'subscriptionline',
                                            fieldId: 'subscriptionline',
                                            line: j,
                                        })

                                        var subscLineRec = record.load({
                                            type: 'subscriptionline',
                                            id: subscLineId,
                                            isDynamic: true,
                                        })

                                        var calcuCap = subscLineRec.getValue({ 'fieldId': 'custrecord_subsline_calc_cap' });


                                        calculationCap = calcuCap
                                    }
                                }
                                else {
                                    calculationCap = calCap
                                }


                                var values = calculation(calc_method, discountRateCap, pb_per, pb_amount, Qty, rate, amount, stdRate, calculationCap, discountPercent)

                                rebateInvoiceData.push({
                                    'Qty': Qty,
                                    'unitCost': values.unitCost,
                                    'amount': values.split,
                                    'itemId': itemId,
                                    'subscriptioId': subscriptioId,
                                    'withAccount': withAccount,
                                    'taxcode': taxcode,
                                    'pb_amount': pb_amount,
                                    'pb_per': pb_per,
                                    'calc_method': calc_method,
                                    'calcu': calcu,
                                    'discountPercent': discountPercent,
                                    'calCap': calCap,
                                    'calCapByOtherProd': calCapByOtherProd,



                                })
                            }
                        }

                    }

                }
            }

        }
        //log.debug('rebateInvoiceData : ', rebateInvoiceData)
        //log.debug('splitInvoiceData : ', splitInvoiceData)

        if (rebateInvoiceData.length > 0) {
            createInvoiceForCustomer(rebateInvoiceData, newRecord)
        }
        if (splitInvoiceData.length > 0) {
            createInvoiceForCustomer(splitInvoiceData, newRecord)
        }



        function createInvoiceForCustomer(recordValue, newRecord) {

            var postingPeriod = newRecord.getValue({ fieldId: 'postingperiod' })

            var custId = newRecord.getValue({ fieldId: 'entity' })
            for (var j = 0; j < recordValue.length; j++) {


                var invoiceSearchColPeriod = search.createColumn({ name: 'postingperiod' });
                var invoiceSearchColType = search.createColumn({ name: 'type' });
                var invoiceSearchColInternalId = search.createColumn({ name: 'internalid' });
                var invoiceSearch = search.create({
                    type: 'invoice',
                    filters: [
                        ['type', 'anyof', 'CustInvc'],
                        'AND',
                        ['mainline', 'is', 'T'],
                        'AND',
                        ['postingperiod', 'abs', postingPeriod],
                        'AND',
                        ['customer.internalid', 'anyof', recordValue[j].withAccount],
                    ],
                    columns: [
                        invoiceSearchColPeriod,
                        invoiceSearchColType,
                        invoiceSearchColInternalId,
                    ],
                });

                var currentInvId = []
                var invoiceSearchPagedData = invoiceSearch.runPaged({ pageSize: 1000 });
                for (var i = 0; i < invoiceSearchPagedData.pageRanges.length; i++) {
                    var invoiceSearchPage = invoiceSearchPagedData.fetch({ index: i });
                    invoiceSearchPage.data.forEach(function (result) {

                        var internalId = parseInt(result.getValue(invoiceSearchColInternalId));
                        currentInvId.push(internalId)
                    });
                }
                log.debug('previous record : ', currentInvId)

                if (currentInvId.length == 0) {
                    log.debug('Creating new invoice because no same posting peiod record found ')
                    // Creating new invoice because no same posting peiod record found
                    var invRec = record.create({
                        type: record.Type.INVOICE,
                        isDynamic: true,

                    });

                    var invDate = newRecord.getValue({ fieldId: 'trandate' })
                    log.debug('invDate : ' + invDate)
                    log.debug('recordValue', recordValue[j])
                    invRec.setValue({ fieldId: "entity", value: recordValue[j].withAccount });
                    invRec.setValue({ fieldId: "trandate", value: new Date(invDate) });


                    var amount = parseFloat(recordValue[j].amount)
                    var unitcost = parseFloat(recordValue[j].unitCost)
                    if (amount < 0) {
                        amount = amount * -1
                    }
                    if (unitcost < 0) {
                        unitcost = unitcost * -1
                    }
                    invRec.selectNewLine({ sublistId: "item" });


                    invRec.setCurrentSublistValue({ sublistId: "item", fieldId: "item", value: recordValue[j].itemId });
                    invRec.setCurrentSublistValue({ sublistId: "item", fieldId: "quantity", value: recordValue[j].Qty });
                    invRec.setCurrentSublistValue({ sublistId: "item", fieldId: "taxcode", value: recordValue[j].taxcode });
                    invRec.setCurrentSublistValue({ sublistId: "item", fieldId: "rate", value: unitcost });
                    invRec.setCurrentSublistValue({ sublistId: "item", fieldId: "amount", value: amount });
                    invRec.setCurrentSublistValue({ sublistId: "item", fieldId: "custcolprocessed_split", value: true });

                    invRec.commitLine({ sublistId: 'item' });




                    invRec.setValue({ fieldId: "custbody_invoice_negative_processed", value: true });

                    try {

                        var invoiceId = invRec.save()
                    }
                    catch (e) {
                        log.debug('error : ', e)
                    }
                    log.debug('invoiceId : ' + invoiceId)
                    log.debug('invoice created Successfully')


                }
                else {
                    log.debug('same posting period record found')

                    //Loading invoice record becaues same posting period record found
                    var invoiceRec = record.load({
                        'type': 'INVOICE',
                        'id': parseInt(currentInvId[0]),
                        'isDynamic': true,
                    })
                    log.debug('record loaded successfuly')
                    log.debug('recordValue', recordValue[j])
                    try {


                        var amount = parseFloat(recordValue[j].amount)
                        var unitcost = parseFloat(recordValue[j].unitCost)
                        if (amount < 0) {
                            amount = amount * -1
                        }
                        if (unitcost < 0) {
                            unitcost = unitcost * -1
                        }
                        invoiceRec.selectNewLine({ sublistId: "item" });


                        invoiceRec.setCurrentSublistValue({ sublistId: "item", fieldId: "item", value: recordValue[j].itemId });
                        invoiceRec.setCurrentSublistValue({ sublistId: "item", fieldId: "quantity", value: recordValue[j].Qty });
                        invoiceRec.setCurrentSublistValue({ sublistId: "item", fieldId: "taxcode", value: recordValue[j].taxcode });
                        invoiceRec.setCurrentSublistValue({ sublistId: "item", fieldId: "rate", value: unitcost });
                        invoiceRec.setCurrentSublistValue({ sublistId: "item", fieldId: "amount", value: amount });
                        invoiceRec.setCurrentSublistValue({ sublistId: "item", fieldId: "custcolprocessed_split", value: true });

                        invoiceRec.commitLine({ sublistId: 'item' });

                        invoiceRec.setValue({ fieldId: "custbody_invoice_negative_processed", value: true });

                        try {

                            var invoiceId = invoiceRec.save()
                        }
                        catch (e) {
                            log.debug('error : ', e)
                        }

                        log.debug('invoiceId : ' + invoiceId)
                        log.debug('invoice saved Successfully')

                    }
                    catch (e) {
                        log.debug('error : ', e)
                    }

                }
            }
        }

        function setOnCreateAndEdit(i, itemId, processed, newRecord) {
            var Qty = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'quantity',
                line: i,

            });

            var rate = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'rate',
                line: i
            });
            var subscriptioId = newRecord.getSublistValue({
                'sublistId': 'item',
                'fieldId': 'subscription',
                'line': i,
            })


            var subscriptionRec = record.load({
                'type': 'subscription',
                'id': subscriptioId,
                'isDynamic': true,
            })
            var subscriptionLineCount = subscriptionRec.getLineCount({ sublistId: 'subscriptionline' });

            for (var j = 0; j < subscriptionLineCount; j++) {
                var subscriptionItem = subscriptionRec.getSublistValue({
                    sublistId: 'subscriptionline',
                    fieldId: 'item',
                    line: j,
                })
                var subscriptionIsActive = subscriptionRec.getSublistValue({
                    sublistId: 'subscriptionline',
                    fieldId: 'status',
                    line: j,
                })


                if (subscriptionItem === itemId && subscriptionIsActive == 'ACTIVE') {
                    var subscriptionLineId = subscriptionRec.getSublistValue({
                        sublistId: 'subscriptionline',
                        fieldId: 'subscriptionline',
                        line: j,
                    })

                    var subscriptionLineRec = record.load({
                        type: 'subscriptionline',
                        id: subscriptionLineId,
                        isDynamic: true,
                    })
                    var amount = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount',
                        line: i
                    });


                    var calc_method = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_method' });
                    var discountRateCap = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_calculation' });
                    var pb_per = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_per' });
                    var pb_amount = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_bp_amount' });
                    var stdRate = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subline_rate' });
                    var calCap = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_calc_cap' });
                    var discountPercent = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_disc_rate' });
                    var calCapByOtherProd = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_cap_by_otherprod' });

                    var calculationCap = 0
                    if (calCapByOtherProd !== "") {
                        var subscRec = record.load({
                            'type': 'subscription',
                            'id': subscriptioId,
                            'isDynamic': true,
                        })
                        var subscItem = subscRec.getSublistValue({
                            sublistId: 'subscriptionline',
                            fieldId: 'item',
                            line: j,
                        })
                        var subscIsActive = subscRec.getSublistValue({
                            sublistId: 'subscriptionline',
                            fieldId: 'status',
                            line: j,
                        })
                        var calCapByOthrProd = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_cal_cap_by_otherprod' });
                        if (subscItem === calCapByOthrProd && subscIsActive == 'ACTIVE') {
                            var subscLineId = subscriptionRec.getSublistValue({
                                sublistId: 'subscriptionline',
                                fieldId: 'subscriptionline',
                                line: j,
                            })

                            var subscLineRec = record.load({
                                type: 'subscriptionline',
                                id: subscLineId,
                                isDynamic: true,
                            })

                            var calcuCap = subscLineRec.getValue({ 'fieldId': 'custrecord_subsline_calc_cap' });


                            calculationCap = calcuCap
                        }
                    }
                    else {
                        calculationCap = calCap
                    }

                    log.debug('calculationCap : ' + calculationCap)
                    var calculatedValue = calculation(calc_method, discountRateCap, pb_per, pb_amount, Qty, rate, amount, stdRate, calculationCap, discountPercent)

                    setValue(i, itemId, processed, Qty, calculatedValue.split, calculatedValue.unitCost, newRecord)



                }

            }

        }

        function getPB_AmountAndCalcMthd(itemId, subscriptioId) {
            var pbAmountAndCalMethod = {}

            var subscriptionRec = record.load({
                'type': 'subscription',
                'id': subscriptioId,
                'isDynamic': true,
            })
            var subscriptionLineCount = subscriptionRec.getLineCount({ sublistId: 'subscriptionline' });
            //log.debug('subscriptionLineCount : ' + subscriptionLineCount)
            for (var j = 0; j < subscriptionLineCount; j++) {
                var subscriptionItem = subscriptionRec.getSublistValue({
                    sublistId: 'subscriptionline',
                    fieldId: 'item',
                    line: j,
                })
                var subscriptionIsActive = subscriptionRec.getSublistValue({
                    sublistId: 'subscriptionline',
                    fieldId: 'status',
                    line: j,
                })


                if (subscriptionItem === itemId && subscriptionIsActive == 'ACTIVE') {
                    var subscriptionLineId = subscriptionRec.getSublistValue({
                        sublistId: 'subscriptionline',
                        fieldId: 'subscriptionline',
                        line: j,
                    })

                    var subscriptionLineRec = record.load({
                        type: 'subscriptionline',
                        id: subscriptionLineId,
                        isDynamic: true,
                    })



                    pbAmountAndCalMethod['pb_amount'] = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_bp_amount' });
                    pbAmountAndCalMethod['calculation'] = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_calculation' });

                }

            }

            return pbAmountAndCalMethod
        }



        function calculation(calc_method, discountRateCap, pb_per, pb_amount, Qty, rate, amount, stdRate, calculationCap, discountPercent) {

            var split = 0
            var unitCost = 0

            var calcualatedValue = {}

            var discountRate = parseFloat((stdRate * (100 - discountPercent)) / 100);



            if (calc_method == 'Flat') {
                if (pb_per == "Total") {
                    split = pb_amount * -1
                    unitCost = (split / Qty)
                } else if (pb_per == "Each") {
                    split = Qty * pb_amount * -1
                    unitCost = (split / Qty)
                }
            }
            else {

                var maxQty = Qty;


                if (calculationCap !== 0) {

                    if (Qty >= calculationCap) {
                        maxQty = calculationCap
                    } else {
                        maxQty = Qty
                    }
                }

                if (Qty <= discountRateCap || discountRateCap == 0) {


                    split = ((pb_amount / 100) * maxQty * discountRate) * -1
                    unitCost = (split / maxQty)
                }
                else {


                    split = (amount * (pb_amount / 100)) * -1
                    unitCost = (split / maxQty)
                }
            }

            calcualatedValue['split'] = split
            calcualatedValue['unitCost'] = unitCost

            return calcualatedValue

        }

        function setValue(i, itemId, processed, Qty, split, unitCost, newRecord) {
            var taxcode = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'taxcode',
                line: i,
            })

            split = parseFloat(split).toFixed(2)
            unitCost = parseFloat(unitCost).toFixed(2)
            if (processed == false) {

                try {
                    processed = true
                    newRecord.setSublistValue({ sublistId: "item", fieldId: "custcolprocessed_split", line: i, value: processed });
                    var l = i + 1;
                    newRecord.insertLine({ sublistId: "item", line: l });
                    newRecord.setSublistValue({ sublistId: "item", fieldId: "item", line: l, value: itemId });
                    newRecord.setSublistValue({ sublistId: "item", fieldId: "quantity", line: l, value: Qty });
                    newRecord.setSublistValue({ sublistId: "item", fieldId: "rate", line: l, value: unitCost });
                    newRecord.setSublistValue({ sublistId: "item", fieldId: "amount", line: l, value: split });
                    newRecord.setSublistValue({ sublistId: "item", fieldId: "taxcode", line: l, value: taxcode });
                    newRecord.setSublistValue({ sublistId: "item", fieldId: "custcolprocessed_split", line: l, value: processed });
                    log.debug('unit : ' + unitCost)
                    log.debug('split : ' + split)

                } catch (e) {
                    log.debug(e)
                }

            }
            else {
                processed = true
                var l = i + 1;
                try {
                    newRecord.setSublistValue({ sublistId: "item", fieldId: "item", line: l, value: itemId });
                    newRecord.setSublistValue({ sublistId: "item", fieldId: "quantity", line: l, value: Qty });
                    newRecord.setSublistValue({ sublistId: "item", fieldId: "rate", line: l, value: unitCost });
                    newRecord.setSublistValue({ sublistId: "item", fieldId: "amount", line: l, value: split });
                    newRecord.setSublistValue({ sublistId: "item", fieldId: "taxcode", line: l, value: taxcode });
                    newRecord.setSublistValue({ sublistId: "item", fieldId: "custcolprocessed_split", line: l, value: processed });

                } catch (e) {
                    log.debug(e)
                }
            }




        }

    }
    return {
        getInputData: getInputData,
        map: map
    }

});




