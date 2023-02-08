/**
*@NApiVersion 2.x
*@NScriptType UserEventScript
*/
define(['N/record', 'N/search'],
    function (record, search) {
        function beforeSubmit(context) {
            if (context.type == 'create' || context.type == 'edit') {
                // var expenseReport = record.load({
                //     type: "expensereport",
                //     id: context.newRecord.id
                // })
                var expenseLineCount = context.newRecord.getLineCount({ sublistId: 'expense' });
                log.debug("expenseLineCount : ", expenseLineCount);
                for (var i = 0; i < expenseLineCount; i++) {
                  
                    var customer = context.newRecord.getSublistValue({
                        sublistId: "expense",
                        fieldId: "customer",
                        line: i
                    });
                    
                    if (customer != "") {
                        log.debug("customer : ", customer);
                        var projectRec = record.load({
                            type: "job",
                            id: customer
                        })
                        var projectMgr = projectRec.getValue({ fieldId: "projectmanager" });
                        log.debug("projectMgr : ", projectMgr);

                        context.newRecord.setSublistValue({
                            sublistId: "expense",
                            fieldId: "custcol4",
                            line: i,
                            value: projectMgr
                        });
                        log.debug("projectMgr save: ");
                    }
                }
                // var expenseReportRec = expenseReport.save();
                // log.debug("expenseReportRec : ", expenseReportRec);
            }
        }
       
        return {
            beforeSubmit: beforeSubmit,
            // afterSubmit: afterSubmit
        };
    });