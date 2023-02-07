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

                    if (serviceItemID != "") {
                        log.debug(" field changed  empty ")
                        var serviceItem = record.load({
                            type: "serviceitem",
                            id: serviceItemID
                        })

                        var visionXCode = serviceItem.getValue({ fieldId: "custitem_eoh_visionx_code" });
                        log.debug("visionXCode : ", visionXCode);
                        timeSheetRec.setSublistValue({
                            sublistId: "timeitem",
                            fieldId: "cseg_paactivitycode_2",
                            line: i,
                            value: visionXCode
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