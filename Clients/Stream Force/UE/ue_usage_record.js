/**
*@NApiVersion 2.0
*@NScriptType UserEventScript
*/
define(['N/record', 'N/format', 'N/search'],
    function (record, format, search) {
        function beforeSubmit(context) {
            if (context.type != 'view') {
                var usage = context.newRecord;

                var item = usage.getValue({
                    fieldId: "custrecord_sfs_cust_usage_item"
                });
                var customer = usage.getValue({
                    fieldId: "custrecord_sfs_cust_usage_customer"
                });
                var usageDate = usage.getValue({
                    fieldId: "custrecord_sfs_cust_usage_date"
                });
                var tempEndDate = parseInt((new Date(usageDate).getTime() / 1000).toFixed(0))
                var parseUsageData = format.format({ value: new Date(tempEndDate * 1000), type: format.Type.DATE })

                var usageQty = usage.getValue({
                    fieldId: "custrecord_sfs_cust_usage_quantity"
                });
                var subscriptionId = usage.getValue({
                    fieldId: "custrecord_sfs_cust_usage_subscription"
                });

                var subscriptionLine;
                if (subscriptionId != "") {
                    var subscriptionRec = record.load({
                        type: 'subscription',
                        id: subscriptionId
                    })
                    var subscriptionLineCount = subscriptionRec.getLineCount('subscriptionline')
                    for (var i = 0; i < subscriptionLineCount; i++) {
                        var subitem = subscriptionRec.getSublistValue({
                            sublistId: 'subscriptionline',
                            fieldId: 'item',
                            line: i
                        })

                        var status = subscriptionRec.getSublistValue({
                            sublistId: 'subscriptionline',
                            fieldId: 'status',
                            line: i
                        })
                        if (subitem == item && status == 'ACTIVE') {
                            subscriptionLine = subscriptionRec.getSublistValue({
                                sublistId: 'subscriptionline',
                                fieldId: 'subscriptionline',
                                line: i
                            })
                            break;
                        }
                    }

                    log.debug("subscriptionLine " ,subscriptionLine)
                    try {
                        var usageRec = record.create({
                            type: 'usage',
                        })
                        usageRec.setValue({
                            fieldId: "customer",
                            value: customer,

                        });
                        usageRec.setValue({
                            fieldId: "item",
                            value: item,

                        });
                        usageRec.setValue({
                            fieldId: "usagesubscription",
                            value: subscriptionId,

                        });
                        usageRec.setValue({
                            fieldId: "usagesubscriptionline",
                            value: subscriptionLine,

                        });
                        usageRec.setValue({
                            fieldId: "usagequantity",
                            value: usageQty,

                        });
                        usageRec.setValue({
                            fieldId: "usagedate",
                            value: new Date(parseUsageData),
                            ignoreFieldChange: true
                        });

                        //save the usageRecord
                        var usgRec = usageRec.save()
                        log.debug("usgRec : ", usgRec)
                        //record is saved. now mark the processed flag so it does not show up in savedSearch again in this MR
                        record.submitFields({
                            type: 'customrecord_sfs_custom_record',
                            id: usgRec,
                            values: {
                                'custrecord_sfs_usage_processed': 'T'
                            }
                        })

                    } catch (e) {
                        log.debug('Error while creating record with id :: ', e);
                    }
                } else {
                    usage.setValue({fieldId : 'custrecord_error_for_subscription' , value : "Subscription Not Found"})


                }
            }
        }

        return {
            beforeSubmit: beforeSubmit
        };
    });