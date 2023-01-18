/**
 * @NApiVersion 2.1
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
            if (window.confirm("Copy Quote to the same Customer?")) {
                var quoteRecord = record.load({
                    type: recordType,
                    id: recordId,
                    isDynamic: true,
                });

                const customer = quoteRecord.getValue({ fieldId: 'entity' })
                var customerRecord = record.load({
                    type: 'customer',
                    id: customer,
                    isDynamic: true,
                });

                const subsidiary = customerRecord.getValue({ fieldId: 'subsidiary' })
                // subsidiary
                var objRecord = record.copy({
                    type: recordType,
                    id: recordId,
                    isDynamic: true,
                    defaultValues: {
                        subsidiary: subsidiary
                    }
                });

                var quoteRecordSaved = quoteRecord.save()
                log.debug("Quote  Record Saved Id:: ", quoteRecordSaved);
            } else {
                
            }


        } catch (e) {
            log.debug('e : ', e);
        }
    }

    return {
        onAction: onAction,
    };
});
