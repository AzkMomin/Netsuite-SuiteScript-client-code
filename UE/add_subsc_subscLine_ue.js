/**
 * @NApiversion 2.0
 * @NScriptType UserEventScript
 */

define(['N/record', 'N/search'], function (record, search) {
    return {
        afterSubmit: function (context) {
            if (context.type == context.UserEventType.CREATE) {
                var newRecord = context.newRecord;
                var usageRecordId = context.newRecord.id;

                var custId = newRecord.getValue({ fieldId: 'custrecord_sfs_usage_customer' })

                log.debug('customerId : ' + custId)

                var usageDate = newRecord.getValue('custrecord_sfs_usage_date')
                var usageItem = newRecord.getValue('custrecord_sfs_usage_item')
                var usageQuantity = newRecord.getValue('custrecord_sfs_usage_quantity')
                var usageSubscription = newRecord.getValue('custrecord_sfs_usage_subscription')
                var usageSubscriptionLine = newRecord.getValue('custrecord_sfs_usage_subscription_line')


                // Loading customer record
                var customerRec = record.load({
                    type: record.Type.CUSTOMER,
                    id: custId,
                })

                // Searching for customer's subscription here
                var customerSearchColSubscriptionId = search.createColumn({ name: 'internalid', join: 'subscription' });
                var customerSearch = search.create({
                    type: 'customer',
                    filters: [
                        ['subscription.customer', 'anyof', custId],
                    ],
                    columns: [
                        customerSearchColSubscriptionId,
                    ],
                });
                
                var customerSearchPagedData = customerSearch.runPaged({ pageSize: 10 }); // it will always return 1 value
                var subscriptionId = false;
                
                for (var i = 0; i < customerSearchPagedData.pageRanges.length; i++) {
                    var customerSearchPage = customerSearchPagedData.fetch({ index: i });
                    customerSearchPage.data.forEach(function (result){
                        subscriptionId = result.getValue(customerSearchColSubscriptionId);
                    });
                }

                if (subscriptionId !== false){
                    //found subscription id
                    record.submitFields({
                        type: 'customrecord_sfs_custom_record',
                        id: usageRecordId,
                        values: {custrecord_sfs_usage_subscription: subscriptionId}
                    })

                    var subscriptionRecord = record.load({
                        type: "subscription",
                        id: subscriptionId
                    })

                    var subscriptionLines = subscriptionRecord.getLineCount({
                        sublistId: 'subscriptionline'
                    })

                    log.debug('Subscription Lines :: ', subscriptionLines)


                    var subscriptionLineText = '';
                    var subscriptionLineId = '';
                    var subscriptionLineValue = '';
                    for (var i = 1; i <= subscriptionLines; i++) {

                        var itemId = subscriptionRecord.getSublistValue({
                            sublistId: 'subscriptionline',
                            fieldId: 'item',
                            line: i
                        })

                        if (itemId == usageItem){
                            subscriptionLineId = itemId;

                            subscriptionLineValue = subscriptionRecord.getSublistValue({
                                sublistId: 'subscriptionline',
                                fieldId: 'subscriptionline',
                                line: i
                            })
                        }
                    }

                    if (subscriptionLineValue !== ""){
                        record.submitFields({
                            type: 'customrecord_sfs_custom_record',
                            id: usageRecordId,
                            values: {custrecord_sfs_usage_subscription_line: subscriptionLineValue}
                        })
                    } else {
                        log.debug('Could not find matching subscription line item')
                    }

                } else {
                    log.debug('Customer has no subscription');
                }

            }
        }
    }

});
