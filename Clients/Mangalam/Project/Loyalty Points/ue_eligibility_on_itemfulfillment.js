/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', "N/record", "N/format"], function (search, record, format) {
    const beforeSubmit = (context) => {
        if (context.type != 'view' ) {
            try {
                let newRec = context.newRecord;
                let status = newRec.getValue({ fieldId: "shipstatus" });
                log.debug("Status : ", status)
                var equivalentDollarValue = 0;
                //Check for shipped status
                if (status == "C") {
                    let SO_ID = newRec.getValue({ fieldId: "createdfrom" });
                    let customerID = newRec.getValue({ fieldId: "entity" });

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

                            let LpPointsafterDeduction = parseFloat(LP_Fields.custrecord_lp_balance) - (parseFloat(LP_Adjusted))
                            log.debug("Loyalty Point After Deduction : ", LpPointsafterDeduction);
                            var poinintsAdjustedLpRec = record.submitFields({
                                type: 'customrecord_loyalty_points',
                                id: LP_RecId,
                                values: {
                                    'custrecord_lp_balance': LpPointsafterDeduction
                                }
                            });
                            log.debug("Loyalty Point Rec Adjusted After Deduction  ID : ", poinintsAdjustedLpRec);
                        }
                    }
                    var So_Fields = search.lookupFields({
                        type: 'salesorder',
                        id: SO_ID,
                        columns: ['custbody_is_eligible_for_lps', "custbody_pay_meth_is_lp"]
                    });
                    var customerFields = search.lookupFields({
                        type: 'customer',
                        id: customerID,
                        columns: ['custentity_lp_reference']
                    });
                    log.debug("Payment Done form loyalty point : ", So_Fields.custbody_pay_meth_is_lp);
                    log.debug("Is eligible for lps on SO : ", So_Fields.custbody_is_eligible_for_lps);
                    log.debug("reference of LP record on customer : ", customerFields.custentity_lp_reference[0].value);


                    if (So_Fields.custbody_is_eligible_for_lps && customerFields.custentity_lp_reference[0].value != "" && So_Fields.custbody_pay_meth_is_lp == false) {
                        const itemFullLineCount = newRec.getLineCount({ sublistId: "item" });
                        for (let i = 0; i < itemFullLineCount; i++) {
                            let itemFulfillmentItemId = newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: "item",
                                line: i
                            })

                            var SORecord = record.load({
                                type: "salesorder",
                                id: SO_ID,
                            });
                            const SO_LineCount = SORecord.getLineCount({ sublistId: "item" });

                            for (let s = 0; s < SO_LineCount; s++) {
                                let SOitemId = SORecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: "item",
                                    line: s
                                })

                                if (itemFulfillmentItemId == SOitemId) {

                                    let itemFulFillmentQty = newRec.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: "quantity",
                                        line: i
                                    })
                                    let SOitemRate = SORecord.getSublistValue({
                                        sublistId: 'item',
                                        fieldId: "rate",
                                        line: s
                                    })
                                    log.debug("itemFulFillmentQty : ", itemFulFillmentQty);
                                    log.debug("SOitemRate : ", SOitemRate);
                                    equivalentDollarValue += (itemFulFillmentQty * SOitemRate)
                                }
                            }

                        }

                        log.debug("equivalentDollarValue : ", equivalentDollarValue);

                        var LP_Fields = search.lookupFields({
                            type: 'customrecord_loyalty_points',
                            id: customerFields.custentity_lp_reference[0].value,
                            columns: ['custrecord_lp_balance']
                        });

                        let finalLpPoints = parseFloat(LP_Fields.custrecord_lp_balance) + parseFloat(equivalentDollarValue)
                        log.debug('Final loyalty points calculated : ', finalLpPoints);
                        const LPSaveID = record.submitFields({
                            type: "customrecord_loyalty_points",
                            id: customerFields.custentity_lp_reference[0].value,
                            values: {
                                "custrecord_lp_balance": finalLpPoints.toFixed(2)
                            }
                        });

                        log.debug('Final loyalty points calculated saved LP rec id : ', LPSaveID);

                        newRec.setValue({ fieldId: "custbody_lp_record_reference", value: LPSaveID })
                        newRec.setValue({ fieldId: "custbody_lp_awarded", value: equivalentDollarValue })
                        newRec.setValue({ fieldId: "custbody_lps_adjusted_redeemed", value: true })
                    }

                }
            }
            catch (e) {
                log.debug("error : ", e)
            }
        } else if (context.type == "delete") {
            const newRec = context.newRecord;
            let LP_Adjusted_redeemed = newRec.getValue({ fieldId: "custbody_lps_adjusted_redeemed" });
            log.debug("LP_Adjusted_redeemed : ", LP_Adjusted_redeemed);
            if (LP_Adjusted_redeemed) {
                let LP_RecId = newRec.getValue({ fieldId: "custbody_lp_record_reference" });
                let LP_Adjusted = newRec.getValue({ fieldId: "custbody_lp_awarded" });
                log.debug("LP_Adjusted : ", LP_Adjusted);
                var LP_Fields = search.lookupFields({
                    type: 'customrecord_loyalty_points',
                    id: LP_RecId,
                    columns: ['custrecord_lp_balance']
                });

                let LpPointsafterDeduction = parseFloat(LP_Fields.custrecord_lp_balance) - (parseFloat(LP_Adjusted));
                log.debug("Loyalty Point After Deduction : ", LpPointsafterDeduction);
                var poinintsAdjustedLpRec = record.submitFields({
                    type: 'customrecord_loyalty_points',
                    id: LP_RecId,
                    values: {
                        'custrecord_lp_balance': LpPointsafterDeduction
                    }
                });
                log.debug("Loyalty Point Rec Adjusted After Deduction  ID : ", poinintsAdjustedLpRec);
            }
        }
    }
    return {
        beforeSubmit,
    }
});