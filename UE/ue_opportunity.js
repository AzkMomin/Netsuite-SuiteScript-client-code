/**
 * @NScriptName Price Plan updation based on Subscription Record
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */

define(['N/record', 'N/search'], function (record, search) {

    function afterSubmit(context) {
        if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
            var sfs_opp = context.newRecord;

            var sfs_oppIdLIneCount = sfs_opp.getLineCount({
                'sublistId': 'recmachcustrecord_sc_sfs_opp_line_par_opp',
            })

            //Valid products include Fleet Management and Connected Car Services
            var validProductIds = ['414', '416']

            for (var i = 0; i < sfs_oppIdLIneCount; i++) {
                var productId = sfs_opp.getSublistValue({
                    'sublistId': 'recmachcustrecord_sc_sfs_opp_line_par_opp',
                    'fieldId': 'custrecord_sc_sfs_opp_line_item_id',
                    'line': i,
                })

                if (inArray(validProductIds, productId)) {
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
                        discountRate = parseFloat((standardRate * discountPercent) / 100);
                    }

                    var quantity = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_qty' })
                    var discountRateCap = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecordcustrecord_sc_sfs_opp_line_dis' })
                    var withAccount = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_calc_act' })
                    var calcCap = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_calc_cap' })
                    var calcAmt = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_calc_amt' })
                    var calcMethod = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_calc_meth' })
                    var calcPer = sfs_oppLineRecord.getValue({ 'fieldId': 'custrecord_sc_sfs_opp_line_calc_per' })

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

                        if (productId == subscriptionLineItemId) {
                            log.debug('Forwarding Custom fields from Opportunity line to Subscription Line for the following id :: ', subscriptionLineId)
                            //updating line items only for the ones which match with the validProductIds we're iterating
                            try {

                                log.debug('withAcc: '+ withAccount);
                                log.debug('calcCap: '+ calcCap);
                                log.debug('calcAmt: '+ calcAmt);
                                log.debug('calcMethod: '+ calcMethod);
                                log.debug('calcPer: '+ calcPer);
                                log.debug('discRateCap: '+ discountRateCap);
                                // log.debug('discountPercent: ', discountPercent);

                                record.submitFields({
                                    type: 'subscriptionline',
                                    id: subscriptionLineId,
                                    values: {
                                        custrecord_subsline_withacc: withAccount,
                                        custrecord_subsline_calc_cap: calcCap,
                                        custrecord_subsline_cal_amt: calcAmt,
                                        custrecord_subsline_cal_method: calcMethod,
                                        custrecord_subsline_cal_per: calcPer,
                                        custrecord_subsline_disc_r_cap: discountRateCap,
                                        // custrecord_subsline_disc_rate: discountPercent
                                    }
                                })
                            } catch (e) {
                                log.debug('Cannot Submit SubscriptionLine Record Due to :: ', e)
                            }

                        }
                    }
                }


            }
        }
    }


    return {
        afterSubmit: afterSubmit
    }


})

//https://3925851-sb1.app.netsuite.com/app/accounting/subscription/subscriptionline.nl?id=2141
//https://3925851-sb1.app.netsuite.com/app/common/custom/custrecordentry.nl?rectype=521&id=34806