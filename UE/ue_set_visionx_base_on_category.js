/**
*@NApiVersion 2.x
*@NScriptType UserEventScript
*/
define(['N/record', 'N/search'],
    function (record, search) {
        function afterSubmit(context) {
            if (context.type == 'create' || context.type == 'edit') {
                var expenseReport = record.load({
                    type: "expensereport",
                    id: context.newRecord.id
                })
                var expenseLineCount = context.newRecord.getLineCount({ sublistId: 'expense' });
                log.debug("expenseLineCount : ", expenseLineCount);
                for (var i = 0; i < expenseLineCount; i++) {
                    var category = context.newRecord.getSublistValue({
                        sublistId: "expense",
                        fieldId: "category",
                        line: i
                    });

                    if (category != "") {
                        log.debug(" field changed  empty ")

                        var expenseCategory = record.load({
                            type: "expensecategory",
                            id: category
                        })

                        var visionXCode = expenseCategory.getValue({ fieldId: "cseg_paactivitycode_2" });
                        log.debug("visionXCode : ", visionXCode);
                        expenseReport.setSublistValue({
                            sublistId: "expense",
                            fieldId: "cseg_paactivitycode_2",
                            line: i,
                            value: visionXCode
                        });
                    }
                }
                var expenseReportRec = expenseReport.save();
                log.debug("expenseReportRec : ", expenseReportRec);
            }
        }
        return {
            afterSubmit: afterSubmit
        };
    });