/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', "N/record", "N/format"], function (search, record, format) {
    const beforeSubmit = (context) => {
        if (context.type == 'create' || context.type == 'edit') {
            try {
                let newRec = context.newRecord;
                let customerID = newRec.getValue({ fieldId: "entity" });
                log.debug(' customerID : ', customerID)

                if (context.type == 'edit') {
                    const oldRec = context.oldRecord;
                    let LP_Adjusted_redeemed = newRec.getValue({ fieldId: "custbody_lps_adjusted_redeemed" });
                    if (LP_Adjusted_redeemed) {
                        let LP_RecId = newRec.getValue({ fieldId: "custbody_lp_record_reference" });
                        let LP_Adjusted = oldRec.getValue({ fieldId: "custbody_lp_awarded" });
                        var LP_Fields = search.lookupFields({
                            type: 'customrecord_loyalty_points',
                            id: LP_RecId,
                            columns: ['custrecord_lp_balance']
                        });

                        let LpPointsafterAddition = parseFloat(LP_Fields.custrecord_lp_balance) - (parseFloat(LP_Adjusted))
                        log.debug("Loyalty Point After Addition : ", LpPointsafterAddition);
                        var poinintsAdjustedLpRec = record.submitFields({
                            type: 'customrecord_loyalty_points',
                            id: LP_RecId,
                            values: {
                                'custrecord_lp_balance': LpPointsafterAddition
                            }
                        });
                        log.debug("Loyalty Point Rec Adjusted After Addition  ID : ", poinintsAdjustedLpRec);
                    }
                }

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
                // LP balance gets negative after deduction on RMA then it will become 0
                if (LP_Balance_Remains < 0) {
                    LP_Balance_Remains = 0;
                }
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
                newRec.setValue({ fieldId: "custbody_lps_adjusted_redeemed", value: true })
                log.debug('Final loyalty points detucted saved LP rec id : ', LPSaveID);

            } catch (e) {
                log.debug("error : ", e)
            }
        } else if (context.type == "delete") {
            const newRec = context.newRecord;
            let LP_Adjusted_redeemed = newRec.getValue({ fieldId: "custbody_lps_adjusted_redeemed" });
            if (LP_Adjusted_redeemed) {
                let LP_RecId = newRec.getValue({ fieldId: "custbody_lp_record_reference" });
                let LP_Adjusted = newRec.getValue({ fieldId: "custbody_lp_awarded" });
                var LP_Fields = search.lookupFields({
                    type: 'customrecord_loyalty_points',
                    id: LP_RecId,
                    columns: ['custrecord_lp_balance']
                });

                let LpPointsafterAddition = parseFloat(LP_Fields.custrecord_lp_balance) - (parseFloat(LP_Adjusted))
                log.debug("Loyalty Point After Addition : ", LpPointsafterAddition);
                var poinintsAdjustedLpRec = record.submitFields({
                    type: 'customrecord_loyalty_points',
                    id: LP_RecId,
                    values: {
                        'custrecord_lp_balance': LpPointsafterAddition
                    }
                });
                log.debug("Loyalty Point Rec Adjusted After Addition  ID : ", poinintsAdjustedLpRec);
            }
        }
    }
    return {
        beforeSubmit,
    }
});