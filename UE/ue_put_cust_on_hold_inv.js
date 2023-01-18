/**
 *
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */

define(["N/record", "N/search"], function (record, search) {


    function afterSubmit(context) {
        if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
            var newRecord = context.newRecord;

            var customerId = newRecord.getValue({ fieldId: 'entity' });
            log.debug('customerId : ', customerId)
            const custRec = record.load({
                type: 'customer',
                id: customerId,
                isDynamic: true
            })

            var overDueAmt = custRec.getValue({ fieldId: 'overduebalance' });
            var balance = custRec.getValue({ fieldId: 'balance' });
            var creditLimit = custRec.getValue({ fieldId: 'creditlimit' });
            
            if (overDueAmt > o) {
                let SO_IDS = getSoIds(customerId)
                putSoOnHold(SO_IDS)
                custRec.setValue({fieldId : 'custentity30' ,value : true})
                custRec.save()
            } else {
                if (balance > creditLimit) {
                    let SO_IDS = getSoIds(customerId)
                    putSoOnHold(SO_IDS)
                    custRec.setValue({fieldId : 'custentity30' ,value : true})
                    custRec.save()
                }
            }

        }
    }
    function getSoIds(customerId) {
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
                ['status', 'noneof', 'SalesOrd:A', 'SalesOrd:H', 'SalesOrd:C', 'SalesOrd:G'],
                'AND',
                ['custbody48', 'is', 'F'],
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
    function putSoOnHold(SO_IDS) {
        SO_IDS.forEach((result) => {
            const salesOrderRec = record.load({
                type: 'salesorder',
                id: result,
                isDynamic: true
            })

            salesOrderRec.setValue({ fieldId: 'custbody48', value: true })

            let soId = salesOrderRec.save()
            log.debug('SO Id : ', soId)
        })
    }
    return {

        afterSubmit: afterSubmit
    }


})