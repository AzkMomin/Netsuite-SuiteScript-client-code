/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', "N/record", "N/format"], function (search, record, format) {
    const beforeSubmit = (context) => {
        if (context.type == 'create' || context.type == 'edit') {
            const newRec = context.newRecord;
            const SO_ID = newRec.getValue({ fieldId: "createdfrom" });
            const customerID = newRec.getValue({ fieldId: "entity" });
            log.debug("createdFrom : ", SO_ID)
            log.debug("customerID : ", customerID)
            //Looking for payment method
            var So_Fields = search.lookupFields({
                type: 'salesorder',
                id: SO_ID,
                columns: ['custbody_pay_meth_is_lp']
            });
            log.debug("So_Fields.custbody_pay_meth_is_lp : ", So_Fields.custbody_pay_meth_is_lp)
            var customerFields = search.lookupFields({
                type: 'customer',
                id: customerID,
                columns: ['custentity_lp_balance', "custentity_lp_reference"]
            });
            log.debug("customerFields.custentity_lp_balance : ", customerFields.custentity_lp_balance)

            if (So_Fields.custbody_pay_meth_is_lp) {
                var LP_Balance = customerFields.custentity_lp_balance;
                let isAlerted = false;
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

                        const SORecord = record.load({
                            type: "salesorder",
                            id: SO_ID,
                        });
                        const SO_LineCount = SORecord.getLineCount({ sublistId: "item" });

                        for (let s = 0; s < SO_LineCount; s++) {
                            let SOitemId = newRec.getSublistValue({
                                sublistId: 'item',
                                fieldId: "item",
                                line: s
                            });

                            if (invItemId == SOitemId) {
                                let redeemRate = newRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: "custcol_redemption_rate",
                                    line: s
                                });

                                const qty = newRec.getSublistValue({
                                    sublistId: 'item',
                                    fieldId: "quantity",
                                    line: i
                                });
                                var lp_RedeemAble = qty * redeemRate;
                                // log.debug("lp_RedeemAble : ", lp_RedeemAble);
                                let tempLpBalance = LP_Balance;
                                // log.debug("tempLpBalance : ", tempLpBalance);
                                tempLpBalance -= lp_RedeemAble;
                                if (LP_Balance <= 0 && isAlerted == false) {
                                    window.alert("LPs not redeemed for all items as the LPs balance is zero");
                                    isAlerted = true
                                }

                                newRec.setSublistValue({ sublistId: "item", fieldId: "custcol_redemption_rate", line: i, value: redeemRate });
                                newRec.setSublistValue({ sublistId: "item", fieldId: "custcol_lp_redeemable", line: i, value: lp_RedeemAble });
                                if (tempLpBalance >= 0 && LP_Balance > 0) {// LP balance contains some balance
                                    // log.debug("tempLpBalance >= 0 && LP_Balance > 0 : ");
                                    // log.debug("LP_Balance : ", LP_Balance);
                                    newRec.setSublistValue({ sublistId: "item", fieldId: "custcol_lps_redeened", line: i, value: (lp_RedeemAble) * -1 });
                                    LP_Balance -= lp_RedeemAble;

                                } else if (tempLpBalance <= 0 && LP_Balance > 0) {//LP balance contains some balance but after deduction it would be -ve
                                    // log.debug("tempLpBalance <= 0 && LP_Balance > 0 : ");
                                    // log.debug("LP_Balance : ", LP_Balance);
                                    newRec.setSublistValue({ sublistId: "item", fieldId: "custcol_lps_redeened", line: i, value: (LP_Balance) * -1 });
                                    LP_Balance -= lp_RedeemAble;

                                } else {
                                    newRec.setSublistValue({ sublistId: "item", fieldId: "custcol_lps_redeened", line: i, value: 0 });
                                    log.debug("LP_Balance : ", LP_Balance);
                                }
                            }
                        }
                    }

                    var totalRedeem = 0;
                    for (let i = 0; i < invLineCount; i++) {
                        const lpRedeemed = newRec.getSublistValue({
                            sublistId: 'item',
                            fieldId: "custcol_lps_redeened",
                            line: i
                        });
                        totalRedeem += lpRedeemed;
                    }
                    log.debug("totalRedeem : ", totalRedeem);
                    log.debug("LP Reference ID : ", customerFields.custentity_lp_reference[0].value);
                    newRec.setValue({ fieldId: 'custbody_total_lps_redeemed', value: (totalRedeem) * -1 });
                    newRec.setValue({ fieldId: 'custbody_lp_record_reference', value: customerFields.custentity_lp_reference[0].value });

                    newRec.setSublistValue({ sublistId: "item", fieldId: "item", line: invLineCount, value: 24838 });
                    newRec.setSublistValue({ sublistId: "item", fieldId: "rate", line: invLineCount, value: (totalRedeem) * -1 });
                    newRec.setSublistValue({ sublistId: "item", fieldId: "amount", line: invLineCount, value: (totalRedeem) * -1 });
                    newRec.setSublistValue({ sublistId: "item", fieldId: "custcol_lps_redeened", line: invLineCount, value: totalRedeem });
                }
            }
        }
    }
    return {
        beforeSubmit,
    }
});