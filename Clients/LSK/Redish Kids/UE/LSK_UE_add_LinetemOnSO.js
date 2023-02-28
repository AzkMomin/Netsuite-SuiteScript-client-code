/**
*@NApiVersion 2.1
*@NScriptType UserEventScript
*/
define(['N/record', 'N/search'],
    function (record, search) {
        function afterSubmit(context) {
            if (context.type == 'create' || context.type == 'edit') {
                var soRec = record.load({
                    type: "salesorder",
                    id: context.newRecord.id
                })

                var lastKitIdentifier = soRec.getValue({
                    fieldId: "custbodycustbody_last_kit_identifier",
                });
                log.debug("lastKitIdentifier : ", lastKitIdentifier);
                var itemLineCount = soRec.getLineCount({ sublistId: 'item' });
                log.debug("itemLineCount : ", itemLineCount);
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
        }

        // }
        return {
            afterSubmit: afterSubmit,

        };
    });