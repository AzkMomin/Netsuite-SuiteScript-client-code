/**
 *
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */

define(["N/record", "N/search"], function (record, search) {


    function afterSubmit(context) {
        if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
            var newRecord = context.newRecord;

            var onHold = newRecord.getValue({ fieldId: 'custentity30' });
            if (onHold == false) {
                var hold = false
                var criteria = 'T'
                let SO_IDS = getSoIds(newRecord.id ,criteria);
                log.debug('sales order id : ', SO_IDS)
                getReleased(SO_IDS,hold);
            }else{
                var hold = true
                var criteria = 'F'
                let SO_IDS = getSoIds(newRecord.id,criteria);
                log.debug('sales order id : ', SO_IDS)
                getReleased(SO_IDS,hold);
            }


        }
    }
    function getSoIds(customerId,criteria) {
        let salesOrderIds = []
        const salesorderSearchColName = search.createColumn({ name: 'entity' });
        const salesorderSearchColCustomerCustomOnHoldStatus = search.createColumn({ name: 'custbody48' });
        const salesorderSearchColCustomer = search.createColumn({ name: 'custbody_customer' });
        const salesorderSearchColInternalId = search.createColumn({ name: 'internalid' });
        const salesorderSearch = search.create({
            type: 'salesorder',
            filters: [
                ['mainline', 'is', 'T'],
                'AND',
                ['type', 'anyof', 'SalesOrd'],
                'AND',
                ['name', 'anyof', customerId],
                'AND',
                ['status', 'noneof', 'SalesOrd:A'],
                'AND',
                ['custbody48', 'is', criteria],
            ],
            columns: [
                salesorderSearchColName,
                salesorderSearchColCustomerCustomOnHoldStatus,
                salesorderSearchColCustomer,
                salesorderSearchColInternalId,
            ],
        });

        const salesorderSearchPagedData = salesorderSearch.runPaged({ pageSize: 1000 });
        for (let i = 0; i < salesorderSearchPagedData.pageRanges.length; i++) {
            const salesorderSearchPage = salesorderSearchPagedData.fetch({ index: i });
            salesorderSearchPage.data.forEach((result) => {
                const name = result.getValue(salesorderSearchColName);
                const customerCustomOnHoldStatus = result.getValue(salesorderSearchColCustomerCustomOnHoldStatus);
                const customer = result.getValue(salesorderSearchColCustomer);
                const internalId = result.getValue(salesorderSearchColInternalId);

                salesOrderIds.push(internalId)
            });
        }
        return salesOrderIds
    }
    
    function getReleased(SO_IDS,hold) {
        SO_IDS.forEach((result) => {
            const salesOrderRec = record.load({
                type: 'salesorder',
                id: result,
                isDynamic: true
            })

            salesOrderRec.setValue({ fieldId: 'custbody48', value: hold });
            salesOrderRec.setValue({ fieldId: 'orderstatus', value: 'B' })

            let soId = salesOrderRec.save()
            log.debug('SO Id : ', soId)
        })
    }
    return {

        afterSubmit: afterSubmit
    }


})