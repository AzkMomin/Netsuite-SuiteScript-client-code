/**
*@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/runtime', "N/currentRecord"],
    function (runtime, currentRecord) {
        var allowSaving = false;

        function fieldChanged(context) {

            var id = context.fieldId
            if (id == 'custbody_cmms_requesting_contact') { 
                //Check for role is Admin
                var currentRole = runtime.getCurrentUser()
                log.debug("Current Role : " , userObj.role);
                if(currentRole == "3" || currentRole == 3){ 
                    allowSaving = true
                }
            }

            // var currentRole = runtime.getCurrentUser()
            // log.debug("Current Role : " , userObj.role);
           

        }

        function saveRecord(context) {
            log.debug("allowSaving : " , allowSaving)
            var record = currentRecord.get();
            if(allowSaving){

                return true
            }else{
                window.alert("Edit Of Posting Period Is Only Done By Admin")
                return false
            }
        }


        
        return {
            fieldChanged: fieldChanged,
            saveRecord: saveRecord
        };
    });


