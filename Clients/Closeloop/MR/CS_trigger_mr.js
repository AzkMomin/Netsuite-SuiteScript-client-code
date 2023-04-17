/**
*@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/search', 'N/ui/dialog', 'N/task'],
    function (search, dialog, task) {
        function pageInit(context) {
            var currentRec = context.currentRecord;
        }
        function triggerMR(context) {
            log.debug('trigger')
        }


        return {
            pageInit: pageInit,
            triggerMR: triggerMR
        };
    });