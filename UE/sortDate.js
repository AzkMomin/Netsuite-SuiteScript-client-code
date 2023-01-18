/**
 *
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */

define(['N/record', 'N/search'], function (record, search) {
    function afterSubmit(context) {

        if (context.type == 'edit' || context.type == context.UserEventType.CREATE) {

            var sfs_opp = context.newRecord;
            var sfs_oppId = context.newRecord.id;
            log.debug('Id : ', sfs_oppId)
            var opportunityStartDate = sfs_opp.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_start_date' });
            var subscriptionId = sfs_opp.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_ns_sub_id' });
            //Code for price plan
            // try {
                var OppLineIds = getOppLineIds(sfs_oppId)
                OppLineIds.forEach((result) => {


                    var sfs_oppLineRecord = record.load({
                        'type': 'customrecord_sc_sfs_opportunity_line',
                        'id': result
                    })
                    var productId = sfs_oppLineRecord.getValue({
                        'fieldId': 'custrecord_sc_sfs_opp_line_item_id',
                    })
                    log.debug('productId : ', productId)
                    if (productId == 416 || productId == 414 || productId == 246 || productId == 419) {

                        var standardRate = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_rate' })

                        //this field of discount would have percent value, so we would have to calculate its rate
                        var discountPercent = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_disc' })
                        var discountRate = 0
                        if (discountPercent != "" || discountPercent != null) {
                            discountRate = parseFloat((standardRate * (100 - discountPercent)) / 100);
                        }

                        var quantity = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_qty' })
                        var discountRateCap = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecordcustrecord_sc_sfs_opp_line_dis' })
                        var withAccount = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_calc_act' })
                        var calcCap = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_calc_cap' })
                        var calcAmt = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_calc_amt' })
                        var calcMethod = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_calc_meth' })
                        var calcPer = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_calc_per' })
                        var pbAmount = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_bp_amount' })
                        var calculation = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_calc' })
                        var stdRate = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_rate' })
                        var calCapByOtherProduct = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_calc_cap_prod' })
                        var prodPriceCap = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_prd_price_cap' })

                        if (discountRate == '' || discountRate == null) {
                            discountRate = 0
                        }
                        if (standardRate == "" || standardRate == null) {
                            standardRate = 0
                        }
                        if (discountRateCap == "" || discountRateCap == null) {
                            discountRateCap = 0
                        }



                        var subscriptionRecord = record.load({
                            'type': 'subscription',
                            'id': subscriptionId,
                            'isDynamic': true,
                        })

                        //forward fields from Opportunity line to subscription line here
                        var subscriptionLineItemsCount = subscriptionRecord.getLineCount({
                            'sublistId': 'subscriptionline',
                        })

                        for (var l = 0; l < subscriptionLineItemsCount; l++) {
                            var subscriptionLineId = subscriptionRecord.getSublistValue({
                                'sublistId': 'subscriptionline',
                                'fieldId': 'subscriptionline',
                                'line': l,
                            })

                            var subscriptionLineItemId = subscriptionRecord.getSublistValue({
                                'sublistId': 'subscriptionline',
                                'fieldId': 'item',
                                'line': l,
                            })
                            // log.debug('subscriptionLineItemId : ' + subscriptionLineItemId)
                            // log.debug('productId : ' + productId)


                            if (productId == subscriptionLineItemId) {

                                //updating line items only for the ones which match with the validProductIds we're iterating
                                try {


                                    var subscriptionLineRecord = record.load({
                                        'type': 'subscriptionLine',
                                        'id': subscriptionLineId,
                                        'isDynamic': true,
                                    })

                                    //log.debug('subscriptionLineId : ' + subscriptionLineId)

                                    subscriptionLineRecord.setValue({
                                        'fieldId': 'custrecord_subsline_withacc',
                                        'value': withAccount
                                    })
                                    subscriptionLineRecord.setValue({
                                        'fieldId': 'custrecord_subsline_calc_cap',
                                        'value': calcCap
                                    })
                                    subscriptionLineRecord.setValue({
                                        'fieldId': 'custrecord_subsline_cal_amt',
                                        'value': calcAmt
                                    })
                                    subscriptionLineRecord.setValue({
                                        'fieldId': 'custrecord_subsline_cal_method',
                                        'value': calcMethod
                                    })
                                    subscriptionLineRecord.setValue({
                                        'fieldId': 'custrecord_subsline_cal_per',
                                        'value': calcPer
                                    })
                                    subscriptionLineRecord.setValue({
                                        'fieldId': 'custrecord_subsline_disc_r_cap',
                                        'value': discountRateCap
                                    })
                                    subscriptionLineRecord.setValue({
                                        'fieldId': 'custrecord_subsline_disc_rate',
                                        'value': discountPercent
                                    })
                                    subscriptionLineRecord.setValue({
                                        'fieldId': 'custrecord_subsline_bp_amount',
                                        'value': pbAmount
                                    })
                                    subscriptionLineRecord.setValue({
                                        'fieldId': 'custrecord_subsline_quantity',
                                        'value': quantity
                                    })
                                    subscriptionLineRecord.setValue({
                                        'fieldId': 'custrecord_subsline_calculation',
                                        'value': calculation
                                    })

                                    subscriptionLineRecord.setValue({
                                        'fieldId': 'custrecord_subline_rate',
                                        'value': stdRate
                                    })
                                    subscriptionLineRecord.setValue({
                                        'fieldId': 'custrecord_subsline_cal_cap_by_otherprod',
                                        'value': calCapByOtherProduct
                                    })
                                    subscriptionLineRecord.setValue({
                                        'fieldId': 'custrecord_subsline_prd_price_cap',
                                        'value': prodPriceCap
                                    })
                                    var subLineRecSaved = subscriptionLineRecord.save()
                                    log.debug('Forwarding Custom fields from Opportunity line to Subscription Line for the following id :: ', subLineRecSaved)
                                } catch (e) {
                                    log.debug('Cannot Submit SubscriptionLine Record Due to :: ', e)
                                }

                            }
                        }
                    }

                })
                var itemOppLineValues = []
                OppLineIds.forEach((oppLineId) => {
                    var sfs_oppLineRecord = record.load({
                        'type': 'customrecord_sc_sfs_opportunity_line',
                        'id': oppLineId
                    })
                    var productId = sfs_oppLineRecord.getValue({
                        'fieldId': 'custrecord_sc_sfs_opp_line_item_id',
                    })

                    if (productId == 416 || productId == 414 || productId == 246 || productId == 419) {
                        // log.debug('productId : ' + productId)


                        var subscriptionRecord = record.load({
                            'type': 'subscription',
                            'id': subscriptionId,
                            'isDynamic': true,
                        })


                        var pricingLineItemsCount = subscriptionRecord.getLineCount({
                            'sublistId': 'priceinterval',
                        })
                        //load subscription line items and match the item id from the opportunity item ids
                        // log.debug('pricingLineItemsCount : ' + pricingLineItemsCount)

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
                            // log.debug('itemId : ' + itemId)


                            var itemStartDate = new Date(pricingItemstartDate);
                            var itemStartDayOfMonth = itemStartDate.getDate();
                            var itemStartMonth = itemStartDate.getMonth();
                            var itemStartYear = itemStartDate.getFullYear();
                            var itemDateString = (itemStartMonth + 1) + "/" + itemStartDayOfMonth + "/" + itemStartYear;
                            // log.debug('itemDateString : ' + itemDateString)
                            //Getting previous date from our opportunity start date
                            var letestPricePlanDate = getletestPricePlanDate(sfs_opp, productId)
                            // log.debug('letestPricePlanDate : ' + letestPricePlanDate)

                            //if (letestPricePlanDate != null) {
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

                                //log.debug('pricePlanRecordLineItemsCount: ', pricePlanRecordLineItemsCount)
                                var oppValues = oppLineValues(oppLineId)

                                itemOppLineValues.push({
                                    'productId': productId,
                                    'discRate': oppValues.discountRate,
                                    'stanRate': oppValues.standardRate,
                                    'discRateCap': oppValues.discountRateCap,
                                    'discPercent': oppValues.discountPercent,
                                    'quantity': oppValues.quantity,
                                    'productPriceCap': oppValues.productPriceCap,
                                })
                            }


                        }
                    }
                })
                // log.debug('itemOppLineValues : ', itemOppLineValues)
                log.debug('OppLineIds : ', OppLineIds)
                var flag = true
                OppLineIds.forEach((result) => {
                    var sfs_oppLineRecord = record.load({
                        'type': 'customrecord_sc_sfs_opportunity_line',
                        'id': result
                    })
                    var productId = sfs_oppLineRecord.getValue({
                        'fieldId': 'custrecord_sc_sfs_opp_line_item_id',
                    })
                    if (flag === true) {


                        if (productId == 416 || productId == 414 || productId == 246 || productId == 419) {
                            flag = false

                            // log.debug('productId : ' + productId)

                            var subscriptionRecord = record.load({
                                'type': 'subscription',
                                'id': subscriptionId,
                                'isDynamic': true,
                            })


                            var pricingLineItemsCount = subscriptionRecord.getLineCount({
                                'sublistId': 'priceinterval',
                            })
                            //load subscription line items and match the item id from the opportunity item ids
                            // log.debug('pricingLineItemsCount : ' + pricingLineItemsCount)
                            var subFlag = true
                            for (var j = 0; j < pricingLineItemsCount; j++) {

                                if (subFlag === true) {
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

                                    // log.debug('itemId : ' + itemId)


                                    var itemStartDate = new Date(pricingItemstartDate);
                                    var itemStartDayOfMonth = itemStartDate.getDate();
                                    var itemStartMonth = itemStartDate.getMonth();
                                    var itemStartYear = itemStartDate.getFullYear();
                                    var itemDateString = (itemStartMonth + 1) + "/" + itemStartDayOfMonth + "/" + itemStartYear;
                                    // log.debug('itemDateString : ' + itemDateString)
                                    //Getting previous date from our opportunity start date
                                    var letestPricePlanDate = getletestPricePlanDate(sfs_opp, productId)
                                    // log.debug('letestPricePlanDate : ' + letestPricePlanDate)


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

                                        var oppValues = oppLineValues(result)
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
                                                        changeOrder.setSublistValue({
                                                            sublistId: 'subline',
                                                            fieldId: 'quantitynew',
                                                            line: i,
                                                            value: itemOppLineValues[j].quantity
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
                                                            var maxAmt = itemOppLineValues[j].productPriceCap
                                                            for (var m = 0; m < 1; m++) {
                                                                setTier(m, fromVal, value, pricePlanRec, maxAmt)
                                                            }
                                                        }
                                                        else if (itemOppLineValues[j].discRateCap == "") {
                                                            var fromVal = 0
                                                            var value = itemOppLineValues[j].stanRate
                                                            var maxAmt = itemOppLineValues[j].productPriceCap
                                                            for (var m = 0; m < 1; m++) {
                                                                setTier(m, fromVal, value, pricePlanRec, maxAmt)
                                                            }
                                                        }
                                                        else {
                                                            if (itemOppLineValues[j].quantity > itemOppLineValues[j].discRateCap) {

                                                                var fromVal = 0
                                                                var value = itemOppLineValues[j].discRate
                                                                var maxAmt = ''
                                                                for (var m = 0; m < 2; m++) {
                                                                    setTier(m, fromVal, value, pricePlanRec, maxAmt)

                                                                    fromVal = itemOppLineValues[j].discRateCap
                                                                    value = itemOppLineValues[j].stanRate
                                                                    maxAmt = parseInt(itemOppLineValues[j].productPriceCap) - (itemOppLineValues[j].discRate * itemOppLineValues[j].discRateCap)
                                                                }

                                                            }
                                                            else if (itemOppLineValues[j].quantity < itemOppLineValues[j].discRateCap) {
                                                                var fromVal = 0
                                                                var value = oppValues.discountRate
                                                                var maxAmt = itemOppLineValues[j].productPriceCap
                                                                for (var m = 0; m < 1; m++) {
                                                                    setTier(m, fromVal, value, pricePlanRec, maxAmt)
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

                                            var qty = subscriptionRecord.getSublistValue({
                                                'sublistId': 'priceinterval',
                                                'fieldId': 'quantity',
                                                'line': j,
                                            })


                                            var pricingLineItemsCount = subscriptionRecord.getLineCount({
                                                'sublistId': 'priceinterval',
                                            })
                                            //load subscription line items and match the item id from the opportunity item ids
                                            //log.debug('pricingLineItemsCount : ' + pricingLineItemsCount)
                                            var isUpdated = true

                                            if (isUpdated == true) {
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



                                                var itemStartDate = new Date(pricingItemstartDate);
                                                var itemStartDayOfMonth = itemStartDate.getDate();
                                                var itemStartMonth = itemStartDate.getMonth();
                                                var itemStartYear = itemStartDate.getFullYear();
                                                var itemDateString = (itemStartMonth + 1) + "/" + itemStartDayOfMonth + "/" + itemStartYear;
                                                //log.debug('itemDateString : ' + itemDateString  )
                                                //Getting previous date from our opportunity start date
                                                var letestPricePlanDate = getletestPricePlanDate(sfs_opp, productId)



                                                if (itemId == productId && itemDateString == letestPricePlanDate) {
                                                    //log.debug('itemId : ' + itemId)
                                                    //log.debug('productId : ' + productId)




                                                    // log.debug('pricePlanRecordLineItemsCount: ', pricePlanRecordLineItemsCount)
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
                                                    var itemUpdated = false
                                                    for (var i = 0; i < numLines; i++) {
                                                        var changeOrderLineItem = changeOrder.getSublistValue({ sublistId: 'subline', fieldId: 'item', line: i });
                                                        for (var j = 0; j < itemOppLineValues.length; j++) {
                                                            if (changeOrderLineItem == itemOppLineValues[j].productId && qty != itemOppLineValues[j].quantity) {
                                                                log.debug('quantity update needed')


                                                                changeOrder.setSublistValue({
                                                                    sublistId: 'subline',
                                                                    line: i,
                                                                    fieldId: 'apply',
                                                                    value: true
                                                                });
                                                                changeOrder.setSublistValue({
                                                                    sublistId: 'subline',
                                                                    fieldId: 'quantitynew',
                                                                    line: i,
                                                                    value: itemOppLineValues[j].quantity
                                                                });

                                                                isUpdated = true

                                                            }
                                                        }

                                                    }

                                                    if (itemUpdated) {

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
                                                    } else (
                                                        log.debug('Dont need any update')

                                                    )
                                                    subFlag = false
                                                }
                                            }

                                            isUpdated = false
                                        }
                                    }
                                }
                            }
                        }
                    }
                })
                // log.debug('itemOppLineValues : ', itemOppLineValues)


            // }
            // catch (e) {
            //     log.debug({
            //         title: 'error',
            //         details: e
            //     })
            // }
        }
    }

    function getOppLineIds(sfs_oppId) {
        var ids = []
        const customrecord_sc_sfs_opportunity_lineSearchColInternalId = search.createColumn({ name: 'internalid' });
        const customrecord_sc_sfs_opportunity_lineSearchColOpportunityParent = search.createColumn({ name: 'custrecord_sc_sfs_opp_line_par_opp' });
        const customrecord_sc_sfs_opportunity_lineSearchColItemId = search.createColumn({ name: 'custrecord_sc_sfs_opp_line_item_id' });

        const customrecord_sc_sfs_opportunity_lineSearch = search.create({
            type: 'customrecord_sc_sfs_opportunity_line',
            filters: [
                ['custrecord_sc_sfs_opp_line_par_opp', 'anyof', sfs_oppId],
            ],
            columns: [
                customrecord_sc_sfs_opportunity_lineSearchColInternalId,
                customrecord_sc_sfs_opportunity_lineSearchColOpportunityParent,
                customrecord_sc_sfs_opportunity_lineSearchColItemId,

            ],
        });

        const customrecord_sc_sfs_opportunity_lineSearchPagedData = customrecord_sc_sfs_opportunity_lineSearch.runPaged({ pageSize: 1000 });
        for (let i = 0; i < customrecord_sc_sfs_opportunity_lineSearchPagedData.pageRanges.length; i++) {
            const customrecord_sc_sfs_opportunity_lineSearchPage = customrecord_sc_sfs_opportunity_lineSearchPagedData.fetch({ index: i });
            customrecord_sc_sfs_opportunity_lineSearchPage.data.forEach((result) => {
                const internalId = result.getValue(customrecord_sc_sfs_opportunity_lineSearchColInternalId);
                const opportunityParent = result.getValue(customrecord_sc_sfs_opportunity_lineSearchColOpportunityParent);

                ids.push(internalId)
            });
        }
        return ids
    }
    // functio for getting letest previous date
    function getletestPricePlanDate(sfs_opp, itemId) {

        var subscriptionId = sfs_opp.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_ns_sub_id' });
        var effectiveDate = sfs_opp.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_start_date' });

        // log.debug('subscriptionId : ' , subscriptionId)
        // log.debug('effectiveDate : ' , effectiveDate)
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
        var tollManagementDates = []
        var telematicsDates = []
        for (var s = 0; s < pricingLineItemsCount; s++) {
            var ItemId = subscriptionRecord.getSublistValue({
                'sublistId': 'priceinterval',
                'fieldId': 'item',
                'line': s,
            })
            if (ItemId == 416 || ItemId == 414 || ItemId == 246 || ItemId == 419) {
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
                else if (ItemId == 246) {
                    if (effectiveStartYear > currentStartYear) {

                        connectedCarDates.push(StartDateString)
                    } else if (effectiveStartYear == currentStartYear) {
                        if (effectiveStartMonth > currentStartMonth) {
                            //log.debug('year == current year but startMonh > current startMonth : ')
                            connectedCarDates.push(StartDateString)

                        } else if (effectiveStartMonth == currentStartMonth) {
                            if (effectiveStartDayOfMonth > currentStartDayOfMonth) {
                                //log.debug('day check ')
                                tollManagementDates.push(StartDateString)
                            }
                        }
                    }
                }
                else if (ItemId == 419) {
                    if (effectiveStartYear > currentStartYear) {

                        connectedCarDates.push(StartDateString)
                    } else if (effectiveStartYear == currentStartYear) {
                        if (effectiveStartMonth > currentStartMonth) {
                            //log.debug('year == current year but startMonh > current startMonth : ')
                            connectedCarDates.push(StartDateString)

                        } else if (effectiveStartMonth == currentStartMonth) {
                            if (effectiveStartDayOfMonth > currentStartDayOfMonth) {
                                //log.debug('day check ')
                                telematicsDates.push(StartDateString)
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
        tollManagementDates.sort(function (a, b) {
            return a - b
        });
        tollManagementDates.reverse()
        telematicsDates.sort(function (a, b) {
            return a - b
        });
        telematicsDates.reverse()
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
        else if (itemId == 246) {
            if (tollManagementDates.length == 0) {
                return null
            }
            else {
                return tollManagementDates[0]
            }
        }
        else if (itemId == 419) {
            if (telematicsDates.length == 0) {
                return null
            }
            else {
                return telematicsDates[0]
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
        var productPriceCap = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_prd_price_cap' })
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

        oppLineData['discountPercent'] = discountPercent;
        oppLineData['discountRateCap'] = discountRateCap;
        oppLineData['standardRate'] = standardRate;
        oppLineData['discountRate'] = discountRate;
        oppLineData['quantity'] = quantity;
        oppLineData['productPriceCap'] = productPriceCap;

        return oppLineData
    }
    function setTier(m, fromVal, value, pricePlanRec, maxAmt) {
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
        pricePlanRec.setCurrentSublistValue({
            sublistId: 'pricetiers',
            fieldId: 'maxamount',
            value: maxAmt
        });

        pricePlanRec.commitLine({
            sublistId: 'pricetiers'
        });
    }

    function comparePricePlans(oldPricePlanRecord, oldPricePlanLineCount, newPricePlanData) {
        var newPricePlan = []
        var oldPricePlan = []
        log.debug('newPricePlanData : ', newPricePlanData)
        log.debug('oldPricePlanLineCount : ', oldPricePlanLineCount)

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
                    'value': parseFloat(newPricePlanData.stanRate)
                })
            } else {

                newPricePlan.push({
                    'fromval': 0,
                    'value': parseFloat(newPricePlanData.stanRate)
                })
            }
        } else {
            //discount rate not found, check only for standard rate
            newPricePlan.push({
                'fromval': 0,
                'value': parseFloat(newPricePlanData.stanRate)
            })
        }

        log.debug('old price plan : ', oldPricePlan)
        log.debug('new price plan : ', newPricePlan)
        //iterate oldPricePlanRecord and generate a newPricePlan like structure to compare them
        if (oldPricePlanLineCount == 1) {
            for (var k = 0; k < oldPricePlanLineCount; k++) {
                var fromval = oldPricePlanRecord.getSublistValue({
                    'sublistId': 'pricetiers',
                    'fieldId': 'fromval',
                    'line': k,
                })

                log.debug('From Val: ' + fromval + ' : k: ' + k);

                var value = oldPricePlanRecord.getSublistValue({
                    'sublistId': 'pricetiers',
                    'fieldId': 'value',
                    'line': k,
                })

                log.debug('Val: ' + value + ' : k: ' + k);

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
                        'fromval': fromval,
                        'value': value
                    })
                }


            }
        }

        //compare oldPricePlan and newPricePlan
        var fromValDiff = getDifference(newPricePlan, oldPricePlan, 'fromval')
        var valueDiff = getDifference(newPricePlan, oldPricePlan, 'value')

        if (fromValDiff.length > 0 || valueDiff.length > 0) {
            // log.debug('Old Price Plan : ', oldPricePlan)
            // log.debug('New Price Plan : ', newPricePlan)
            // log.debug('From Value Diff : ', fromValDiff)
            // log.debug('Value Diff : ', valueDiff)
            // log.debug('Price Plan difference found. Requires Change order creation')
            // diff found, send true because update is required
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