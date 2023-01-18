/**
 * @NApiVersion 2.0
 * @NScriptType UserEventScript
 */
define(['N/record'], 
/**
 * 
 * @param {record} record 
 * @returns 
 */
function(record) {
    return{
        afterSubmit : function(context){
            var employee = context.newRecord
            if(context.type == context.UserEventType.CREATE){
                var phoneCall = record.create({
                    type : record.Type.PHONE_CALL
                })

                phoneCall.setValue('title' , 'Call hr for benfits');
                phoneCall.setValue('assigned' , employee.id)
                phoneCall.save()
            }
        }
    }
    
});