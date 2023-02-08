/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', "N/record", "N/format"], function (search, record, format) {
    const beforeSubmit = (context) => {
        if (context.type == 'create' || context.type == 'edit') {
            let newRec = context.newRecord;
            let customerID = newRec.getValue({ fieldId: "entity" });
            log.debug(' customerID : ', customerID)
            let total_LP_to_deducted = 0;
            const RMA_LineCount = newRec.getLineCount({ sublistId: "item" });
            for (let i = 0; i < RMA_LineCount; i++) {
                let amount = newRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: "amount",
                    line: i
                })

                total_LP_to_deducted += amount
            }

            log.debug(' loyalty points to be deducted from LP rec : ', total_LP_to_deducted)

            var customerFields = search.lookupFields({
                type: 'customer',
                id: customerID,
                columns: ['custentity_lp_reference']
            });
            log.debug(' customerFields.custentity_lp_reference : ', customerFields.custentity_lp_reference)
            var LP_Fields = search.lookupFields({
                type: 'customrecord_loyalty_points',
                id: customerFields.custentity_lp_reference[0].value,
                columns: ['custrecord_lp_balance']
            });

            let LP_Balance_Remains = parseFloat(LP_Fields.custrecord_lp_balance) - parseFloat(total_LP_to_deducted);
            log.debug(' loyalty points remains after deducted from LP rec : ', LP_Balance_Remains)
            const LPSaveID = record.submitFields({
                type: "customrecord_loyalty_points",
                id: customerFields.custentity_lp_reference[0].value,
                values: {
                    "custrecord_lp_balance": LP_Balance_Remains.toFixed(2)
                }
            });
            newRec.setValue({ fieldId: 'custbody_lp_awarded', value: (total_LP_to_deducted) * -1 });
            newRec.setValue({ fieldId: 'custbody_lp_record_reference', value: LPSaveID });
            log.debug('Final loyalty points detucted saved LP rec id : ', LPSaveID);


        }
    }
    return {
        beforeSubmit,
    }
});