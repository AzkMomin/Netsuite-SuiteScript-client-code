/**
 * @NApiversion 2.1
 * @NScriptType UserEventScript
 */

define(['N/search', "N/record", "N/format"], function (search, record, format) {
    const beforeSubmit = (context) => {
        if (context.type == 'create' || context.type == 'edit') {
            let newRec = context.newRecord;
            let status = newRec.getValue({ fieldId: "status" });

            var equivalentDollarValue = 0;
            //Check for shipped status
            if (status == "Shipped") {
                let SO_ID = newRec.getValue({ fieldId: "createdfrom" });
                let customerID = newRec.getValue({ fieldId: "entity" });

                var So_Fields = search.lookupFields({
                    type: 'salesorder',
                    id: SO_ID,
                    columns: ['custbody_is_eligible_for_lps']
                });
                var customerFields = search.lookupFields({
                    type: 'customer',
                    id: customerID,
                    columns: ['custentity_lp_reference']
                });

                // let expireIsGraterThenToday = expireIsGrater(customerID)
                log.debug("Is eligible for lps on SO : ", So_Fields.custbody_is_eligible_for_lps);
                log.debug("reference of LP record on customer : ", customerFields.custentity_lp_reference[0].value);
                if (So_Fields.custbody_is_eligible_for_lps && customerFields.custentity_lp_reference[0].value != "") {//Check for isMember is true &&  customer rec contains LP reference
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

                    newRec.setValue({ fieldId: "custbody_lp_record_reference", value: LPSaveID})
                    newRec.setValue({ fieldId: "custbody_lp_awarded", value: equivalentDollarValue })
                }
            }
        }
    }
    return {
        beforeSubmit,
    }
});