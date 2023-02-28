/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record','N/format',
], function (search, record,format) {

    function getInputData() {
        const customrecord_sfs_custom_recordSearchColId = search.createColumn({ name: 'id', sort: search.Sort.ASC });
        const customrecord_sfs_custom_recordSearchColScriptId = search.createColumn({ name: 'scriptid' });
        const customrecord_sfs_custom_recordSearchColUsageQuantity = search.createColumn({ name: 'custrecord_sfs_usage_quantity' });
        const customrecord_sfs_custom_recordSearchColSubscriptionLine = search.createColumn({ name: 'custrecord_sfs_usage_subscription_line' });
        const customrecord_sfs_custom_recordSearchColItem = search.createColumn({ name: 'custrecord_sfs_usage_item' });
        const customrecord_sfs_custom_recordSearchColProcessed = search.createColumn({ name: 'custrecord_sfs_usage_processed' });
        const customrecord_sfs_custom_recordSearchColCustomer = search.createColumn({ name: 'custrecord_sfs_usage_customer' });
        const customrecord_sfs_custom_recordSearchColSubscription = search.createColumn({ name: 'custrecord_sfs_usage_subscription' });
        const customrecord_sfs_custom_recordSearchColUsageDate = search.createColumn({ name: 'custrecord_sfs_usage_date' });

        const customUsageSearch = search.create({
            type: 'customrecord_sfs_custom_record',
            filters: [
                ['custrecord_sfs_usage_processed', 'is', 'F'],
            ],
            columns: [
                customrecord_sfs_custom_recordSearchColSubscriptionLine,
                customrecord_sfs_custom_recordSearchColUsageDate,
                customrecord_sfs_custom_recordSearchColItem,
                customrecord_sfs_custom_recordSearchColCustomer,
                customrecord_sfs_custom_recordSearchColSubscription,
                customrecord_sfs_custom_recordSearchColId,
                customrecord_sfs_custom_recordSearchColScriptId,
                customrecord_sfs_custom_recordSearchColUsageQuantity,
                customrecord_sfs_custom_recordSearchColProcessed
            ],
        });

        return customUsageSearch;
    }

    function map(context) {
        var searchResult = JSON.parse(context.value);
        var procressed = searchResult.values.custrecord_sfs_usage_processed
        var custUsageRecordId = searchResult.id

        var customer = searchResult.values.custrecord_sfs_usage_customer.value
        var item = searchResult.values.custrecord_sfs_usage_item.value
        var subscription = searchResult.values.custrecord_sfs_usage_subscription.value
        var subscriptionLine = searchResult.values.custrecord_sfs_usage_subscription_line.value
        var quantity = searchResult.values.custrecord_sfs_usage_quantity
        var usageData = searchResult.values.custrecord_sfs_usage_date
        var tempEndDate = parseInt((new Date(usageData).getTime() / 1000).toFixed(0))
        var parseUsageData = format.format({ value : new Date(tempEndDate * 1000), type : format.Type.DATE})
		
        try{
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
                value: subscription,
                
            });
            usageRec.setValue({
                fieldId: "usagesubscriptionline",
                value: subscriptionLine,
                
            });
            usageRec.setValue({
                fieldId: "usagequantity",
                value: quantity,
                
            });
            usageRec.setValue({
                fieldId: "usagedate",
                value: new Date(parseUsageData),
                ignoreFieldChange: true
            });

            //save the usageRecord
            usageRec.save()

            //record is saved. now mark the processed flag so it does not show up in savedSearch again in this MR
            record.submitFields({
                type: 'customrecord_sfs_custom_record',
                id: custUsageRecordId,
                values: {
                    custrecord_sfs_usage_processed: 'T'
                }
            })
        
        } catch (e){
            log.debug('Error while creating record with id :: ' + custUsageRecordId, e);
        }
    }

    return {
        getInputData: getInputData,
        map: map
    }

});

