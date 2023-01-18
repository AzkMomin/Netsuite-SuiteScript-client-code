/**
 *
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */

define(["N/record", "N/search"], function (record, search) {


    function afterSubmit(context) {
        if (context.type == context.UserEventType.EDIT) {
            var newRecord = context.newRecord;
            var oldRecord = context.oldRecord;

            var holdNew = newRecord.getValue({ fieldId: 'creditholdoverride' });
            var holdOld = oldRecord.getValue({ fieldId: 'creditholdoverride' });
            log.debug('newRecord.id : ', newRecord.id)
            log.debug('holdOld : ', holdOld)
            log.debug('holdNew : ', holdNew)
            if (holdOld != "OFF" && holdNew == "OFF") {

                let SO_IDS = getSoIds(newRecord.id);
                log.debug('sales order id : ', SO_IDS)
                moveFromPAtoPF(SO_IDS);
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

    function moveFromPAtoPF(SO_IDS) {
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