/**
 * @NApiversion 2.0
 * @NscriptType UserEventcript
 */

define([
    'N/record'
],
/**
 * @param {record} record 
 */
function(record) {
    return{
        afterSubmit : function(context){
            let employee = context.newRecord;

            if(context.type == context.UserEventType.CREATE){
                let phoneCall = record.create({
                    type : record.Type.PHONE_CALL
                });

                phoneCall.setValue('title' , 'call HR for benifits');
                phoneCall.setValue('assigned' , employee.id);
                phoneCall.save();

            }   
        }
    }
    
});