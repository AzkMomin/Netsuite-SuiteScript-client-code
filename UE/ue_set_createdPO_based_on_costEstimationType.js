/**
*@NApiVersion 2.x
*@NScriptType UserEventScript
*/
define(['N/record', 'N/search'],
    function (record, search) {
        function beforeSubmit(context) {
           // if (context.type == 'create' || context.type == 'edit') {
               
                var SOLineCount = context.newRecord.getLineCount({ sublistId: 'item' });
                log.debug("SOLineCount : ", SOLineCount);
                for (var i = 0; i < SOLineCount; i++) {
                    var createPO = context.newRecord.getSublistValue({
                        sublistId: "item",
                        fieldId: "createpo",
                        line: i
                    });

                    if (createPO != "") {
                        log.debug(" field changed  empty ")
                        context.newRecord.setSublistValue({
                            sublistId: "item",
                            fieldId: "costestimatetype",
                            line: i,
                            value: "PURCHORDERRATE"
                        });
                    }else{
                        context.newRecord.setSublistValue({
                            sublistId: "item",
                            fieldId: "costestimatetype",
                            line: i,
                            value: "LASTPURCHPRICE"
                        });
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