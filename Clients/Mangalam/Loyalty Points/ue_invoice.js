/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', "N/record", 'N/ui/message'], function (search, record, message) {

    const beforeSubmit = (context) => {
        if (context.type == 'create' || context.type == 'edit') {
            try {
                const newRec = context.newRecord;
                const SO_ID = newRec.getValue({ fieldId: "createdfrom" });
                const customerID = newRec.getValue({ fieldId: "entity" });
                log.debug("createdFrom : ", SO_ID)
                log.debug("customerID : ", customerID)

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

                        let LpPointsafterAddition = parseFloat(LP_Fields.custrecord_lp_balance) + (parseFloat(LP_Adjusted))
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
                //Looking for payment method
                var So_Fields = search.lookupFields({
                    type: 'salesorder',
                    id: SO_ID,
                    columns: ['custbody_pay_meth_is_lp']
                });
                // log.debug("So_Fields.custbody_pay_meth_is_lp : ", So_Fields.custbody_pay_meth_is_lp)
                var customerFields = search.lookupFields({
                    type: 'customer',
                    id: customerID,
                    columns: ['custentity_lp_balance', "custentity_lp_reference"]
                });
                // log.debug("LP balance : ", customerFields.custentity_lp_balance)
                // log.debug("Payment Done form loyalty point : ", So_Fields.custbody_pay_meth_is_lp);
                if (So_Fields.custbody_pay_meth_is_lp) {
                    var LP_Balance_wallet = customerFields.custentity_lp_balance;
                    let tempLpBalance = LP_Balance_wallet;
                    var negLineAmt = 0;
                    if (!customerFields.custentity_lp_balance) {

                    } else {
                        // if no Loyalty points availabe 
                        const invLineCount = newRec.getLineCount({ sublistId: "item" });
                        for (let i = 0; i < invLineCount; i++) {
                            const invItemId = newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: "item",
                                line: i
                            });

                            const rate = newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: "rate",
                                line: i
                            });

                            const SORecord = record.load({
                                type: "salesorder",
                                id: SO_ID,
                            });
                            var lineNumber = SORecord.findSublistLineWithValue({
                                sublistId: 'item',
                                fieldId: 'item',
                                value: invItemId
                            });


                            if (lineNumber != -1 && invItemId != 24840) {
                                let redeemRate = SORecord.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: "custcol_redemption_rate",
                                    line: lineNumber
                                });
                                const qty = newRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: "quantity",
                                    line: i
                                });
                                log.debug("redeemRate : ", redeemRate);
                                log.debug("qty : ", qty);


                                var lp_to_be_redeemed = qty * redeemRate;
                                log.debug("lp_to_be_redeemed : ", lp_to_be_redeemed);
                                var lp_RedeemAble = min(tempLpBalance, lp_to_be_redeemed);
                                log.debug("lp_RedeemAble : ", lp_RedeemAble);

                                newRec.setSublistValue({ sublistId: "item", fieldId: "custcol_lp_redeemable", line: i, value: lp_to_be_redeemed });
                                newRec.setSublistValue({ sublistId: "item", fieldId: "custcol_lps_redeemed", line: i, value: lp_RedeemAble });
                                newRec.setSublistValue({ sublistId: "item", fieldId: "custcol_redemption_rate", line: i, value: redeemRate });

                                tempLpBalance -= lp_RedeemAble;
                                log.debug("LP balance remain in wallet : ", tempLpBalance);

                                // Adding all amounts for negative line
                                negLineAmt += ((rate / redeemRate) * lp_to_be_redeemed);

                            }

                        }

                        var totalRedeem = 0;

                        for (let i = 0; i < invLineCount; i++) {

                            const lpRedeemed = newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: "custcol_lps_redeemed",
                                line: i
                            });
                            const itemId = newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: "item",
                                line: i
                            });
                            if (itemId != "24840") {
                                totalRedeem += lpRedeemed;
                            }
                        }
                        // if ((totalRedeem) * -1 > finalAmt) {
                        //     totalRedeem = (parseInt(finalAmt) * -1);
                        // }
                        log.debug("totalRedeem : ", totalRedeem);
                        log.debug("Negative amount to be added : ", negLineAmt);
                        log.debug("LP Reference ID : ", customerFields.custentity_lp_reference[0].value);
                        var lineValue;
                        var LP_discount_line_Number = newRec.findSublistLineWithValue({
                            sublistId: 'item',
                            fieldId: 'item',
                            value: 24840
                        });
                        log.debug("totalRedeem : ", totalRedeem);

                        if (LP_discount_line_Number != -1) {
                            lineValue = LP_discount_line_Number
                        } else {
                            lineValue = invLineCount
                        }

                        newRec.setSublistValue({ sublistId: "item", fieldId: "item", line: lineValue, value: 24840 });
                        newRec.setSublistValue({ sublistId: "item", fieldId: "rate", line: lineValue, value: (negLineAmt) * -1 });
                        newRec.setSublistValue({ sublistId: "item", fieldId: "amount", line: lineValue, value: (negLineAmt) * -1 });
                        newRec.setSublistValue({ sublistId: "item", fieldId: "custcol_lps_redeemed", line: lineValue, value: (totalRedeem) * -1 });


                        var LP_Fields = search.lookupFields({
                            type: 'customrecord_loyalty_points',
                            id: customerFields.custentity_lp_reference[0].value,
                            columns: ['custrecord_lp_balance']
                        });
                        let finalLP_Balance = parseFloat(LP_Fields.custrecord_lp_balance) + (parseFloat((totalRedeem) *-1));
                        // LP balance gets negative after deduction on inv then it will become 0
                        if (finalLP_Balance < 0) {
                            finalLP_Balance = 0;
                        }
                        log.debug("LP Record Final Balance remain after deduction  : ", finalLP_Balance);
                        var LP_RecId = record.submitFields({
                            type: "customrecord_loyalty_points",
                            id: customerFields.custentity_lp_reference[0].value,
                            values: {
                                'custrecord_lp_balance': finalLP_Balance.toFixed(2)
                            }
                        });

                        newRec.setValue({ fieldId: 'custbody_lp_awarded', value: (totalRedeem) *-1 });
                        newRec.setValue({ fieldId: 'custbody_lp_record_reference', value: LP_RecId });
                        newRec.setValue({ fieldId: "custbody_lps_adjusted_redeemed", value: true })
                        log.debug("LP Record Balance Updated with id  : ", LP_RecId);
                    
                    }
                } else {
                    log.debug("Payment Method is selected as Loyalty Points")
                }
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
    function min(LP_Balance, redeemed) {
        var redeemable
        if (LP_Balance >= redeemed) {
            redeemable = redeemed
        } else {
            redeemable = LP_Balance
        }
        return redeemable;
    }

    return {
        beforeSubmit,

    }
});