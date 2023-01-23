/**
*@NApiVersion 2.1
*@NScriptType ClientScript
*/
define(['N/search', "N/currentRecord"],
    function (search, currentRecord) {
        
        function pageInit(context) {
            var currentRec = context.currentRecord;
            var jsonStringData = window.localStorage.getItem("currentRecord");
            var jsonData = JSON.parse(jsonStringData);
            log.debug
            return true
        }
        function saveRecord(context) {
            var currentRecord = context.currentRecord;
            
            return true;
        }

        return {
            pageInit: pageInit,
            // saveRecord: saveRecord

        };
    });


