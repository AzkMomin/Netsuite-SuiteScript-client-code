/**
*@NApiVersion 2.0
*@NScriptType UserEventScript
*/
define(['N/error', 'N/search'],
    function (error, search) {
        function beforeSubmit(context) {
            if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
                var soRecord = context.newRecord;

                var poCheckNo = soRecord.getValue({
                    fieldId: "otherrefnum"
                })
                if (poCheckNo != '') {

                    if (poCheckNo != '') {
                        var salesorderSearchColDocumentNumber = search.createColumn({ name: 'tranid' });
                        var salesorderSearchColPocheckNumber = search.createColumn({ name: 'otherrefnum' });
                        var salesorderSearch = search.create({
                            type: 'salesorder',
                            filters: [
                                ['type', 'anyof', 'SalesOrd'],
                                'AND',
                                ['otherrefnum', 'equalto', poCheckNo],
                                'AND',
                                ['mainline', 'is', 'T'],
                            ],
                            columns: [
                                salesorderSearchColDocumentNumber,
                                salesorderSearchColPocheckNumber,
                            ],
                        });

                        var salesorderSearchPagedData = salesorderSearch.runPaged({ pageSize: 10 });
                        if (salesorderSearchPagedData.pageRanges.length > 1) {
                            //found an SO with the same PO Number. Disallow the user from saving it.
                            createError();
                            return false;
                        }
                    }
                }


            }
        }

        function createError() {
            var errorText = "PO Number already in use";
            var msg = '<style>.text {display: none;}' // this will hide the JSON message
                + '.bglt td:first-child:not(.textboldnolink):after {'
                + 'color:black;font-size:8pt;' // set the desired css for our message
                + 'content: url(/images/5square.gif) \''
                + errorText
                + '\'}'
                + '</style>';

            var myCustomError = error.create({
                name: 'NO_JSON',
                message: msg,
                notifyOff: true
            });

            log.error('Error: ' + myCustomError.name, myCustomError.message)
            throw myCustomError;
        }

        return {
            beforeSubmit: beforeSubmit
        };
    });