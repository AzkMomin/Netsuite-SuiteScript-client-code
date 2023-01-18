/**
 * @NApiversion 2.0
 * @NScriptType UserEventScript
 */

require(['N/search'], function (search) {
    return{
        afterSubmit : function (context){
            var emp = context.newRecord;

            var mobileNo = emp.getValue('');

            log.debug(mobileNo)
            var x = "break point";
        }
    }
});