/**
*@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/runtime', "N/currentRecord", "N/search", "N/record"],
    function (runtime, currentRecord, search, record) {

        function saveRecord(context) {
            var currentRecord = context.currentRecord
            var employeeId = currentRecord.getValue({ fieldId: "employee" });
            log.debug('employeeId : ',employeeId)
            var employeeFields = search.lookupFields({
                type: 'employee',
                id: employeeId,
                columns: ['employeetype']
            });
            log.debug('eemployeeFields : ',employeeFields)
            var totHours = currentRecord.getValue({ fieldId: "totalhours" });
            log.debug('totHours : ',totHours)

            if (employeeFields.employeetype[0].value == '5' && totHours > 40) {
                window.alert("Contractor hours cant be grater then 40")
                return false
            } else if (employeeFields.employeetype == '5' && totHours > 40) {
                // window.alert("")
                return true
            } else {
                return true

            }

        }

        return {
            saveRecord: saveRecord
        };
    });


