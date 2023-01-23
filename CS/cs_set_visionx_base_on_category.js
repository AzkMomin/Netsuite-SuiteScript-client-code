/**
*@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/record', 'N/ui/dialog', "N/record"],
    function (record, dialog, record) {
      
        function fieldChanged(context) {
            
            if(context.sublistId == "item" && context.fieldId == "createpo"){
                log.debug("Changed : ")
                var category = context.currentRecord.getCurrentSublistValue({
                    sublistId: "expense",
                    fieldId: "category",
                });
                log.debug("category : " , category);
                
            }
            return true;
        }
        return {

            fieldChanged: fieldChanged,

        };
    });
