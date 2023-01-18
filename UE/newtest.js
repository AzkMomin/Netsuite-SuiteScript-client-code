/**
 *
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */

 define(['N/record'], function (record) {
    function afterSubmit(context) {
        if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
            var sfs_opp = context.newRecord;

            var sfs_oppIdLIneCount = sfs_opp.getLineCount({
                'sublistId': 'recmachcustrecord_sc_sfs_opp_line_par_opp',
            })


            //Code for price plan
            var subscriptionId = sfs_opp.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_ns_sub_id' });
            var opportunityStartDate = sfs_opp.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_start_date' });
            var sfs_oppIdLIneCount = sfs_opp.getLineCount({
                'sublistId': 'recmachcustrecord_sc_sfs_opp_line_par_opp',
            })

            var itemOppLineValues = []
            for (var i = 0; i < sfs_oppIdLIneCount; i++) {


                log.debug('loop : ' + i)
                var productId = sfs_opp.getSublistValue({
                    'sublistId': 'recmachcustrecord_sc_sfs_opp_line_par_opp',
                    'fieldId': 'custrecord_sc_sfs_opp_line_item_id',
                    'line': i,
                })

                if (productId == 416 || productId == 414) {
                    var sfs_oppLineId = sfs_opp.getSublistValue({
                        'sublistId': 'recmachcustrecord_sc_sfs_opp_line_par_opp',
                        'fieldId': 'id',
                        'line': i,
                    })
                    log.debug('productId : ' + productId)

                    var subscriptionRecord = record.load({
                        'type': 'subscription',
                        'id': subscriptionId,
                        'isDynamic': true,
                    })


                    var pricingLineItemsCount = subscriptionRecord.getLineCount({
                        'sublistId': 'priceinterval',
                    })
                    //load subscription line items and match the item id from the opportunity item ids
                    //log.debug('pricingLineItemsCount : ' + pricingLineItemsCount)

                    for (var j = 0; j < pricingLineItemsCount; j++) {
                        var itemId = subscriptionRecord.getSublistValue({
                            'sublistId': 'priceinterval',
                            'fieldId': 'item',
                            'line': j,
                        })
                        var pricingItemstartDate = subscriptionRecord.getSublistValue({
                            'sublistId': 'priceinterval',
                            'fieldId': 'startdate',
                            'line': j,
                        })
                        //log.debug('itemId : ' + itemId)


                        var itemStartDate = new Date(pricingItemstartDate);
                        var itemStartDayOfMonth = itemStartDate.getDate();
                        var itemStartMonth = itemStartDate.getMonth();
                        var itemStartYear = itemStartDate.getFullYear();
                        var itemDateString = (itemStartMonth + 1) + "/" + itemStartDayOfMonth + "/" + itemStartYear;
                        //log.debug('itemDateString : ' + itemDateString  )
                        //Getting previous date from our opportunity start date
                        var letestPricePlanDate = getletestPricePlanDate(sfs_opp, productId)
                        //log.debug('letestPricePlanDate : ' + letestPricePlanDate)

                        //if (letestPricePlanDate != null) {
                        if (itemId == productId && itemDateString == letestPricePlanDate) {

                            //found valid product
                            var pricePlanId = subscriptionRecord.getSublistValue({
                                'sublistId': 'priceinterval',
                                'fieldId': 'priceplan',
                                'line': j,
                            })
                            //log.debug('Price Plan Id: ', pricePlanId)

                            var pricePlanRecord = record.load({
                                type: 'priceplan',
                                id: pricePlanId,
                            })
                            //log.debug('Price Plan Record: ', pricePlanRecord)
                            var pricePlanRecordLineItemsCount = pricePlanRecord.getLineCount({
                                'sublistId': 'pricetiers',
                            })

                            //log.debug('pricePlanRecordLineItemsCount: ', pricePlanRecordLineItemsCount)
                            var oppValues = oppLineValues(sfs_oppLineId)
                            //log.debug('oppValues: ', oppValues)
                            var pricePlanData = comparePricePlans(pricePlanRecord, pricePlanRecordLineItemsCount, {
                                discRate: oppValues.discountRate,
                                stanRate: oppValues.standardRate,
                                discRateCap: oppValues.discountRateCap,
                                discPercent: oppValues.discountPercent,

                            })

                            if (pricePlanData.updateNeeded) {
                                log.debug('needed')


                                itemOppLineValues.push({
                                    'productId': productId,
                                    'discRate': oppValues.discountRate,
                                    'stanRate': oppValues.standardRate,
                                    'discRateCap': oppValues.discountRateCap,
                                    'discPercent': oppValues.discountPercent,
                                    'quantity': oppValues.quantity
                                })



                            }
                            else {
                                log.debug('not needed')
                            }

                        }


                    }
                }
            }
			var flag = true
            for (var i = 0; i < sfs_oppIdLIneCount; i++) {
                log.debug('loop : ' + i)
                
                if (flag == true) {
                    var productId = sfs_opp.getSublistValue({
                        'sublistId': 'recmachcustrecord_sc_sfs_opp_line_par_opp',
                        'fieldId': 'custrecord_sc_sfs_opp_line_item_id',
                        'line': i,
                    })

                    if (productId == 416 || productId == 414) {
                        flag = false
                        var sfs_oppLineId = sfs_opp.getSublistValue({
                            'sublistId': 'recmachcustrecord_sc_sfs_opp_line_par_opp',
                            'fieldId': 'id',
                            'line': i,
                        })
                        log.debug('productId : ' + productId)

                        var subscriptionRecord = record.load({
                            'type': 'subscription',
                            'id': subscriptionId,
                            'isDynamic': true,
                        })


                        var pricingLineItemsCount = subscriptionRecord.getLineCount({
                            'sublistId': 'priceinterval',
                        })
                        //load subscription line items and match the item id from the opportunity item ids
                        //log.debug('pricingLineItemsCount : ' + pricingLineItemsCount)
						 var subFlag = true
                        for (var j = 0; j < pricingLineItemsCount; j++) {
                           
                            if (subFlag == true) {
                                var itemId = subscriptionRecord.getSublistValue({
                                    'sublistId': 'priceinterval',
                                    'fieldId': 'item',
                                    'line': j,
                                })
                                var pricingItemstartDate = subscriptionRecord.getSublistValue({
                                    'sublistId': 'priceinterval',
                                    'fieldId': 'startdate',
                                    'line': j,
                                })
                                //log.debug('itemId : ' + itemId)


                                var itemStartDate = new Date(pricingItemstartDate);
                                var itemStartDayOfMonth = itemStartDate.getDate();
                                var itemStartMonth = itemStartDate.getMonth();
                                var itemStartYear = itemStartDate.getFullYear();
                                var itemDateString = (itemStartMonth + 1) + "/" + itemStartDayOfMonth + "/" + itemStartYear;
                                //log.debug('itemDateString : ' + itemDateString  )
                                //Getting previous date from our opportunity start date
                                var letestPricePlanDate = getletestPricePlanDate(sfs_opp, productId)



                                if (itemId == productId && itemDateString == letestPricePlanDate) {

                                    //found valid product
                                    var pricePlanId = subscriptionRecord.getSublistValue({
                                        'sublistId': 'priceinterval',
                                        'fieldId': 'priceplan',
                                        'line': j,
                                    })
                                    log.debug('Price Plan Id: ', pricePlanId)

                                    var pricePlanRecord = record.load({
                                        type: 'priceplan',
                                        id: pricePlanId,
                                    })
                                    //log.debug('Price Plan Record: ', pricePlanRecord)
                                    var pricePlanRecordLineItemsCount = pricePlanRecord.getLineCount({
                                        'sublistId': 'pricetiers',
                                    })

                                    var oppValues = oppLineValues(sfs_oppLineId)
                                    //log.debug('oppValues: ', oppValues)
                                    var pricePlanData = comparePricePlans(pricePlanRecord, pricePlanRecordLineItemsCount, {
                                        discRate: oppValues.discountRate,
                                        stanRate: oppValues.standardRate,
                                        discRateCap: oppValues.discountRateCap,
                                        discPercent: oppValues.discountPercent,

                                    })
                                    if (pricePlanData.updateNeeded) {
                                        log.debug('needed')


                                        //log.debug('pricePlanRecordLineItemsCount: ', pricePlanRecordLineItemsCount)
                                        var changeOrder = record.create({
                                            type: record.Type.SUBSCRIPTION_CHANGE_ORDER,
                                            isDynamic: false,
                                            defaultValues: {
                                                action: "MODIFY_PRICING",
                                                subscription: subscriptionId
                                            }
                                        });

                                        // First setting the effective date which is start date of opportunity                                    
                                        changeOrder.setValue({
                                            fieldId: 'effectivedate',
                                            value: new Date(opportunityStartDate),
                                            ignoreFieldChange: false
                                        });


                                        var numLines = changeOrder.getLineCount({ sublistId: 'subline' });

                                        for (var i = 0; i < numLines; i++) {
                                            var changeOrderLineItem = changeOrder.getSublistValue({ sublistId: 'subline', fieldId: 'item', line: i });
                                            for (var j = 0; j < itemOppLineValues.length; j++) {
                                                if (changeOrderLineItem == itemOppLineValues[j].productId) {


                                                    changeOrder.setSublistValue({
                                                        sublistId: 'subline',
                                                        line: i,
                                                        fieldId: 'apply',
                                                        value: true
                                                    });


                                                    var opportunityCurrency = sfs_opp.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_currency' });

                                                    // Creating new price plan
                                                    var pricePlanRec = record.create({
                                                        type: record.Type.PRICE_PLAN,
                                                        isDynamic: true
                                                    });

                                                    pricePlanRec.setValue({
                                                        fieldId: 'currency',
                                                        value: opportunityCurrency
                                                    });

                                                    pricePlanRec.setValue({
                                                        fieldId: 'priceplantype',
                                                        value: 2
                                                    });


                                                    if (itemOppLineValues[j].discPercent == '' || itemOppLineValues[j].discPercent == null || itemOppLineValues[j].discPercent == 0) {
                                                        var fromVal = 0
                                                        var value = itemOppLineValues[j].stanRate
                                                        for (var m = 0; m < 1; m++) {
                                                            setTier(m, fromVal, value, pricePlanRec)
                                                        }
                                                    }
                                                    else {
                                                        if (itemOppLineValues[j].quantity > itemOppLineValues[j].discRateCap) {

                                                            var fromVal = 0
                                                            var value = itemOppLineValues[j].discRate
                                                            for (var m = 0; m < 2; m++) {
                                                                setTier(m, fromVal, value, pricePlanRec)

                                                                fromVal = itemOppLineValues[j].discRateCap + 1
                                                                value = itemOppLineValues[j].stanRate
                                                            }

                                                        }
                                                        else if (itemOppLineValues[j].quantity < itemOppLineValues[j].discRateCap) {
                                                            var fromVal = 0
                                                            var value = oppValues.discountRate
                                                            for (var m = 0; m < 1; m++) {
                                                                setTier(m, fromVal, value, pricePlanRec)
                                                            }
                                                        }

                                                    }
                                                    var pricePlanID = pricePlanRec.save();

                                                    changeOrder.setSublistValue({
                                                        sublistId: 'subline',
                                                        fieldId: 'priceplannew',
                                                        line: i,
                                                        value: pricePlanID
                                                    })
                                                }
                                            }
                                        }
                                        var changeOrderID = changeOrder.save();

                                        record.submitFields({
                                            type: 'customrecord_sc_sfs_opportunity',
                                            id: sfs_opp.id,
                                            values: {
                                                'custrecord_sc_sfs_opp_ns_co_id': changeOrderID,
                                                'custrecord_sc_sfs_opp_ns_rec_created': true
                                            },
                                            options: {
                                                enableSourcing: false,
                                                ignoreMandatoryFields: true
                                            }
                                        });

                                        log.debug('changeOrder saved', changeOrderID);
                                        subFlag = false


                                    }
                                    else {
                                        log.debug('Not needed')
                                    }


                                }
                            }
                        }
                    }
                }
            }
            log.debug('itemOppLineValues : ', itemOppLineValues)
        }


    }


    // functio for getting letest previous date
    function getletestPricePlanDate(sfs_opp, itemId) {

        var subscriptionId = sfs_opp.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_ns_sub_id' });
        var effectiveDate = sfs_opp.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_start_date' });

        var effectiveStartDate = new Date(effectiveDate);
        var effectiveStartDayOfMonth = effectiveStartDate.getDate();
        var effectiveStartMonth = effectiveStartDate.getMonth();
        var effectiveStartYear = effectiveStartDate.getFullYear();
        var effectiveStartDateString = (effectiveStartMonth + 1) + "/" + effectiveStartDayOfMonth + "/" + effectiveStartYear;

        var subscriptionRecord = record.load({
            'type': 'subscription',
            'id': subscriptionId,
            'isDynamic': true,
        })

        //forward fields from Opportunity line to subscription line here
        var pricingLineItemsCount = subscriptionRecord.getLineCount({
            'sublistId': 'priceinterval',
        })

        //Array of dates
        var FleetDates = []
        var connectedCarDates = []
        for (var s = 0; s < pricingLineItemsCount; s++) {
            var ItemId = subscriptionRecord.getSublistValue({
                'sublistId': 'priceinterval',
                'fieldId': 'item',
                'line': s,
            })
            if (ItemId == 416 || ItemId == 414) {
                var startDate = subscriptionRecord.getSublistValue({
                    'sublistId': 'priceinterval',
                    'fieldId': 'startdate',
                    'line': s,
                })

                var currentStartDate = new Date(startDate);
                var currentStartDayOfMonth = currentStartDate.getDate();
                var currentStartMonth = currentStartDate.getMonth();
                var currentStartYear = currentStartDate.getFullYear();
                var StartDateString = (currentStartMonth + 1) + "/" + currentStartDayOfMonth + "/" + currentStartYear;

                // Checking for year then month day day
                if (ItemId == 416) {
                    if (effectiveStartYear > currentStartYear) {

                        FleetDates.push(StartDateString)
                    } else if (effectiveStartYear == currentStartYear) {
                        if (effectiveStartMonth > currentStartMonth) {
                            //log.debug('year == current year but startMonh > current startMonth : ')
                            FleetDates.push(StartDateString)

                        } else if (effectiveStartMonth == currentStartMonth) {
                            if (effectiveStartDayOfMonth > currentStartDayOfMonth) {
                                //log.debug('day check ')
                                FleetDates.push(StartDateString)
                            }
                        }
                    }
                }
                else if (ItemId == 414) {
                    if (effectiveStartYear > currentStartYear) {

                        connectedCarDates.push(StartDateString)
                    } else if (effectiveStartYear == currentStartYear) {
                        if (effectiveStartMonth > currentStartMonth) {
                            //log.debug('year == current year but startMonh > current startMonth : ')
                            connectedCarDates.push(StartDateString)

                        } else if (effectiveStartMonth == currentStartMonth) {
                            if (effectiveStartDayOfMonth > currentStartDayOfMonth) {
                                //log.debug('day check ')
                                connectedCarDates.push(StartDateString)
                            }
                        }
                    }
                }


            }


        }
        FleetDates.sort(function (a, b) {
            return a - b
        });
        FleetDates.reverse()
        connectedCarDates.sort(function (a, b) {
            return a - b
        });
        connectedCarDates.reverse()
        //log.debug('FleetDates : ' + FleetDates)
        //log.debug('connectedCarDates : ' + connectedCarDates)
        if (itemId == 416) {
            if (FleetDates.length == 0) {
                return null
            }
            else {
                return FleetDates[0]
            }
        }
        else if (itemId == 414) {
            if (connectedCarDates.length == 0) {
                return null
            }
            else {
                return connectedCarDates[0]
            }
        }
    }

    function oppLineValues(sfs_oppLineId) {
        var oppLineData = {}
        var sfs_oppLineRecord = record.load({
            'type': 'customrecord_sc_sfs_opportunity_line',
            'id': sfs_oppLineId
        })

        var discountPercent = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_disc' })
        var discountRateCap = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecordcustrecord_sc_sfs_opp_line_dis' })
        var standardRate = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_rate' })
        var quantity = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_qty' })
        var discountRate = 0
        if (discountPercent != "" || discountPercent != null) {
            discountRate = parseFloat((standardRate * (100 - discountPercent)) / 100);
        }

        if (discountRate == '' || discountRate == null) {
            discountRate = 0
        }
        if (standardRate == "" || standardRate == null) {
            standardRate = 0
        }
        if (discountRateCap == "" || discountRateCap == null) {
            discountRateCap = 0
        }
        // log.debug('discountPercent: ' + discountPercent)
        // log.debug('discountRateCap: ' + discountRateCap)
        // log.debug('standardRate: ' + standardRate)
        // log.debug('quantity: ' + quantity)
        // log.debug('discountRate: ' + discountRate)
        oppLineData['discountPercent'] = discountPercent;
        oppLineData['discountRateCap'] = discountRateCap;
        oppLineData['standardRate'] = standardRate;
        oppLineData['discountRate'] = discountRate;
        oppLineData['quantity'] = quantity;

        return oppLineData
    }
    function setTier(m, fromVal, value, pricePlanRec) {
        pricePlanRec.selectLine({
            sublistId: 'pricetiers',
            line: m
        });

        pricePlanRec.setCurrentSublistValue({
            sublistId: 'pricetiers',
            fieldId: 'fromval',
            value: fromVal
        });

        pricePlanRec.setCurrentSublistValue({
            sublistId: 'pricetiers',
            fieldId: 'pricingoption',
            value: '-101'
        });

        pricePlanRec.setCurrentSublistValue({
            sublistId: 'pricetiers',
            fieldId: 'value',
            value: value
        });

        pricePlanRec.commitLine({
            sublistId: 'pricetiers'
        });
    }

    function comparePricePlans(oldPricePlanRecord, oldPricePlanLineCount, newPricePlanData) {
        var newPricePlan = []
        var oldPricePlan = []


        if (newPricePlanData.discRate != 0 && newPricePlanData.discPercent != "") {
            if (newPricePlanData.discRateCap != 0) {
                // new price plan would always have 2 rows if we have discount rate and standard rate, else it will always have a single row

                // add discount rate row
                newPricePlan.push({
                    'fromval': 0,
                    'value': newPricePlanData.discRate,
                })

                newPricePlan.push({
                    'fromval': newPricePlanData.discRateCap,
                    'value': newPricePlanData.stanRate
                })
            }
        } else {
            //discount rate not found, check only for standard rate
            newPricePlan.push({
                'fromval': 0,
                'value': parseFloat(newPricePlanData.stanRate)
            })
        }

        //iterate oldPricePlanRecord and generate a newPricePlan like structure to compare them
        if (oldPricePlanLineCount == 1) {
            for (var k = 0; k < oldPricePlanLineCount; k++) {
                var fromval = oldPricePlanRecord.getSublistValue({
                    'sublistId': 'pricetiers',
                    'fieldId': 'fromval',
                    'line': k,
                })

                //log.debug('From Val: ' + fromval + ' : k: ' + k);

                var value = oldPricePlanRecord.getSublistValue({
                    'sublistId': 'pricetiers',
                    'fieldId': 'value',
                    'line': k,
                })

                //log.debug('Val: ' + value + ' : k: ' + k);

                oldPricePlan.push({
                    'fromval': fromval,
                    'value': value
                })
            }
        } else if (oldPricePlanLineCount == 2) {
            for (var k = 0; k < oldPricePlanLineCount; k++) {
                if (k == 0) {
                    var fromval = oldPricePlanRecord.getSublistValue({
                        'sublistId': 'pricetiers',
                        'fieldId': 'fromval',
                        'line': k,
                    })

                    //log.debug('From Val: ' + fromval + ' : k: ' + k);

                    var value = oldPricePlanRecord.getSublistValue({
                        'sublistId': 'pricetiers',
                        'fieldId': 'value',
                        'line': k,
                    })

                    //log.debug('Val: ' + value + ' : k: ' + k);

                    oldPricePlan.push({
                        'fromval': fromval,
                        'value': value
                    })
                }
                else if (k == 1) {
                    var fromval = oldPricePlanRecord.getSublistValue({
                        'sublistId': 'pricetiers',
                        'fieldId': 'fromval',
                        'line': k,
                    })

                    //log.debug('From Val: ' + fromval + ' : k: ' + k);

                    var value = oldPricePlanRecord.getSublistValue({
                        'sublistId': 'pricetiers',
                        'fieldId': 'value',
                        'line': k,
                    })

                    //log.debug('Val: ' + value + ' : k: ' + k);

                    oldPricePlan.push({
                        'fromval': fromval - 1,
                        'value': value
                    })
                }


            }
        }

        //compare oldPricePlan and newPricePlan
        var fromValDiff = getDifference(newPricePlan, oldPricePlan, 'fromval')
        var valueDiff = getDifference(newPricePlan, oldPricePlan, 'value')

        if (fromValDiff.length > 0 || valueDiff.length > 0) {
            //log.debug('Old Price Plan : ', oldPricePlan)
            //log.debug('New Price Plan : ', newPricePlan)
            //log.debug('From Value Diff : ', fromValDiff)
            //log.debug('Value Diff : ', valueDiff)
            //log.debug('Price Plan difference found. Requires Change order creation')
            //diff found, send true because update is required
            return { 'updateNeeded': true, 'newPricePlan': newPricePlan };
        } else {
            //same record, send false because no update is required
            return { 'updateNeeded': false, 'newPricePlan': newPricePlan };
        }
    }

    function getDifference(array1, array2, attr) {
        return array1.filter(function (object1) {
            return !array2.some(function (object2) {
                return eval("object1." + attr + " == object2." + attr);
            });
        });
    }

    function inArray(myArray, myValue) {
        var inArray = false;
        myArray.map(function (key) {
            if (key === myValue) {
                inArray = true;
            }
        });
        return inArray;
    };


    return {
        afterSubmit: afterSubmit
    }


})