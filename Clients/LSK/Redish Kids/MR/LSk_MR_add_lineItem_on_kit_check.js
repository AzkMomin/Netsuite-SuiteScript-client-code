/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
    'N/search', 'N/record',
], function (search, record) {

    const getInputData = () => {
        //saved search which lists out the invoices where delta dollars are used
        const salesorderSearchColInternalId = search.createColumn({ name: 'internalid' });
        const salesorderSearchColDocumentNumber = search.createColumn({ name: 'tranid' });
        const salesorderSearchColProcessed = search.createColumn({ name: 'custbody_last_kid_process' });
        const salesorderSearch = search.create({
          type: 'salesorder',
          filters: [
            ['type', 'anyof', 'SalesOrd'],
            'AND',
            ['mainline', 'is', 'T'],
            'AND',
            ['custbody_last_kid_process', 'is', 'F'],
            'AND',
            ['internalid', 'anyof', '2023145'],
          ],
          columns: [
            salesorderSearchColInternalId,
            salesorderSearchColDocumentNumber,
            salesorderSearchColProcessed,
          ],
        });
        return salesorderSearch
    }

    const map = (context) => {
        var SO_results = JSON.parse(context.value);
        // log.debug('searchResult : ', SO_results)
        log.debug('searchResult id: ', SO_results.id)

        var soRec = record.load({
            type: "salesorder",
            id: SO_results.id
        })

        var lastKitIdentifier = soRec.getValue({
            fieldId: "custbodycustbody_last_kit_identifier",
        });
        log.debug("lastKitIdentifier : ", lastKitIdentifier);
        var itemLineCount = soRec.getLineCount({ sublistId: 'item' });
        log.debug("itemLineCount : ", itemLineCount);
        soRec.setValue({fieldId : 'custbody_last_kid_process' , value : true})
        if (lastKitIdentifier) {
            soRec.setSublistValue({
                sublistId: "item",
                fieldId: "item",
                line: itemLineCount,
                value: 6870,
                ignoreFieldChange: true
            });
            soRec.setSublistValue({
                sublistId: "item",
                fieldId: "amount",
                line: itemLineCount,
                value: 100,
                ignoreFieldChange: true
            });
        }

        var soSaveRecID = soRec.save();
        log.debug("SO Record save : " , soSaveRecID)


    }

    return {
        getInputData,
        map
    }

});