/**
*@NApiVersion 2.1
*@NScriptType UserEventScript
*/
define(['N/record', 'N/search'],
    function (record, search) {
        function beforeSubmit(context) {
            // if (context.type == 'create' || context.type == 'edit') {

            var SOLineCount = context.newRecord.getLineCount({ sublistId: 'item' });
            log.debug("SOLineCount : ", SOLineCount);
            for (var i = 0; i < SOLineCount; i++) {
                var itemId = context.newRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: "item",
                    line: i
                });

                
                var createPO = context.newRecord.getSublistValue({
                    sublistId: "item",
                    fieldId: "createpo",
                    line: i
                });
                log.debug("createPO : ", createPO)
                const itemSearchColType = search.createColumn({ name: 'type' });
                const itemSearchColInternalId = search.createColumn({ name: 'internalid' });
                const itemSearch = search.create({
                    type: 'item',
                    filters: [
                        ['internalid', 'anyof', itemId],
                    ],
                    columns: [
                        itemSearchColType,
                        itemSearchColInternalId,
                    ],
                });
                var itemType;
                const itemSearchPagedData = itemSearch.runPaged({ pageSize: 1000 });
                for (let i = 0; i < itemSearchPagedData.pageRanges.length; i++) {
                    const itemSearchPage = itemSearchPagedData.fetch({ index: i });
                    itemSearchPage.data.forEach((result) => {
                        const type = result.getValue(itemSearchColType);
                        const internalId = result.getValue(itemSearchColInternalId);
                        itemType = type;
                    });

                }
                log.debug("itemType : ", itemType)

                if (createPO != "") {
                    log.debug(" field changed  empty ")
                    context.newRecord.setSublistValue({
                        sublistId: "item",
                        fieldId: "costestimatetype",
                        line: i,
                        value: "PURCHORDERRATE"
                    });
                } else {
                    if (itemType == "InvtPart") {
                        context.newRecord.setSublistValue({
                            sublistId: "item",
                            fieldId: "costestimatetype",
                            line: i,
                            value: "LASTPURCHPRICE"
                        });
                    }
                }


            }
            // var salesOrderRecId = salesOrderRec.save();
            // log.debug("salesOrderRecId : ", salesOrderRecId);
            //}
        }
        return {
            beforeSubmit: beforeSubmit
        };
    });