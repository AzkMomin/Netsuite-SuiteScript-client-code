/**
 *
 * @NScriptType UserEventScript
 * @NApiVersion 2.x
 */

define(['N/record'], function (record) {

    return {
        beforeSubmit: function (context) {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var newRecord = context.newRecord;
         	    var newRecordId = context.newRecord.id;

                var chargeLIneCount = newRecord.getLineCount({
                    sublistId: 'item',
                })
                
                var chargeLIneCount = newRecord.getValue({
                    fieldId : 'memo',
                })
       
				var finalMemo = ''
                
                for (var i = 0; i < chargeLIneCount; i++) {
                    var chargeId = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'charge',
                        line: i,
                    })

                    var chargeRecord = record.load({
                        type: record.Type.CHARGE,
                        id: chargeId
                    })

                    var memo = chargeRecord.getValue({
                        fieldId: 'custrecord157'
                    })
                    
                    log.debug('memo : ' , memo)
                  
                    finalMemo +=  memo
         
                }
              	//log.debug('finalMemo : ' + i + ' : ' + finalMemo)
                //newRecord.setValue('memo' , finalMemo)
              	//newRecord.save()
              	log.debug('done')
            

            }
        }
    }


})