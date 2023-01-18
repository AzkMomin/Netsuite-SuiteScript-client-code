/**
 * @NApiVersion 2.x
 * @NScriptType workflowactionscript
 */
define(["N/record", "N/runtime"], function (record, runtime) {
    function onAction(context) {
        try {
            var me = runtime.getCurrentScript();
            var recordType = me.getParameter({ name: "custscript_record_type_wa" });
            var recordId = me.getParameter({ name: "custscript_record_id_wa" });
            log.debug('recordType : ', recordType);
            log.debug('recordId : ', recordId);
            var loadedRecord = record.load({
                type: recordType,
                id: recordId,
                isDynamic: true,
            });
            var status = loadedRecord.getValue({
                fieldId: "shipstatus",
            });
            

            if (status == "C") {
                //if status of item fulfillment is shipped, convert sales order to invoice
                var salesOrderId = loadedRecord.getValue({
                    fieldId: "createdfrom",
                });

                log.debug("Sales Order Id :: ", salesOrderId);

                var salesOrderRec = record.load({
                    type: record.Type.SALES_ORDER,
                    id: salesOrderId,
                    isDynamic: true,
                });

                var salesOrderStatus = salesOrderRec.getValue({
                    fieldId: "status",
                });
                log.debug("Sales Order status :: ", salesOrderStatus);
                if (salesOrderStatus != "Billed") {
                    //SO is not already transformed, so convert it now
                    var invoiceRecord = record.transform({
                        fromType: record.Type.SALES_ORDER,
                        fromId: salesOrderId,
                        toType: record.Type.INVOICE,
                        isDynamic: true,
                    });

                    invoiceRecord.setValue({
                        fieldId: "startdate",
                        value: new Date(),
                    });

                    invoiceRecord.save();

                    log.debug("Invoice Record :: ", invoiceRecord);
                    log.debug("Invoice Record Id :: ", invoiceRecord.id);

                    var invRec = record.load({
                        type: record.Type.INVOICE,
                        id: invoiceRecord.id,
                        isDynamic: true,
                    });

                    invRec.save();

                    log.debug("Invoice Record Saved :: ", invoiceRecord.id);
                }
            }

            // loadedRecord.setValue({fieldId : 'custbody_ixs_shipped' , value : true})
            // var itemFulfilmentRecSavedId = loadedRecord.save();
            // log.debug("Invoice Record Saved :: ", invoiceRecord.id);
            
        } catch (e) {
            log.debug('e : ', e);
        }
    }

    return {
        onAction: onAction,
    };
});
