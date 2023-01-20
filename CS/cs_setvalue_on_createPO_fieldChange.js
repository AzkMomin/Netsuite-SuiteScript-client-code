/**
*@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/search', 'N/ui/dialog', "N/record"],
    function (search, dialog, record) {
      
        function fieldChanged(context) {
            
            if(context.sublistId == "item" && context.fieldId == "createpo"){
                log.debug("Changed : ")
                var createPOVal = context.currentRecord.getCurrentSublistValue({
                    sublistId: "item",
                    fieldId: "createpo",
                });
                log.debug("createPOVal : " , createPOVal);
                
                if(createPOVal != ""){
                    log.debug(" field changed  empty ")
                    context.currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "costestimatetype",
                        value : "PURCHORDERRATE"
                    });
                }else{
                  log.debug(" field changed ")
                    context.currentRecord.setCurrentSublistValue({
                        sublistId: "item",
                        fieldId: "costestimatetype",
                        value : "LASTPURCHPRICE"
                    });
                }
            }
            return true;
        }
        return {

            fieldChanged: fieldChanged,

        };
    });
