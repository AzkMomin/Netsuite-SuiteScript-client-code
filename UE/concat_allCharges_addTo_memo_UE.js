/**
 *
 
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */

 define(['N/record'], function(record){

     return {
         afterSubmit: function(context){
            if(context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT){
                var newRecord = context.newRecord;
    
                var invoiceId = newRecord.getValue({
                    fieldId: 'id'
                });
    
                var chargeLIneCount = newRecord.getLineCount({
                    sublistId: 'item',
                })
    
                log.debug('lineCount ', chargeLIneCount)
    
                var finalMemoField = "";
    
                for (var i = 0; i < chargeLIneCount; i++){
                    var chargeId = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'charge',
                        line: i,
                    })
    
                    var chargeRecord = record.load({
                        type: record.Type.CHARGE, 
                        id: chargeId
                    });
    
                    log.debug('Charge Record ', chargeRecord);
    
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
     }
    

})