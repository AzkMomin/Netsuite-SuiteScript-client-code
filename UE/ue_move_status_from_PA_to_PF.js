/**
 *
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */

define(["N/record", "N/search"], function (record, search) {


    function afterSubmit(context) {
        if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
            var newRecord = context.newRecord;

            var customerId = newRecord.getValue({ fieldId: 'customer' });
            log.debug('customerId : ', customerId);

            const custRec = record.load({
                type: 'customer',
                id: customerId,
                isDynamic: true
            })

            var overDueAmt = custRec.getValue({ fieldId: 'overduebalance' });
            var balance = custRec.getValue({ fieldId: 'consolunbilledorders' }) + custRec.getValue({ fieldId: 'consolbalance' });
            var creditLimit = custRec.getValue({ fieldId: 'creditlimit' });
            var hold = custRec.getValue({ fieldId: 'creditholdoverride' });
            log.debug('overDueAmt : ', overDueAmt);
            log.debug('balance : ', balance);
            log.debug('creditLimit : ', creditLimit);
            log.debug('hold : ', hold);
            if (overDueAmt < 0 && (hold == 'AUTO')) {
                let SO_IDS = getSoIds(customerId);
                putSoOnHold(SO_IDS)

                var customerId = custRec.save()
                log.debug('customerId : ', customerId)

            } else {
                if (balance < creditLimit && (hold == 'AUTO')) {
                    let SO_IDS = getSoIds(customerId);
                    putSoOnHold(SO_IDS)

                    var customerId = custRec.save()
                    log.debug('customerId : ', customerId)
                }
            }

        }
    }
    function getSoIds(customerId) {
        let salesOrderIds = []
        const salesorderSearchColName = search.createColumn({ name: 'entity' });
        const salesorderSearchColDocumentNumber = search.createColumn({ name: 'tranid' });
        const salesorderSearchColInternalId = search.createColumn({ name: 'internalid' });
        const salesorderSearch = search.create({
            type: 'salesorder',
            filters: [
                ['type', 'anyof', 'SalesOrd'],
                'AND',
                ['mainline', 'is', 'T'],
                'AND',
                ['status', 'anyof', 'SalesOrd:A'],
                'AND',
                ['name', 'anyof', customerId],
            ],
            columns: [
                salesorderSearchColName,
                salesorderSearchColDocumentNumber,
                salesorderSearchColInternalId,
            ],
        });

        const salesorderSearchPagedData = salesorderSearch.runPaged({ pageSize: 1000 });
        for (let i = 0; i < salesorderSearchPagedData.pageRanges.length; i++) {
            const salesorderSearchPage = salesorderSearchPagedData.fetch({ index: i });
            salesorderSearchPage.data.forEach((result) => {

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

            salesOrderRec.setValue({ fieldId: 'orderstatus', value: 'B' })

            let soId = salesOrderRec.save()
            log.debug('SO Id : ', soId)
        })
    }
    return {

        afterSubmit: afterSubmit
    }


})