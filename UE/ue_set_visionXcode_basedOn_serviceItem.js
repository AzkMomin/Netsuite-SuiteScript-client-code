/**
*@NApiVersion 2.x
*@NScriptType UserEventScript
*/
define(['N/record', 'N/search'],
    function (record, search) {
        function afterSubmit(context) {
            if (context.type == 'create' || context.type == 'edit') {
                var timeSheetRec = record.load({
                    type: "timesheet",
                    id: context.newRecord.id
                })
                var timeSheetLineCount = context.newRecord.getLineCount({ sublistId: 'timeitem' });
                log.debug("timeSheetLineCount : ", timeSheetLineCount);
                for (var i = 0; i < timeSheetLineCount; i++) {
                    var serviceItemID = context.newRecord.getSublistValue({
                        sublistId: "timeitem",
                        fieldId: "item",
                        line: i
                    });
                    var visionXCode = context.newRecord.getSublistValue({
                        sublistId: "timeitem",
                        fieldId: "cseg_paactivitycode_2",
                        line: i
                    });
                    log.debug("visionXCode : ", visionXCode);
                    if (serviceItemID != "" && visionXCode =="") {
                        log.debug(" field changed  empty ")
                        var serviceItem = record.load({
                            type: "serviceitem",
                            id: serviceItemID
                        })

                        var visionXCodeValue = serviceItem.getValue({ fieldId: "custitem_eoh_visionx_code" });
                        log.debug("visionXCodeValue : ", visionXCodeValue);
                        timeSheetRec.setSublistValue({
                            sublistId: "timeitem",
                            fieldId: "cseg_paactivitycode_2",
                            line: i,
                            value: visionXCodeValue
                        });
                    }
                }
                var timeSheetRecID = timeSheetRec.save();
                log.debug("expenseReportRec : ", timeSheetRecID);
            }
        }
        return {
            afterSubmit: afterSubmit
        };
    });