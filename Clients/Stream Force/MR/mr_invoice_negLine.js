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
                //['internalid', 'anyof', '1566002', '1566001', '1565999', '1566000'],
                ['internalid', 'is', '1566482'],
                //['trandate', 'within', 'thismonth'],
                //'AND',    
                //['custbody_invoice_negative_processed', 'is', 'f'],
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
        log.debug('invoiceLineItemCount : ' + invoiceLineItemCount);
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
            var amount = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                line: i,
            })

            if (subscriptioId !== "" && amount != 0) {

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


                        9
                        var pb_amount = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_bp_amount' });
                        var calcu = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_calculation' });
                        //log.debug('pb_amount : ' + pb_amount);
                        if ((pb_amount != 0 || pb_amount != "") && calcu == 'Split') {
                            if ((itemId === '416' || itemId === '414' || itemId === '246' || itemId === '419') && processed == false) {
                                falseLineCount += 1
                            }
                        }

                    }

                }
            }

        }

        log.debug('invoiceLineItemCount : ' + invoiceLineItemCount)
        log.debug('falseLineCount : ' + falseLineCount)

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
            var amount = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                line: i,
            })

            if (subscriptioId !== "" && amount != 0) {

                var values = getPB_AmountAndCalcMthd(itemId, subscriptioId)

                if ((values.pb_amount != 0 || values.pb_amount != "") && values.calculation == 'Split') {
                    if ((itemId == 416 || itemId == 414 || itemId == 246 || itemId == 419) && processed == false) {
                        setOnCreateAndEdit(i, itemId, processed, newRecord)
                    }
                    else if ((itemId == 416 || itemId == 414 || itemId == 246 || itemId == 419) && processed == true) {
                        setOnCreateAndEdit(i, itemId, processed, newRecord)


                    }
                }

            }

        }
        //newRecord.setValue({ fieldId: "custbody_invoice_negative_processed", value: true });
        try {
            var currentRec = newRecord.save();
            log.debug('Save Negative line invoice Id : ' + currentRec)
        }
        catch (e) {
            log.debug('error', e)
        }

        //loop for negative line record

        var splitInvoiceData = []
        var rebateInvoiceData = []

        //getting data for split
        var newinvoiceLineItemCount = newRecord.getLineCount({ sublistId: 'item' });
        for (var i = 0; i < newinvoiceLineItemCount; i++) {

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
            var amount = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'amount',
                line: i,
            })
            var CreateInv = newRecord.getSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_inv_created',
                line: i,
            })

            
            if (subscriptioId === "") {
                log.debug("CreateInv  :" , CreateInv)
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

                        // if (splitInvoiceData.length != 0) {
                        //     log.debug("found any rec")
                        //     var notFound = true
                        //     for (var z = 0; z < splitInvoiceData.length; z++) {
                        //         if (parseInt(splitInvoiceData[z].unitCost) == parseInt(rate) && parseInt(splitInvoiceData[z].itemId) == parseInt(itemId)) {
                        //             var newQty = parseInt(splitInvoiceData[z].Qty) + parseInt(Qty);
                        //             var amount = parseInt(splitInvoiceData[z].unitCost) * parseInt(newQty);
                        //             splitInvoiceData[z].Qty = newQty;
                        //             splitInvoiceData[z].amount = amount
                        //             notFound = false
                        //         }

                        //     }
                        //     if (notFound == false) {
                        //         splitInvoiceData.push({
                        //             'Qty': Qty,
                        //             'unitCost': rate,
                        //             'amount': amount,
                        //             'itemId': itemId,
                        //             'subscriptioId': subscriptionLineId,
                        //             'withAccount': withAccount,
                        //             'taxcode': taxcode,
                        //             'pb_amount': pb_amount,
                        //             'pb_per': pb_per,
                        //             'calc_method': calc_method,
                        //             'calcu': calcu,
                        //             'discountPercent': discountPercent,
                        //             'calCap': calCap,
                        //             'calCapByOtherProd': calCapByOtherProd,
                        //         })
                        //     }
                        // }
                        // else {
                      
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
                            "createInv": CreateInv
                        })
                        // }

                    }
                }
            }

            //getting data for Rebate
            else if (subscriptioId !== "" && processed == false ) {
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
                            if (itemId === '416' || itemId === '414' || itemId === '246' || itemId === '419') {
                                var customerFields = search.lookupFields({
                                    type: "customer",
                                    id: withAccount,
                                    columns: ['subsidiary']
                                });
                                var itemType = "noninventoryitem"
                                if(itemId == 246){
                                    itemType = "serviceitem"
                                }
                                var itemFields = search.lookupFields({
                                    type: itemType,
                                    id: itemId,
                                    columns: ['subsidiary']
                                });
                    
                                log.debug("customerFields.subsidiary : ", customerFields.subsidiary);
                                log.debug("itemFields.subsidiary ", itemFields.subsidiary);
            
                                var CreateInv = true;
                                if (customerFields.subsidiary[0].value == itemFields.subsidiary[0].value) CreateInv = false;
                                log.debug("create Inv : ", CreateInv);

                                var NewRecord = record.load({
                                    'type': 'invoice',
                                    'id': internalid,
                                    'isDynamic': false,
                                })
                                NewRecord.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcol_inv_created',
                                    line: i,
                                    value : CreateInv
                                })
                                NewRecord.setSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'custcolprocessed_split',
                                    line: i,
                                    value : true
                                })
                                NewRecord.save()
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
                                // if (rebateInvoiceData.length !=0) {
                                //     var notFound = true
                                //     for (var z = 0; z < rebateInvoiceData.length; z++) {
                                //         if (parseInt(rebateInvoiceData[z].unitCost) == parseInt(rate) && parseInt(rebateInvoiceData[z].itemId) == parseInt(itemId)) {
                                //             var newQty = parseInt(rebateInvoiceData[z].Qty) + parseInt(Qty);
                                //             var amount = parseInt(rebateInvoiceData[z].unitCost) * parseInt(newQty);
                                //             rebateInvoiceData[z].Qty = newQty;
                                //             rebateInvoiceData[z].amount = amount
                                //             notFound = false
                                //         }
                                //     }
                                //     if (notFound == false) {
                                //         rebateInvoiceData.push({
                                //             'Qty': Qty,
                                //             'unitCost': values.unitCost,
                                //             'amount': values.split,
                                //             'itemId': itemId,
                                //             'subscriptioId': subscriptioId,
                                //             'withAccount': withAccount,
                                //             'taxcode': taxcode,
                                //             'pb_amount': pb_amount,
                                //             'pb_per': pb_per,
                                //             'calc_method': calc_method,
                                //             'calcu': calcu,
                                //             'discountPercent': discountPercent,
                                //             'calCap': calCap,
                                //             'calCapByOtherProd': calCapByOtherProd,
                                //         })
                                //     }
                                // }
                                // else {
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
                                    "createInv": CreateInv
                                })
                                // }

                            }
                        }

                    }

                }
            }
        }



        log.debug('rebateInvoiceData : ', rebateInvoiceData)
        log.debug('splitInvoiceData : ', splitInvoiceData)

        if (rebateInvoiceData.length > 0) {
            createInvoiceForCustomer(rebateInvoiceData, newRecord, currentRec)
        }
        if (splitInvoiceData.length > 0) {
            createInvoiceForCustomer(splitInvoiceData, newRecord, currentRec)
        }



        function createInvoiceForCustomer(recordValue, newRecord, currentRec) {

            var postingPeriod = newRecord.getValue({ fieldId: 'postingperiod' });

            // var custId = newRecord.getValue({ fieldId: 'entity' })
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
                if (recordValue[j].createInv == false) {
                    if (currentInvId.length == 0) {
                        try {
                            log.debug('Creating new invoice because no same posting peiod record found ')
                            // Creating new invoice because no same posting peiod record found
                            var withAccount = recordValue[j].withAccount
                            var invRec = record.create({
                                type: 'invoice',
                                isDynamic: false,
                                defaultValues: {
                                    entity: withAccount
                                }
                            })

                            // invRec.setValue({ fieldId: "entity", value: parseInt(recordValue[j].withAccount) });
                            //log.debug('invDate : ' + invDate)
                            //log.debug('recordValue', recordValue[j])
                            log.debug('item', recordValue[j].itemId);
                            log.debug('with account', withAccount);

                            //invRec.setValue({ fieldId: "entity", value: parseInt(recordValue[j].withAccount) });
                            var invDate = newRecord.getValue({ fieldId: 'trandate' })
                            invRec.setValue({ fieldId: "trandate", value: new Date(invDate) });

                            var amount = parseFloat(recordValue[j].amount)
                            var unitcost = parseFloat(recordValue[j].unitCost)
                            if (amount < 0) {
                                amount = amount * -1
                            }
                            if (unitcost < 0) {
                                unitcost = unitcost * -1
                            }
                            // invRec.selectNewLine({ sublistId: "item" });

                            invRec.setSublistValue({ sublistId: "item", fieldId: "item", line: 0, value: parseInt(recordValue[j].itemId) });
                            invRec.setSublistValue({ sublistId: "item", fieldId: "quantity", line: 0, value: recordValue[j].Qty });
                            invRec.setSublistValue({ sublistId: "item", fieldId: "taxcode", line: 0, value: recordValue[j].taxcode });
                            invRec.setSublistValue({ sublistId: "item", fieldId: "rate", line: 0, value: unitcost });
                            invRec.setSublistValue({ sublistId: "item", fieldId: "amount", line: 0, value: amount });
                            invRec.setSublistValue({ sublistId: "item", fieldId: "custcolprocessed_split", line: 0, value: true });
                            invRec.setSublistValue({ sublistId: "item", fieldId: "custcol_neg_line_from_inv", line: 0, value: currentRec });

                            // invRec.commitLine({ sublistId: 'item' });

                            invRec.setValue({ fieldId: "custbody_invoice_negative_processed", value: true });

                            var invoiceId = invRec.save()
                            log.debug('invoice created Successfully invoiceId : ' + invoiceId)
                        }
                        catch (e) {
                            log.debug('error : ', e)
                        }



                    }
                    else {
                        log.debug('same posting period record found')

                        //Loading invoice record becaues same posting period record found
                        var invoiceRec = record.load({
                            'type': 'INVOICE',
                            'id': parseInt(currentInvId[0]),
                            'isDynamic': true,
                        })
                        //log.debug('record loaded successfuly')
                        //log.debug('recordValue', recordValue[j])
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
                            invoiceRec.setCurrentSublistValue({ sublistId: "item", fieldId: "custcol_neg_line_from_inv", value: currentRec });

                            invoiceRec.commitLine({ sublistId: 'item' });

                            invoiceRec.setValue({ fieldId: "custbody_invoice_negative_processed", value: true });

                            try {

                                var invoiceId = invoiceRec.save()
                            }
                            catch (e) {
                                log.debug('error : ', e)
                            }

                            log.debug('invoice saved Successfully invoiceId : ' + invoiceId)
                            // log.debug('invoice saved Successfully')

                        }
                        catch (e) {
                            log.debug('error : ', e)
                        }

                    }
                } else {
                    log.debug("Cant create inv because subsidiary of cust dosnt match with item subsidiary")
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
                    var withAccID = subscriptionLineRec.getValue({ 'fieldId': 'custrecord_subsline_withacc' });

                    // log.debug("withAccID: ", withAccID);
                    var customerFields = search.lookupFields({
                        type: "customer",
                        id: withAccID,
                        columns: ['subsidiary']
                    });
                    var itemType = "noninventoryitem"
                    if(itemId == 246){
                        itemType = "serviceitem"
                    }
                    var itemFields = search.lookupFields({
                        type: itemType,
                        id: itemId,
                        columns: ['subsidiary']
                    });
        
                    log.debug("customerFields.subsidiary : ", customerFields.subsidiary);
                    log.debug("itemFields.subsidiary ", itemFields.subsidiary);

                    var CreateInv = true;
                    if (customerFields.subsidiary[0].value == itemFields.subsidiary[0].value) CreateInv = false;
                    log.debug("create Inv : ", CreateInv)


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

                    //log.debug('calculationCap : ' + calculationCap)
                    var calculatedValue = calculation(calc_method, discountRateCap, pb_per, pb_amount, Qty, rate, amount, stdRate, calculationCap, discountPercent)
                    log.debug('calculatedValue : ' , calculatedValue);

                    setValue(i, itemId, processed, Qty, calculatedValue.split, calculatedValue.unitCost, newRecord, CreateInv)

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

            var cal_per = pb_per;
            if(pb_per === ""){
                cal_per = "Each"
            }
            log.debug("cal_per" , cal_per)
            if (calc_method == 'Flat') {
                if (cal_per == "Total") {
                    split = pb_amount * -1
                    unitCost = (split / Qty)
                } else if (cal_per == "Each") {
                    split = Qty * pb_amount * -1
                    unitCost = (split / Qty)
                }
            }
            else {
                var maxQty = Qty;
                if (calculationCap != 0) {
                    if (calculationCap !== "") {
                        log.debug("calculation cap is not empty nor 0")
                        if (Qty >= calculationCap) {
                            maxQty = calculationCap
                        } else {
                            maxQty = Qty
                        }
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

        function setValue(i, itemId, processed, Qty, split, unitCost, newRecord, createInv) {
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
                    newRecord.setSublistValue({ sublistId: "item", fieldId: "custcol_inv_created", line: l, value: createInv });
                    log.debug('unit : ' + unitCost)
                    log.debug('split : ' + split)
                    log.debug("Negative line created successfully")
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




