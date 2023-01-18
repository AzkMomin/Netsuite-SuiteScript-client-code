/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(["N/record"], function (record) {
    function afterSubmit(context) {
        if (context.type == context.UserEventType.EDIT) {
            var newRecord = context.newRecord;
            var oldRecord = context.oldRecord;

            var oldStatus = oldRecord.getValue({
                fieldId: "shipstatus",
            });

            var status = newRecord.getValue({
                fieldId: "shipstatus",
            });

            log.debug("Item Fulfillment Status :: ", status);

            //we can only transform an SO to invoice once, so we run this only if fulfillment status was changed
            if (oldStatus != status && status == "C") {
                //if status of item fulfillment is shipped, convert sales order to invoice
                var salesOrderId = newRecord.getValue({
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
        }
        else if (context.type == context.UserEventType.CREATE) {
            var newRecord = context.newRecord;
            var oldRecord = context.oldRecord;

           

            var status = newRecord.getValue({
                fieldId: "shipstatus",
            });

            log.debug("Item Fulfillment Status :: ", status);

            //we can only transform an SO to invoice once, so we run this only if fulfillment status was changed
            if ( status == "C") {
                //if status of item fulfillment is shipped, convert sales order to invoice
                var salesOrderId = newRecord.getValue({
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
        }
    }
    return {
        afterSubmit: afterSubmit,
    };
});
