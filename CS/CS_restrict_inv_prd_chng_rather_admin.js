/**
*@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/runtime', "N/currentRecord","N/search","N/record"],
    function (runtime, currentRecord,search,record) {
        //Posting period record closed?
        var ppIsClosed = false;

        function fieldChanged(context) {
            var newRec = context.currentRecord;
            var id = context.fieldId
            if (id == 'postingperiod') { 
                //Check for role is Admin
                var postinPeriodRecID = newRec.getValue({fieldId : "postingperiod"});
                log.debug("postinPeriodRecID :  " , postinPeriodRecID)
                var postingPeriodFields = search.lookupFields({
                    type: "accountingperiod",
                    id: postinPeriodRecID,
                    columns: ['closed']
                });

                log.debug("Posting period closed? :  " , postingPeriodFields.closed)
               
                ppIsClosed = postingPeriodFields.closed;
            }
        }

        function saveRecord(context) {
            log.debug("allowSaving : " , ppIsClosed)
            if(ppIsClosed == false){
                var currentRole = runtime.getCurrentUser().role;
                log.debug("currentRole : " , currentRole)
                if(currentRole == "3" || currentRole == 3){ 
                    return true
                }else{
                    window.alert("Edit Of Posting Period Is Only Done By Admin")
                    return false
                };
            }else{
                return true
            }
        }

        return {
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };
    });


