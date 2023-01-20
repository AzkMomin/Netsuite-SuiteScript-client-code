/**
*@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/search', 'N/ui/dialog', "N/record"],
    function (search, dialog, record) {
      
        function fieldChanged(context) {
            
            if(context.sublistId == "item" && context.fieldId == "createpo"){
                log.debug("Changed : ")
                if(context.fieldId == "createpo" != ""){
                    log.debug(" field changed Changed ")
                    context.currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "costestimatetype",
                        value : "PURCHORDERRATE"
                    });
                }
                // var fieldValue = context.currentRecord.getCurrentSublistValue({
                //     sublistId: "item",
                //     fieldId: createpo,
                // });
               
            }
            return true;
        }
        return {

            fieldChanged: fieldChanged,

        };
    });
