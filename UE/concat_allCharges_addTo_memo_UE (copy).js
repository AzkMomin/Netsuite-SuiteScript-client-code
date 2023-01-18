/**
 *
 
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */

 define(['N/record'], function(record){

    function afterSubmit(context){
        if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT){
            var newRecord = context.newRecord;

            var invoiceId = newRecord.getValue({
                fieldId: 'id'
            });

            var totalChargesSublist = newRecord.getLineCount({
                sublistId: 'item',
            })

            log.debug('Total Charges in Line Items :: ', totalChargesSublist)

            var finalMemoField = "";

            for (var i = 0; i < totalChargesSublist; i++){
                var chargeId = newRecord.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'charge',
                    line: i,
                })

                var chargeRecord = record.load({
                    type: record.Type.CHARGE, 
                    id: chargeId
                });

                log.debug('Charge Record :: ', chargeRecord);

                var memo = chargeRecord.getValue({
                    fieldId: 'memo'
                })

                log.debug('Memo Value :: ' + i + ' :: ', memo);

                finalMemoField += memo + " - ";
            }

            log.debug('Memos found :: ', finalMemoField)

            record.submitFields({
                type: record.Type.INVOICE,
                id: invoiceId,
                values: {
                    memo: finalMemoField
                }
            })
        }
    }

    return {
        afterSubmit: afterSubmit
    }
})