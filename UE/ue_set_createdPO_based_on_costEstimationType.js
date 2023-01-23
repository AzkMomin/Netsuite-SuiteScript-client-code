/**
*@NApiVersion 2.x
*@NScriptType UserEventScript
*/
define(['N/record', 'N/search'],
    function (record, search) {
        function afterSubmit(context) {
            if (context.type == 'create' || context.type == 'edit') {
                var salesOrderRec = record.load({
                    type: "salesorder",
                    id: context.newRecord.id
                })
                var SOLineCount = context.newRecord.getLineCount({ sublistId: 'item' });
                log.debug("expenseLineCount : ", expenseLineCount);
                for (var i = 0; i < SOLineCount; i++) {
                    var createPO = context.newRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: "createpo",
                        line: i
                    });

                    if (createPO != "") {
                        log.debug(" field changed  empty ")
                        salesOrderRec.setSublistValue({
                            sublistId: "item",
                            fieldId: "costestimatetype",
                            line: i,
                            value: "PURCHORDERRATE"
                        });
                    }else{
                        salesOrderRec.setSublistValue({
                            sublistId: "item",
                            fieldId: "costestimatetype",
                            line: i,
                            value: "LASTPURCHPRICE"
                        });
                    }
                }
                var salesOrderRecId = salesOrderRec.save();
                log.debug("salesOrderRecId : ", salesOrderRecId);
            }
        }
        return {
            afterSubmit: afterSubmit
        };
    });