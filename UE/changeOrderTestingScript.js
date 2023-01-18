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
            for (var i = 0; i < sfs_oppIdLIneCount; i++) {
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

                    var sfs_oppLineRecord = record.load({
                        'type': 'customrecord_sc_sfs_opportunity_line',
                        'id': sfs_oppLineId
                    })

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

                    if (discountRate == '' || discountRate == null) {
                        discountRate = 0
                    }
                    if (standardRate == "" || standardRate == null) {
                        standardRate = 0
                    }
                    if (discountRateCap == "" || discountRateCap == null) {
                        discountRateCap = 0
                    }

                    var subscriptionId = sfs_opp.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_ns_sub_id' });

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
                            log.debug('Forwarding Custom fields from Opportunity line to Subscription Line for the following id :: ', subscriptionLineId)
                            //updating line items only for the ones which match with the validProductIds we're iterating
                            try {

                                // log.debug('withAcc: ', withAccount);
                                // log.debug('calcCap: ', calcCap);
                                // log.debug('calcAmt: ', calcAmt);
                                // log.debug('calcMethod: ', calcMethod);
                                // log.debug('calcPer: ', calcPer);
                                // log.debug('pbAmount: ', pbAmount);

                                // log.debug('discountPercent: ', discountPercent);

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
                                subscriptionLineRecord.save()
                            } catch (e) {
                                log.debug('Cannot Submit SubscriptionLine Record Due to :: ', e)
                            }

                        }
                    }
                }
            }



            //Code for price plan
            var subscriptionId = sfs_opp.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_ns_sub_id' });
            var opportunityStartDate = sfs_opp.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_start_date' });
            var sfs_oppIdLIneCount = sfs_opp.getLineCount({
                'sublistId': 'recmachcustrecord_sc_sfs_opp_line_par_opp',
            })
            for (var i = 0; i < sfs_oppIdLIneCount; i++) {
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
                    log.debug('discountPercent: ', discountPercent)
                    log.debug('discountRateCap: ', discountRateCap)
                    log.debug('standardRate: ', standardRate)
                    log.debug('quantity: ', quantity)
                    log.debug('discountRate: ', discountRate)
                    var subscriptionRecord = record.load({
                        'type': 'subscription',
                        'id': subscriptionId,
                        'isDynamic': true,
                    })
                    //load subscription 
                    var pricingLineItemsCount = subscriptionRecord.getLineCount({
                        'sublistId': 'priceinterval',
                    })

                    for (var j = 0; j < pricingLineItemsCount; j++) {
                        var itemId = subscriptionRecord.getSublistValue({
                            'sublistId': 'priceinterval',
                            'fieldId': 'item',
                            'line': j,
                        })
                        if (itemId == productId) {
                            modifyPricePlan(subscriptionRecord, discountRate, discountRateCap, standardRate, quantity,itemId,sfs_opp)
                        }

                    }
                    for (var j = 0; j < pricingLineItemsCount; j++) {
                        var itemId = subscriptionRecord.getSublistValue({
                            'sublistId': 'priceinterval',
                            'fieldId': 'item',
                            'line': j,
                        })
                        if (itemId == productId) {
                            modifyPricePlan(subscriptionRecord, discountRate, discountRateCap, standardRate, quantity,itemId,sfs_opp)
                        }

                    }
                }
            }

        }

        function modifyPricePlan(subscriptionRecord, discountRate, discountRateCap, standardRate, quantity,itemId,sfs_opp) {


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


            //Change order

            var changeOrder = record.create({
                type: record.Type.SUBSCRIPTION_CHANGE_ORDER,
                isDynamic: false,
                defaultValues: {
                    action: "MODIFY_PRICING",
                    subscription: subscriptionId
                }
            });

            // First setting the effective date which is start date of opportunity  
            var opportunityStartDate = sfs_opp.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_start_date' });
            changeOrder.setValue({
                fieldId: 'effectivedate',
                value: new Date(opportunityStartDate),
                ignoreFieldChange: false
            });


            var numLines = changeOrder.getLineCount({ sublistId: 'subline' });

            for (var i = 0; i < numLines; i++) {
                var changeOrderLineItem = changeOrder.getSublistValue({ sublistId: 'subline', fieldId: 'item', line: i });

                if (changeOrderLineItem == itemId) {


                    setModifedValues(subscriptionRecord, discountRate, discountRateCap, standardRate, quantity,itemId,sfs_opp)

                }
            }
            for (var i = 0; i < numLines; i++) {
                var changeOrderLineItem = changeOrder.getSublistValue({ sublistId: 'subline', fieldId: 'item', line: i });

                if (changeOrderLineItem == itemId) {


                    setModifedValues(subscriptionRecord, discountRate, discountRateCap, standardRate, quantity,itemId,sfs_opp)

                }
            }
            var changeOrderID = changeOrder.save();

            // Submits to Opportunity record that it has been processed
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


        }

        function setModifedValues(subscriptionRecord, discountRate, discountRateCap, standardRate, quantity,itemId,sfs_opp){
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
                value: quantity
            });

            changeOrder.setSublistValue({
                sublistId: 'subline',
                fieldId: 'discountnew',
                line: i,
                text: discountRate
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
            if (quantity > 3) {
                if (discountRateCap == '' || discountRateCap == null) {
                    var fromVal = 0
                    var value = discountRate
                    for (var m = 0; m < 1; m++) {
                        setTier(m, fromVal, value)
                    }
                }
                else {
                    var fromVal = 0
                    var value = discountRate
                    for (var m = 0; m < 2; m++) {
                        setTier(m, fromVal, value)

                        fromVal = discountRateCap + 1
                        value = standardRate
                    }
                }

            }
            else if (quantity < 3) {
                var fromVal = 0
                var value = discountRate
                for (var m = 0; m < 1; m++) {
                    setTier(m, fromVal, value)
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

        function setTier(m, fromVal, value) {
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

    }

    return {
        afterSubmit: afterSubmit
    }


})