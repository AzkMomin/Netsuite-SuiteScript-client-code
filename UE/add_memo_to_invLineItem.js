/**
 *
 * @NScriptType UserEventScript
 * @NApiVersion 2.1
 */

define(['N/record'], function (record) {

    return {
        beforeSubmit: function (context) {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var newRecord = context.newRecord;


                

                var projectLineCount = newRecord.getLineCount({ sublistId: 'item' });

                for (var i = 0; i < projectLineCount; i++) {
                    //Project Record ID ,
                    var projectRecId = newRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'job',
                        line: i,
                    })

                    var projectRec = record.load({
                        type: 'job',
                        id: projectRecId
                    })

                    //Iterate through Time-Base Rule and Expense-Based Rule ,if line item found in any of those 
                    //Load that item and get the value of description field
                    //Set in custom field present in line item name memo (field id name custcol_memo(plz confirm the field id))
                    
                }
            }
        }
    }


})