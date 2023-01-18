/**
 *
 
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */

define(['N/record'], function (record) {

    return {
        beforeSubmit: function (context) {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var newRecord = context.newRecord;
                var invRecId = context.newRecord.id;

                var customerId = newRecord.getValue({ 'fieldId': 'entity' });

                var customerRec = record.load({
                    type: 'customer',
                    id: customerId
                })

                var customerEntityId = customerRec.getValue({ 'fieldId': 'entity' });

                const subscriptionSearchColInternalId = search.createColumn({ name: 'internalid' });
                const subscriptionSearchColCustomer = search.createColumn({ name: 'customer' });
                const subscriptionSearchColName = search.createColumn({ name: 'name' });
                const subscriptionSearchColSubscriptionPlan = search.createColumn({ name: 'subscriptionplan' });
                const subscriptionSearch = search.create({
                    type: 'subscription',
                    filters: [
                        ['name', 'is', customerEntityId],
                    ],
                    columns: [
                        subscriptionSearchColInternalId,
                        subscriptionSearchColCustomer,
                        subscriptionSearchColName,
                        subscriptionSearchColSubscriptionPlan,
                    ],
                });
               

                var subId = 0;
                const subscriptionSearchPagedData = subscriptionSearch.runPaged({ pageSize: 1000 });
                for (let i = 0; i < subscriptionSearchPagedData.pageRanges.length; i++) {
                    const subscriptionSearchPage = subscriptionSearchPagedData.fetch({ index: i });
                    subscriptionSearchPage.data.forEach(function (result) {
                        const internalId = result.getValue(subscriptionSearchColInternalId);
                        subId = internalId
                    });
                }

                var subscriptionRec = record.load({
                    type: 'subscription',
                    id: subId
                })

                // var  s= subscriptionRec.getValue({ 'fieldId': 'item' });

                var subscriptionLineCount = subscriptionRec.getLineCount({ sublistId: 'subscriptionline' });

                for (var i = 0; i < subscriptionLineCount; i++) {
                    var subscriptionItem = subscriptionRec.getSublistValue({
                        sublistId: 'subscriptionline',
                        fieldId: 'item',
                        line: i,
                    })

                    if(subscriptionItem == 416){
                        var subscriptionLineId = subscriptionRec.getSublistValue({
                            sublistId: 'subscriptionline',
                            fieldId: 'subscriptionline',
                            line: i,
                        })

                        var subscriptionLineRec = record.load({
                            type: 'subscription_line',
                            id: subscriptionLineId
                        })

                    }
                }
            }
        }
    }


})