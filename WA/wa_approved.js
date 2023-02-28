/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
define(["N/record", "N/runtime"], function (record, runtime) {
    function onAction(context) {
        try {
            // var me = runtime.getCurrentScript();
            // var recordType = me.getParameter({ name: "custscript_record_type_wa" });
            // var recordId = me.getParameter({ name: "custscript_record_id_wa" });
            // log.debug('recordType : ', recordType);
            // log.debug('recordId : ', recordId);

            var ExpenseReportRec = context.newRecord;
            var EReportRecID = context.newRecord.id;
            // var ExpenseReportRec = record.load({
            //     type: "expensereport",
            //     id: EReportRecID,
            //     // isDynamic: true,
            // });


            log.debug("ExpenseReportRecID : ", EReportRecID);
            var employee = ExpenseReportRec.getValue({
                fieldId: "entity",
            });
            log.debug("employee : ", employee);
            var allLinesApproved = true;
            var expenseLineCount = ExpenseReportRec.getLineCount({ sublistId: 'expense' });
            log.debug("expenseLineCount : ", expenseLineCount);
            for (var i = 0; i < expenseLineCount; i++) {
                var category = context.newRecord.getSublistValue({
                    sublistId: "expense",
                    fieldId: "category",
                    line: i
                });
                var customer = context.newRecord.getSublistValue({
                    sublistId: "expense",
                    fieldId: "customer",
                    line: i
                });
                var mgrApproval = context.newRecord.getSublistValue({
                    sublistId: "expense",
                    fieldId: "custcol3",
                    line: i
                });
                if (mgrApproval == false) {
                    allLinesApproved = false
                }
                if (category != "") {
                    var expenseCategory = record.load({
                        type: "expensecategory",
                        id: category
                    })

                    var visionXCode = expenseCategory.getValue({ fieldId: "cseg_paactivitycode_2" });
                    log.debug("visionXCode : ", visionXCode);
                    ExpenseReportRec.selectLine({ sublistId: "expense", line: i });
                    context.newRecord.setCurrentSublistValue({
                        sublistId: "expense",
                        fieldId: "cseg_paactivitycode_2",
                        line: i,
                        value: visionXCode
                    });
                    ExpenseReportRec.commitLine({ sublistId: "expense" });
                }

                if (customer != "") {
                    log.debug("customer : ", customer);
                    var projectRec = record.load({
                        type: "job",
                        id: customer
                    })

                    var projectMgr = projectRec.getValue({ fieldId: "projectmanager" });
                    log.debug("projectMgr : ", projectMgr);
                    if (parseInt(employee) == parseInt(projectMgr)) {
                        var financeMgr = projectRec.getValue({ fieldId: "custentity24" });
                        log.debug("financeMgr : ", financeMgr);
                        ExpenseReportRec.selectLine({ sublistId: "expense", line: i });
                        ExpenseReportRec.setCurrentSublistValue({
                            sublistId: "expense",
                            fieldId: "custcol4",
                            //line: i,
                            value: financeMgr,
                            ignoreFieldChange: true
                        });
                        ExpenseReportRec.commitLine({ sublistId: "expense" });
                    }
                    else {
                        ExpenseReportRec.selectLine({ sublistId: "expense", line: i });
                        ExpenseReportRec.setCurrentSublistValue({
                            sublistId: "expense",
                            fieldId: "custcol4",
                            //line: i,
                            value: projectMgr,
                            ignoreFieldChange: true
                        });
                        log.debug("projectMgr save: ");
                        ExpenseReportRec.commitLine({ sublistId: "expense" });
                    }

                }
            }
            log.debug("allLinesApproved : ", allLinesApproved);
            ExpenseReportRec.setValue({ fieldId: "custbody_all_lines_approved", value: allLinesApproved })

            // var expenseRepRec = ExpenseReportRec.save();
            // log.debug("expenseRepRec saved ID: " , expenseRepRec)

        } catch (e) {
            log.debug('e : ', e);
        }
    }

    return {
        onAction: onAction,
    };
});
