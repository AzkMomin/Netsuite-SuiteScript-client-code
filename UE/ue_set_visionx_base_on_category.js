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
                var allLinesApproved = true;
                var employee = context.newRecord.getValue({
                    fieldId: "entity",
                });
                log.debug("employee : ", employee);
                var expenseLineCount = context.newRecord.getLineCount({ sublistId: 'expense' });

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
                    log.debug("category : ", category);
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
                        context.newRecord.setSublistValue({
                            sublistId: "expense",
                            fieldId: "cseg_paactivitycode_2",
                            line: i,
                            value: visionXCode
                        });
                    }

                    if (customer != "") {
                        log.debug("customer : ", customer);
                        var projectRec = record.load({
                            type: "job",
                            id: customer
                        })

                        var EOH_Prj_Type = projectRec.getValue({ fieldId: "custentity_eoh_project_type" });
                        var projectMgr = projectRec.getValue({ fieldId: "projectmanager" });
                        var financeMgr = projectRec.getValue({ fieldId: "custentity24" });

                        log.debug("EOH_Prj_Type : ", EOH_Prj_Type);
                        log.debug("projectMgr : ", projectMgr);
                        log.debug("financeMgr : ", financeMgr);

                        if (EOH_Prj_Type == "2") {
                            if (employee == projectMgr) {
                                log.debug("Emp == project mgr  ");
                                context.newRecord.setSublistValue({
                                    sublistId: "expense",
                                    fieldId: "custcol4",
                                    line: i,
                                    value: financeMgr,
                                    ignoreFieldChange: true
                                });
                            }else{
                                log.debug("Emp != project mgr  ");
                                context.newRecord.setSublistValue({
                                    sublistId: "expense",
                                    fieldId: "custcol4",
                                    line: i,
                                    value: projectMgr,
                                    ignoreFieldChange: true
                                });
                            }
                        } else if(EOH_Prj_Type == "3"){
                            var empFields = search.lookupFields({
                                type: "employee",
                                id: employee,
                                columns: ['supervisor']
                            });
                            log.debug("supervisor : ", empFields.supervisor);

                            context.newRecord.setSublistValue({
                                sublistId: "expense",
                                fieldId: "custcol4",
                                line: i,
                                value: empFields.supervisor[0].value,
                                ignoreFieldChange: true
                            });
                        }
                    }
                }
                context.newRecord.setValue({ fieldId: "custbody_all_lines_approved", value: allLinesApproved })
                log.debug("allLinesApproved : ", allLinesApproved);
                // var expenseReportRec = expenseReport.save();
                // log.debug("expenseReportRec : ", expenseReportRec);
            }
        }

        // }
        return {
            beforeSubmit: beforeSubmit,

        };
    });